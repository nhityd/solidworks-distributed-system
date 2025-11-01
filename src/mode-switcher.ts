/**
 * Auto Mode Switching Module
 *
 * Implements automatic mode switching between Master and Worker modes based on:
 * 1. User input activity (keyboard/mouse)
 * 2. Master processing execution state
 * 3. Idle time thresholds
 *
 * @see Issue #2.2: Auto Mode Switching Feature
 */

export type NodeMode = 'active_master' | 'standby' | 'idle_worker';

/**
 * Configuration for mode switching behavior
 */
export interface ModeSwitchConfig {
  /** Time since last user input to consider as active (milliseconds) */
  activeThreshold: number;
  /** Time before transition to standby mode (milliseconds) */
  standbyThreshold: number;
  /** Time before transition to idle worker mode (milliseconds) */
  idleThreshold: number;
  /** Polling interval for checking status (milliseconds) */
  pollInterval: number;
  /** Timeout for mode switch operations (milliseconds) */
  switchTimeout: number;
}

/**
 * Default configuration for mode switching
 */
export const DEFAULT_MODE_SWITCH_CONFIG: ModeSwitchConfig = {
  activeThreshold: 5 * 60 * 1000, // 5 minutes
  standbyThreshold: 6 * 60 * 1000, // 6 minutes
  idleThreshold: 6 * 60 * 1000, // 6 minutes
  pollInterval: 1000, // 1 second
  switchTimeout: 5000, // 5 seconds
};

/**
 * Interface for user input tracking
 */
export interface UserInputTracker {
  /** Get the time since last user input in milliseconds */
  getTimeSinceLastInput(): number;

  /** Reset the last input time (for testing) */
  resetLastInput(): void;

  /** Start monitoring user input */
  startMonitoring(): void;

  /** Stop monitoring user input */
  stopMonitoring(): void;
}

/**
 * Interface for master processing state
 */
export interface MasterProcessingState {
  /** Check if master is currently processing */
  isProcessing(): boolean;

  /** Get number of pending tasks */
  getPendingTaskCount(): number;

  /** Get current job ID if processing */
  getCurrentJobId(): string | null;
}

/**
 * Mode switching event listener
 */
export type ModeChangeListener = (
  oldMode: NodeMode,
  newMode: NodeMode,
  reason: string
) => void | Promise<void>;

/**
 * Mode Switcher - Main class for managing automatic mode transitions
 */
export class ModeSwitcher {
  private currentMode: NodeMode = 'active_master';
  private config: ModeSwitchConfig;
  private inputTracker: UserInputTracker;
  private processingState: MasterProcessingState;
  private listeners: Set<ModeChangeListener> = new Set();
  private monitoringTimer: NodeJS.Timeout | null = null;
  private enabled: boolean = false;

  constructor(
    inputTracker: UserInputTracker,
    processingState: MasterProcessingState,
    config: Partial<ModeSwitchConfig> = {}
  ) {
    this.inputTracker = inputTracker;
    this.processingState = processingState;
    this.config = { ...DEFAULT_MODE_SWITCH_CONFIG, ...config };
  }

  /**
   * Start automatic mode monitoring
   */
  public start(): void {
    if (this.enabled) {
      return;
    }

    this.enabled = true;
    this.inputTracker.startMonitoring();
    this.startMonitoring();
  }

  /**
   * Stop automatic mode monitoring
   */
  public stop(): void {
    if (!this.enabled) {
      return;
    }

    this.enabled = false;
    this.inputTracker.stopMonitoring();
    this.stopMonitoring();
  }

  /**
   * Get current node mode
   */
  public getCurrentMode(): NodeMode {
    return this.currentMode;
  }

  /**
   * Determine the appropriate mode based on current state
   *
   * @remarks
   * Implements FR-2.2.3 - Mode determination logic with priorities:
   * 1. Check user activity (highest priority)
   * 2. Check master processing state
   * 3. Check idle time thresholds
   */
  private determineMode(): NodeMode {
    const timeSinceInput = this.inputTracker.getTimeSinceLastInput();

    // Priority 1: User is actively using the machine
    if (timeSinceInput < this.config.activeThreshold) {
      return 'active_master';
    }

    // Priority 2: Master is processing (don't interrupt processing)
    if (this.processingState.isProcessing()) {
      return 'active_master';
    }

    // Priority 3: Check idle time for mode transition
    if (timeSinceInput < this.config.standbyThreshold) {
      return 'standby';
    }

    return 'idle_worker';
  }

