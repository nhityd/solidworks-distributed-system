/**
 * Main Application Component
 *
 * Integrates all UI components for the hybrid node dashboard
 * @see Issue #4: GUI Dashboard Implementation
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard';
import { EventLog, LogEvent, ToastContainer, Toast } from './components/EventLog';
import { SettingsPanel, AppSettings } from './components/SettingsPanel';
import {
  ModeSwitcher,
  MockUserInputTracker,
  MockMasterProcessingState,
  NodeMode,
} from './mode-switcher';
import {
  ManualModeSwitcher,
} from './manual-mode-switcher';

/**
 * Default application settings
 */
const DEFAULT_SETTINGS: AppSettings = {
  activeThreshold: 5 * 60 * 1000,
  standbyThreshold: 6 * 60 * 1000,
  idleThreshold: 6 * 60 * 1000,
  pollInterval: 1000,
  switchTimeout: 5000,
  theme: 'dark',
  autoStart: true,
  notificationSound: true,
};

/**
 * Main Application Component
 */
const App: React.FC = () => {
  // State management
  const [currentMode, setCurrentMode] = useState<NodeMode>('active_master');
  const [isLocked, setIsLocked] = useState(false);
  const [lockedMode, setLockedMode] = useState<NodeMode | null>(null);
  const [timeSinceLastInput, setTimeSinceLastInput] = useState(0);
  const [processingJobCount, setProcessingJobCount] = useState(0);
  const [pendingTaskCount, setPendingTaskCount] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(45);
  const [memoryUsage, setMemoryUsage] = useState(62);
  const [diskUsage, setDiskUsage] = useState(78);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'settings'>(
    'dashboard'
  );

  // Refs for mode switchers
  const modesSwitcherRef = React.useRef<ModeSwitcher | null>(null);
  const manualSwitcherRef = React.useRef<ManualModeSwitcher | null>(null);

  // Initialize mode switchers
  useEffect(() => {
    const inputTracker = new MockUserInputTracker();
    const processingState = new MockMasterProcessingState();

    // Create automatic mode switcher
    modesSwitcherRef.current = new ModeSwitcher(inputTracker, processingState, {
      activeThreshold: settings.activeThreshold,
      standbyThreshold: settings.standbyThreshold,
      idleThreshold: settings.idleThreshold,
      pollInterval: settings.pollInterval,
      switchTimeout: settings.switchTimeout,
    });

    // Create manual mode switcher
    manualSwitcherRef.current = new ManualModeSwitcher(processingState, {
      requireConfirmation: false,
      maxLockDuration: 0,
    });

    // Register mode change listeners
    modesSwitcherRef.current!.onModeChange((oldMode, newMode, reason) => {
      setCurrentMode(newMode);
      addEvent({
        timestamp: new Date(),
        type: 'info',
        message: `モード切替: ${oldMode} → ${newMode}`,
        details: reason,
      });
      addToast({
        id: `mode-${Date.now()}`,
        type: 'info',
        message: `${newMode}に切り替わりました`,
        duration: 3000,
      });
    });

    manualSwitcherRef.current!.onModeChange((oldMode, newMode, reason) => {
      setCurrentMode(newMode);
      addEvent({
        timestamp: new Date(),
        type: 'info',
        message: `手動モード切替: ${oldMode} → ${newMode}`,
        details: reason,
      });
    });

    // Cleanup
    return () => {
      modesSwitcherRef.current?.stop();
    };
  }, [settings]);

  // Simulate resource monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate changing metrics
      setCpuUsage((prev) => {
        const change = Math.random() * 10 - 5;
        return Math.max(0, Math.min(100, prev + change));
      });

      setMemoryUsage((prev) => {
        const change = Math.random() * 5 - 2;
        return Math.max(0, Math.min(100, prev + change));
      });

      setDiskUsage((prev) => {
        const change = Math.random() * 3 - 1;
        return Math.max(0, Math.min(100, prev + change));
      });

      // Simulate job count changes
      if (currentMode === 'active_master') {
        setProcessingJobCount((prev) => Math.max(0, prev + Math.random() - 0.5));
      } else {
        setProcessingJobCount(0);
      }

      // Simulate task count changes
      if (currentMode === 'idle_worker') {
        setPendingTaskCount((prev) => Math.max(0, prev + Math.random() - 0.3));
      } else {
        setPendingTaskCount(0);
      }

      // Update time since last input
      setTimeSinceLastInput((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentMode]);

  const addEvent = useCallback((event: LogEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleModeSwitch = async (targetMode: NodeMode) => {
    if (!manualSwitcherRef.current) return;

    try {
      await manualSwitcherRef.current.requestModeSwitch(targetMode);
      addEvent({
        timestamp: new Date(),
        type: 'success',
        message: `モード切替完了: ${targetMode}`,
      });
      addToast({
        id: `success-${Date.now()}`,
        type: 'success',
        message: 'モード切替が完了しました',
        duration: 2000,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addEvent({
        timestamp: new Date(),
        type: 'error',
        message: 'モード切替エラー',
        details: message,
      });
      addToast({
        id: `error-${Date.now()}`,
        type: 'error',
        message: `エラー: ${message}`,
        duration: 5000,
      });
    }
  };

  const handleLockMode = (mode?: NodeMode) => {
    if (!manualSwitcherRef.current) return;

    const targetMode = mode || currentMode;
    manualSwitcherRef.current.lockMode(targetMode);
    setIsLocked(true);
    setLockedMode(targetMode);

    addEvent({
      timestamp: new Date(),
      type: 'info',
      message: `モード固定: ${targetMode}`,
    });
    addToast({
      id: `lock-${Date.now()}`,
      type: 'info',
      message: `${targetMode}に固定されました`,
      duration: 2000,
    });
  };

  const handleUnlockMode = () => {
    if (!manualSwitcherRef.current) return;

    manualSwitcherRef.current.unlockMode();
    setIsLocked(false);
    setLockedMode(null);

    addEvent({
      timestamp: new Date(),
      type: 'info',
      message: 'モード固定を解除しました',
    });
    addToast({
      id: `unlock-${Date.now()}`,
      type: 'info',
      message: 'モード固定が解除されました',
      duration: 2000,
    });
  };

  const handleSettingsSave = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  const handleSettingsReset = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <div style={styles.appContainer}>
      {/* Navigation Tabs */}
      <div style={styles.navTabs}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'dashboard' ? styles.navButtonActive : {}),
          }}
        >
          📊 ダッシュボード
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'logs' ? styles.navButtonActive : {}),
          }}
        >
          📋 ログ
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            ...styles.navButton,
            ...(activeTab === 'settings' ? styles.navButtonActive : {}),
          }}
        >
          ⚙️ 設定
        </button>
      </div>

      {/* Content Area */}
      <div style={styles.content}>
        {activeTab === 'dashboard' && (
          <Dashboard
            currentMode={currentMode}
            timeSinceLastInput={timeSinceLastInput}
            processingJobCount={Math.round(processingJobCount)}
            pendingTaskCount={Math.round(pendingTaskCount)}
            cpuUsage={Math.round(cpuUsage)}
            memoryUsage={Math.round(memoryUsage)}
            diskUsage={Math.round(diskUsage)}
            isLocked={isLocked}
            lockedMode={lockedMode}
            onModeSwitch={handleModeSwitch}
            onLockMode={handleLockMode}
            onUnlockMode={handleUnlockMode}
          />
        )}

        {activeTab === 'logs' && <EventLog events={events} />}

        {activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onSave={handleSettingsSave}
            onReset={handleSettingsReset}
          />
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

/**
 * Styles
 */
const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#0F1419',
    color: '#E5E7EB',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
  },

  navTabs: {
    display: 'flex',
    gap: 0,
    backgroundColor: '#111827',
    borderBottom: '2px solid #374151',
    padding: '0',
  },

  navButton: {
    flex: 1,
    padding: '15px 20px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    backgroundColor: '#111827',
    color: '#9CA3AF',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderBottom: '3px solid transparent',
  },

  navButtonActive: {
    color: '#F3F4F6',
    backgroundColor: '#1F2937',
    borderBottomColor: '#3B82F6',
  },

  content: {
    flex: 1,
    padding: '30px',
    overflowY: 'auto',
  },
};

export default App;
