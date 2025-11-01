/**
 * Main Dashboard Component
 *
 * Central UI for displaying and managing hybrid node modes
 * @see Issue #4: GUI Dashboard Implementation
 */

import React, { useState, useEffect } from 'react';
import { NodeMode } from '../mode-switcher';

interface DashboardProps {
  currentMode: NodeMode;
  timeSinceLastInput: number;
  processingJobCount: number;
  pendingTaskCount: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  isLocked: boolean;
  lockedMode: NodeMode | null;
  onModeSwitch: (targetMode: NodeMode) => Promise<void>;
  onLockMode: (mode?: NodeMode) => void;
  onUnlockMode: () => void;
}

/**
 * Color scheme for different modes
 */
const MODE_COLORS: Record<NodeMode, string> = {
  active_master: '#3B82F6',  // Blue
  idle_worker: '#10B981',    // Green
  standby: '#6B7280',        // Gray
};

const MODE_LABELS: Record<NodeMode, string> = {
  active_master: 'アクティブマスター',
  idle_worker: 'アイドルワーカー',
  standby: 'スタンバイ',
};

const MODE_ICONS: Record<NodeMode, string> = {
  active_master: '🔵',
  idle_worker: '🟢',
  standby: '⚪',
};

/**
 * Dashboard Component
 */