  /**
   * Start the monitoring loop
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(
      () => this.checkAndUpdateMode(),
      this.config.pollInterval
    );
  }

  /**
   * Stop the monitoring loop
   */
  private stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }

  /**
   * Check current state and update mode if needed
   */
  private async checkAndUpdateMode(): Promise<void> {
    const newMode = this.determineMode();

    if (newMode !== this.currentMode) {
      await this.switchMode(this.currentMode, newMode);
    }
  }

  /**
   * Execute mode switch operation
   *
   * @remarks
   * Implements FR-2.2.4 - Auto mode switching with proper timing:
   * - Master → Worker: 5 seconds
   * - Worker → Master: 2 seconds (highest priority)
   */
  private async switchMode(oldMode: NodeMode, newMode: NodeMode): Promise<void> {
    const switchTimeout =
      newMode === 'active_master' && oldMode === 'idle_worker'
        ? 2000 // Worker to Master: 2 seconds
        : 5000; // Master to Worker: 5 seconds

    try {
      const switchPromise = this.executeModeSwitch(oldMode, newMode);
      const timeoutPromise = new Promise<void>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Mode switch timeout after ${switchTimeout}ms`)),
          switchTimeout
        )
      );

      await Promise.race([switchPromise, timeoutPromise]);

      this.currentMode = newMode;
      await this.notifyListeners(oldMode, newMode, `Switched from ${oldMode} to ${newMode}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Mode switch failed: ${errorMessage}`);
      await this.notifyListeners(oldMode, oldMode, `Mode switch failed: ${errorMessage}`);
    }
  }

  /**
   * Execute the actual mode switch operations
   */
  private async executeModeSwitch(oldMode: NodeMode, newMode: NodeMode): Promise<void> {
    if (newMode === 'idle_worker') {
      // Master → Worker transition
      await this.transitionToWorker();
    } else if (newMode === 'active_master' && oldMode === 'idle_worker') {
      // Worker → Master transition
      await this.transitionToMaster();
    }
    // standby state doesn't require switching
  }

  /**
   * Transition from Master to Worker mode
   */
  private async transitionToWorker(): Promise<void> {
    // 1. Verify no master jobs are running
    if (this.processingState.isProcessing()) {
      throw new Error('Cannot switch to worker while master jobs are running');
    }

    // 2. Start worker service
    console.log('Starting worker service...');
    await this.startWorkerService();

    // 3. Notify coordination service
    console.log('Notifying coordination service: available as worker');
    await this.notifyCoordinationService('worker_available', true);
  }

  /**
   * Transition from Worker to Master mode
   */
  private async transitionToMaster(): Promise<void> {
    // 1. Check for pending worker tasks
    const pendingTasks = this.processingState.getPendingTaskCount();

    if (pendingTasks > 0) {
      console.log(`Transferring ${pendingTasks} pending tasks to other workers...`);
      await this.transferPendingTasks();
    }

    // 2. Stop worker service
    console.log('Stopping worker service...');
    await this.stopWorkerService();

    // 3. Notify coordination service
    console.log('Notifying coordination service: unavailable as worker');
    await this.notifyCoordinationService('worker_available', false);
  }

  /**
   * Start worker service
   */
  private async startWorkerService(): Promise<void> {
    // This would be implemented to start the actual worker service
    // For now, this is a placeholder
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Stop worker service
   */
  private async stopWorkerService(): Promise<void> {
    // This would be implemented to stop the actual worker service
    // For now, this is a placeholder
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Transfer pending tasks to other workers
   */
  private async transferPendingTasks(): Promise<void> {
    // This would be implemented to transfer tasks via coordination service
    // For now, this is a placeholder
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Notify coordination service of availability changes
   */
  private async notifyCoordinationService(
    event: string,
    available: boolean
  ): Promise<void> {
    // This would be implemented to call the actual coordination service API
    // For now, this is a placeholder
    console.log(`Coordination service notification: ${event} = ${available}`);
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Register a listener for mode changes
   */
  public onModeChange(listener: ModeChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * Unregister a mode change listener
   */
  public offModeChange(listener: ModeChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of mode change
   */
  private async notifyListeners(
    oldMode: NodeMode,
    newMode: NodeMode,
    reason: string
  ): Promise<void> {
    const promises = Array.from(this.listeners).map((listener) =>
      Promise.resolve(listener(oldMode, newMode, reason))
    );

    await Promise.all(promises);
  }
}

/**
 * Mock implementation of UserInputTracker for testing and demo
 */
export class MockUserInputTracker implements UserInputTracker {
  private lastInputTime: number = Date.now();

  getTimeSinceLastInput(): number {
    return Date.now() - this.lastInputTime;
  }

  resetLastInput(): void {
    this.lastInputTime = Date.now();
  }

  startMonitoring(): void {
    // Mock: no actual monitoring
  }

  stopMonitoring(): void {
    // Mock: no actual monitoring
  }
}

/**
 * Mock implementation of MasterProcessingState for testing and demo
 */
export class MockMasterProcessingState implements MasterProcessingState {
  private processing: boolean = false;
  private pendingTasks: number = 0;
  private currentJobId: string | null = null;

  isProcessing(): boolean {
    return this.processing;
  }

  getPendingTaskCount(): number {
    return this.pendingTasks;
  }

  getCurrentJobId(): string | null {
    return this.currentJobId;
  }

  // Test helpers
  setProcessing(processing: boolean, jobId: string | null = null): void {
    this.processing = processing;
    this.currentJobId = jobId;
  }

  setPendingTasks(count: number): void {
    this.pendingTasks = count;
  }
}
