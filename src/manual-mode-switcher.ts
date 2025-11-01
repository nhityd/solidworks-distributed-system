/**
 * Manual Mode Switching Module
 *
 * Implements manual mode switching with fixed state capability.
 * Allows users to explicitly switch between Master and Worker modes
 * and optionally lock the mode to prevent automatic switching.
 *
 * @see Issue #3: Manual Mode Switching Feature
 */

import { NodeMode, MasterProcessingState, ModeChangeListener } from './mode-switcher';

export type LockState = 'locked' | 'unlocked';

/**
 * Manual mode switching operations
 */
export interface ManualModeSwitcherConfig {
  /** Whether mode changes require explicit confirmation */
  requireConfirmation: boolean;
  /** Maximum time a mode can be locked (milliseconds, 0 = unlimited) */
  maxLockDuration: number;
}

/**
 * Default configuration for manual mode switching
 */
export const DEFAULT_MANUAL_MODE_CONFIG: ManualModeSwitcherConfig = {
  requireConfirmation: false,
  maxLockDuration: 0, // Unlimited by default
};

/**
 * Manual Mode Switcher - Allows explicit user control of node mode
 */
export class ManualModeSwitcher {
  private currentMode: NodeMode = 'active_master';
  private lockState: LockState = 'unlocked';
  private lockedMode: NodeMode | null = null;
  private lockTime: number | null = null;
  private config: ManualModeSwitcherConfig;
  private processingState: MasterProcessingState;
  private listeners: Set<ModeChangeListener> = new Set();
  private pendingConfirmation: {
    targetMode: NodeMode;
    timestamp: number;
    requestId: string;
  } | null = null;

  constructor(
    processingState: MasterProcessingState,
    config: Partial<ManualModeSwitcherConfig> = {}
  ) {
    this.processingState = processingState;
    this.config = { ...DEFAULT_MANUAL_MODE_CONFIG, ...config };
  }

  /**
   * Get current node mode
   */
  public getCurrentMode(): NodeMode {
    return this.currentMode;
  }

  /**
   * Get current lock state
   */
  public getLockState(): LockState {
    return this.lockState;
  }

  /**
   * Get locked mode if applicable
   */
  public getLockedMode(): NodeMode | null {
    return this.lockedMode;
  }

  /**
   * Switch mode manually
   *
   * @param targetMode - The mode to switch to
   * @param requestId - Optional request ID for tracking
   * @returns Request ID if confirmation is required, null if switch was executed
   */
  public async requestModeSwitch(
    targetMode: NodeMode,
    requestId: string = this.generateRequestId()
  ): Promise<string | null> {
    // If mode is locked, reject the request unless unlocking
    if (this.lockState === 'locked' && this.lockedMode !== targetMode) {
      throw new Error(
        `Mode is locked to ${this.lockedMode}. Unlock before switching.`
      );
    }

    // If confirmation is required, store pending request
    if (this.config.requireConfirmation) {
      this.pendingConfirmation = {
        targetMode,
        timestamp: Date.now(),
        requestId,
      };
      return requestId;
    }

    // Execute the switch immediately
    await this.executeModeSwitch(targetMode);
    return null;
  }

  /**
   * Confirm a pending mode switch request
   *
   * @param requestId - The request ID to confirm
   */
  public async confirmModeSwitch(requestId: string): Promise<void> {
    if (!this.pendingConfirmation || this.pendingConfirmation.requestId !== requestId) {
      throw new Error('Invalid or expired request ID');
    }

    const { targetMode } = this.pendingConfirmation;
    this.pendingConfirmation = null;

    await this.executeModeSwitch(targetMode);
  }

  /**
   * Cancel a pending mode switch request
   *
   * @param requestId - The request ID to cancel
   */
  public cancelModeSwitch(requestId: string): void {
    if (this.pendingConfirmation && this.pendingConfirmation.requestId === requestId) {
      this.pendingConfirmation = null;
    }
  }

  /**
   * Lock the current mode to prevent automatic switching
   *
   * @param mode - The mode to lock to (defaults to current mode)
   */
  public lockMode(mode?: NodeMode): void {
    this.lockedMode = mode || this.currentMode;
    this.lockState = 'locked';
    this.lockTime = Date.now();

    console.log(
      `Mode locked to ${this.lockedMode} at ${new Date(this.lockTime).toISOString()}`
    );
  }

  /**
   * Unlock the mode to allow automatic switching
   */
  public unlockMode(): void {
    const wasLocked = this.lockState === 'locked';

    this.lockState = 'unlocked';
    this.lockedMode = null;
    this.lockTime = null;

    if (wasLocked) {
      console.log(`Mode unlocked at ${new Date().toISOString()}`);
    }
  }