export const Dashboard: React.FC<DashboardProps> = ({
  currentMode,
  timeSinceLastInput,
  processingJobCount,
  pendingTaskCount,
  cpuUsage,
  memoryUsage,
  diskUsage,
  isLocked,
  lockedMode,
  onModeSwitch,
  onLockMode,
  onUnlockMode,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<NodeMode | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleModeSwitch = async (targetMode: NodeMode) => {
    // Prevent switching if mode is locked
    if (isLocked && lockedMode !== targetMode) {
      alert(`モードが${MODE_LABELS[lockedMode!]}に固定されています`);
      return;
    }

    setSelectedMode(targetMode);
    setShowConfirmation(true);
  };

  const confirmModeSwitch = async () => {
    if (!selectedMode) return;

    setIsLoading(true);
    try {
      await onModeSwitch(selectedMode);
      setShowConfirmation(false);
    } catch (error) {
      alert(`モード切替エラー: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}時間 ${minutes % 60}分`;
    if (minutes > 0) return `${minutes}分 ${seconds % 60}秒`;
    return `${seconds}秒`;
  };

  return (
    <div className="dashboard" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>
          🌸 ハイブリッドノード モード管理ダッシュボード
        </h1>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Mode Display */}
        <div style={styles.modeDisplay}>
          <div
            style={{
              ...styles.modeBadge,
              backgroundColor: MODE_COLORS[currentMode],
            }}
          >
            <div style={styles.modeIcon}>{MODE_ICONS[currentMode]}</div>
            <div style={styles.modeLabel}>{MODE_LABELS[currentMode]}</div>
          </div>

          {/* Status Info */}
          <div style={styles.statusInfo}>
            <div style={styles.statusRow}>
              <span style={styles.label}>最後の入力:</span>
              <span style={styles.value}>{formatTime(timeSinceLastInput)}</span>
            </div>

            {currentMode === 'active_master' && (
              <div style={styles.statusRow}>
                <span style={styles.label}>実行中のジョブ:</span>
                <span style={styles.value}>{processingJobCount}件</span>
              </div>
            )}

            {currentMode === 'idle_worker' && (
              <div style={styles.statusRow}>
                <span style={styles.label}>割り当てタスク:</span>
                <span style={styles.value}>{pendingTaskCount}件</span>
              </div>
            )}

            {/* Lock Status */}
            {isLocked && (
              <div style={{ ...styles.statusRow, color: '#EF4444' }}>
                <span style={styles.label}>🔒 モード固定:</span>
                <span style={styles.value}>{MODE_LABELS[lockedMode!]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mode Switch Controls */}
        <div style={styles.controlsSection}>
          <h2 style={styles.sectionTitle}>モード切替</h2>

          <div style={styles.buttonGrid}>
            {(['active_master', 'idle_worker', 'standby'] as NodeMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeSwitch(mode)}
                  disabled={isLoading || currentMode === mode || (isLocked && lockedMode !== mode)}
                  style={{
                    ...styles.modeButton,
                    ...(currentMode === mode ? styles.modeButtonActive : {}),
                    ...(isLoading ? styles.modeButtonDisabled : {}),
                  }}
                >
                  <div style={styles.buttonIcon}>{MODE_ICONS[mode]}</div>
                  <div>{MODE_LABELS[mode]}</div>
                </button>
              )
            )}
          </div>
        </div>

        {/* System Monitor */}
        <div style={styles.controlsSection}>
          <h2 style={styles.sectionTitle}>システムリソース</h2>

          <div style={styles.monitorGrid}>
            <ResourceBar label="CPU" value={cpuUsage} />
            <ResourceBar label="メモリ" value={memoryUsage} />
            <ResourceBar label="ディスク" value={diskUsage} />
          </div>
        </div>

        {/* Lock Control */}
        <div style={styles.controlsSection}>
          <h2 style={styles.sectionTitle}>モード固定管理</h2>

          {isLocked ? (
            <div style={styles.lockStatus}>
              <p>🔒 現在のモード: {MODE_LABELS[lockedMode!]}</p>
              <button
                onClick={onUnlockMode}
                style={styles.unlockButton}
              >
                モード固定を解除
              </button>
            </div>
          ) : (
            <button
              onClick={() => onLockMode(currentMode)}
              style={styles.lockButton}
            >
              現在のモードに固定
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && selectedMode && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>モード切替確認</h3>
            <p>
              {MODE_LABELS[currentMode]} から{' '}
              {MODE_LABELS[selectedMode]} に切り替えますか？
            </p>

            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowConfirmation(false)}
                style={styles.cancelButton}
              >
                キャンセル
              </button>
              <button
                onClick={confirmModeSwitch}
                disabled={isLoading}
                style={styles.confirmButton}
              >
                {isLoading ? '切替中...' : '確認'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Resource Bar Component
 */
interface ResourceBarProps {
  label: string;
  value: number; // 0-100
}

const ResourceBar: React.FC<ResourceBarProps> = ({ label, value }) => {
  const getColor = (val: number): string => {
    if (val < 50) return '#10B981'; // Green
    if (val < 80) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  return (
    <div style={styles.resourceBar}>
      <div style={styles.resourceLabel}>
        <span>{label}</span>
        <span style={styles.resourceValue}>{value}%</span>
      </div>
      <div style={styles.progressBarContainer}>
        <div
          style={{
            ...styles.progressBar,
            width: `${value}%`,
            backgroundColor: getColor(value),
          }}
        />
      </div>
    </div>
  );
};

/**
 * Styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    padding: '20px',
    maxWidth: '1024px',
    margin: '0 auto',
    backgroundColor: '#1F2937',
    color: '#E5E7EB',
    borderRadius: '8px',
    minHeight: '100vh',
  },

  header: {
    marginBottom: '30px',
    borderBottom: '2px solid #374151',
    paddingBottom: '20px',
  },

  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#F3F4F6',
  },

  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
  },

  modeDisplay: {
    gridColumn: '1 / -1',
    display: 'flex',
    gap: '30px',
    alignItems: 'center',
    padding: '30px',
    backgroundColor: '#111827',
    borderRadius: '8px',
    border: '1px solid #374151',
  },

  modeBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  },

  modeIcon: {
    fontSize: '60px',
    marginBottom: '10px',
  },

  modeLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },

  statusInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #374151',
  },

  label: {
    fontSize: '14px',
    color: '#9CA3AF',
    fontWeight: '500',
  },

  value: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#F3F4F6',
  },

  controlsSection: {
    padding: '20px',
    backgroundColor: '#111827',
    borderRadius: '8px',
    border: '1px solid #374151',
  },

  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#F3F4F6',
  },

  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '15px',
  },

  modeButton: {
    padding: '15px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: '2px solid #374151',
    borderRadius: '6px',
    backgroundColor: '#374151',
    color: '#E5E7EB',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
  },

  modeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#1D4ED8',
    cursor: 'not-allowed',
  },

  modeButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  buttonIcon: {
    fontSize: '32px',
  },

  monitorGrid: {
    display: 'grid',
    gap: '15px',
  },

  resourceBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  resourceLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#D1D5DB',
  },

  resourceValue: {
    fontWeight: 'bold',
    color: '#F3F4F6',
  },

  progressBarContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: '#4B5563',
    borderRadius: '4px',
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    transition: 'width 0.3s ease',
  },

  lockStatus: {
    padding: '15px',
    backgroundColor: '#3F3F3F',
    borderRadius: '6px',
    color: '#E5E7EB',
  },

  lockButton: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#10B981',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },

  unlockButton: {
    marginTop: '10px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#EF4444',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },

  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },

  modalContent: {
    backgroundColor: '#111827',
    padding: '30px',
    borderRadius: '8px',
    border: '1px solid #374151',
    minWidth: '300px',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)',
  },

  modalButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px',
  },

  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: '1px solid #6B7280',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#E5E7EB',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  confirmButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#10B981',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};
