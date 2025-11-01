/**
 * Settings Panel Component
 *
 * Configuration UI for mode switching parameters
 * @see Issue #4: GUI Dashboard - FR-4.7
 */

import React, { useState } from 'react';

export interface AppSettings {
  activeThreshold: number; // milliseconds
  standbyThreshold: number; // milliseconds
  idleThreshold: number; // milliseconds
  pollInterval: number; // milliseconds
  switchTimeout: number; // milliseconds
  theme: 'dark' | 'light';
  autoStart: boolean;
  notificationSound: boolean;
}

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onReset: () => void;
}

/**
 * Settings Panel Component
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onSave,
  onReset,
}) => {
  const [formValues, setFormValues] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate settings
    if (
      formValues.activeThreshold < 0 ||
      formValues.standbyThreshold < formValues.activeThreshold
    ) {
      alert(
        'スタンバイ時間はアクティブ判定時間より長くする必要があります'
      );
      return;
    }

    onSave(formValues);
    setHasChanges(false);
    alert('設定を保存しました');
  };

  const handleReset = () => {
    if (confirm('設定をデフォルトにリセットしてもよろしいですか？')) {
      onReset();
      setFormValues(settings);
      setHasChanges(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>⚙️ 設定</h2>

      <div style={styles.formGroup}>
        <label style={styles.label}>
          <span>アクティブ判定時間 (秒)</span>
          <input
            type="number"
            value={formValues.activeThreshold / 1000}
            onChange={(e) =>
              handleChange('activeThreshold', parseInt(e.target.value) * 1000)
            }
            style={styles.input}
            min="1"
            max="3600"
          />
        </label>

        <label style={styles.label}>
          <span>スタンバイ時間 (秒)</span>
          <input
            type="number"
            value={formValues.standbyThreshold / 1000}
            onChange={(e) =>
              handleChange('standbyThreshold', parseInt(e.target.value) * 1000)
            }
            style={styles.input}
            min="1"
            max="3600"
          />
        </label>

        <label style={styles.label}>
          <span>アイドル時間 (秒)</span>
          <input
            type="number"
            value={formValues.idleThreshold / 1000}
            onChange={(e) =>
              handleChange('idleThreshold', parseInt(e.target.value) * 1000)
            }
            style={styles.input}
            min="1"
            max="3600"
          />
        </label>

        <label style={styles.label}>
          <span>監視間隔 (秒)</span>
          <input
            type="number"
            value={formValues.pollInterval / 1000}
            onChange={(e) =>
              handleChange('pollInterval', parseInt(e.target.value) * 1000)
            }
            style={styles.input}
            min="0.1"
            max="60"
            step="0.1"
          />
        </label>

        <label style={styles.label}>
          <span>モード切替タイムアウト (秒)</span>
          <input
            type="number"
            value={formValues.switchTimeout / 1000}
            onChange={(e) =>
              handleChange('switchTimeout', parseInt(e.target.value) * 1000)
            }
            style={styles.input}
            min="1"
            max="60"
          />
        </label>
      </div>

      <div style={styles.divider} />

      <div style={styles.checkboxGroup}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formValues.theme === 'dark'}
            onChange={(e) =>
              handleChange('theme', e.target.checked ? 'dark' : 'light')
            }
            style={styles.checkbox}
          />
          <span>🌙 ダークテーマ</span>
        </label>

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formValues.autoStart}
            onChange={(e) => handleChange('autoStart', e.target.checked)}
            style={styles.checkbox}
          />
          <span>🚀 自動起動</span>
        </label>

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formValues.notificationSound}
            onChange={(e) =>
              handleChange('notificationSound', e.target.checked)
            }
            style={styles.checkbox}
          />
          <span>🔔 通知音</span>
        </label>
      </div>

      <div style={styles.divider} />

      <div style={styles.buttonGroup}>
        <button onClick={handleReset} style={styles.resetButton}>
          デフォルトに戻す
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges}
          style={{
            ...styles.saveButton,
            ...(hasChanges ? {} : styles.saveButtonDisabled),
          }}
        >
          {hasChanges ? '保存' : '変更なし'}
        </button>
      </div>

      {hasChanges && (
        <div style={styles.unsavedWarning}>
          変更が保存されていません
        </div>
      )}
    </div>
  );
};

/**
 * Styles
 */
const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '20px',
    backgroundColor: '#111827',
    borderRadius: '8px',
    border: '1px solid #374151',
    maxWidth: '500px',
  },

  title: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#F3F4F6',
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },

  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    color: '#E5E7EB',
    fontSize: '14px',
    fontWeight: '500',
  },

  input: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #4B5563',
    borderRadius: '4px',
    backgroundColor: '#1F2937',
    color: '#F3F4F6',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
  },

  divider: {
    height: '1px',
    backgroundColor: '#374151',
    margin: '20px 0',
  },

  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    color: '#E5E7EB',
    fontSize: '14px',
    fontWeight: '500',
  },

  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#3B82F6',
  },

  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },

  resetButton: {
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

  saveButton: {
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

  saveButtonDisabled: {
    backgroundColor: '#6B7280',
    cursor: 'not-allowed',
  },

  unsavedWarning: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#F59E0B',
    color: '#78350F',
    fontSize: '12px',
    borderRadius: '4px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
};