  /**
   * Check if mode lock duration has exceeded maximum
   */
  public isLockExpired(): boolean {
    if (
      this.lockState === 'unlocked' ||
      !this.lockTime ||
      this.config.maxLockDuration === 0
    ) {
      return false;
    }

    const elapsedTime = Date.now() - this.lockTime;
    return elapsedTime > this.config.maxLockDuration;
  }

  /**
   * Force unlock if maximum duration exceeded
   */
  public enforceMaxLockDuration(): void {
    if (this.isLockExpired()) {
      console.warn('Lock duration exceeded maximum, forcing unlock');
      this.unlockMode();
    }
  }

  /**
   * Get information about current lock status
   */
  public getLockInfo(): {
    state: LockState;
    lockedMode: NodeMode | null;
    lockTime: Date | null;
    elapsedMs: number;
    isExpired: boolean;
  } {
    const elapsedMs = this.lockTime ? Date.now() - this.lockTime : 0;

    return {
      state: this.lockState,
      lockedMode: this.lockedMode,
      lockTime: this.lockTime ? new Date(this.lockTime) : null,
      elapsedMs,
      isExpired: this.isLockExpired(),
    };
  }

  /**
   * Get pending confirmation request info
   */
  public getPendingConfirmation(): {
    targetMode: NodeMode;
    requestId: string;
    age: number;
  } | null {
    if (!this.pendingConfirmation) {
      return null;
    }

    return {
      targetMode: this.pendingConfirmation.targetMode,
      requestId: this.pendingConfirmation.requestId,
      age: Date.now() - this.pendingConfirmation.timestamp,
    };
  }

  /**
   * Execute the actual mode switch
   */
  private async executeModeSwitch(newMode: NodeMode): Promise<void> {
    const oldMode = this.currentMode;

    // Validate that switch is safe
    if (newMode === 'idle_worker' && this.processingState.isProcessing()) {
      throw new Error(
        'Cannot switch to worker mode while master jobs are processing'
      );
    }

    try {
      // Execute mode-specific transition logic
      if (newMode === 'active_master') {
        await this.transitionToMaster(oldMode);
      } else if (newMode === 'idle_worker') {
        await this.transitionToWorker(oldMode);
      } else if (newMode === 'standby') {
        await this.transitionToStandby();
      }

      this.currentMode = newMode;
      await this.notifyListeners(oldMode, newMode, `Manually switched to ${newMode}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Mode switch failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Transition to Master mode
   */
  private async transitionToMaster(fromMode: NodeMode): Promise<void> {
    console.log(`Transitioning from ${fromMode} to active_master...`);

    if (fromMode === 'idle_worker') {
      // Stop worker service
      await this.stopWorkerService();
    }

    // Start master services if needed
    await this.startMasterServices();

    // Notify coordination service
    await this.notifyCoordinationService('worker_available', false);
  }

  /**
   * Transition to Worker mode
   */
  private async transitionToWorker(fromMode: NodeMode): Promise<void> {
    console.log(`Transitioning from ${fromMode} to idle_worker...`);

    // Verify no processing
    if (this.processingState.isProcessing()) {
      throw new Error('Master jobs still processing');
    }

    // Transfer any pending tasks
    const pendingCount = this.processingState.getPendingTaskCount();
    if (pendingCount > 0) {
      await this.transferPendingTasks(pendingCount);
    }

    // Start worker service
    await this.startWorkerService();

    // Notify coordination service
    await this.notifyCoordinationService('worker_available', true);
  }

  /**
   * Transition to Standby mode
   */
  private async transitionToStandby(): Promise<void> {
    console.log('Transitioning to standby...');
    // Standby state is passive, no special transition needed
  }

  /**
   * Start master services
   */
  private async startMasterServices(): Promise<void> {
    console.log('Starting master services...');
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Stop worker service
   */
  private async stopWorkerService(): Promise<void> {
    console.log('Stopping worker service...');
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Start worker service
   */
  private async startWorkerService(): Promise<void> {
    console.log('Starting worker service...');
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Transfer pending tasks to other workers
   */
  private async transferPendingTasks(count: number): Promise<void> {
    console.log(`Transferring ${count} pending tasks...`);
    return new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Notify coordination service of availability changes
   */
  private async notifyCoordinationService(
    event: string,
    available: boolean
  ): Promise<void> {
    console.log(`[CoordinationService] ${event}: ${available}`);
    return new Promise((resolve) => setTimeout(resolve, 50));
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

  /**
   * Generate a unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
