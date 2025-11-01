/**
 * Event Log Component
 *
 * Displays system events and mode change history
 * @see Issue #4: GUI Dashboard - FR-4.6
 */

import React from 'react';

export interface LogEvent {
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
}

interface EventLogProps {
  events: LogEvent[];
  maxItems?: number;
}

/**
 * Event Log Component
 */
export const EventLog: React.FC<EventLogProps> = ({ events, maxItems = 10 }) => {
  const displayedEvents = events.slice(-maxItems);

  const getEventIcon = (type: LogEvent['type']): string => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getEventColor = (type: LogEvent['type']): string => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'info':
      default:
        return '#3B82F6';
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📋 イベントログ</h2>

      <div style={styles.logContainer}>
        {displayedEvents.length === 0 ? (
          <div style={styles.emptyState}>イベントはまだ記録されていません</div>
        ) : (
          displayedEvents.map((event, index) => (
            <div
              key={index}
              style={{
                ...styles.logEntry,
                borderLeft: `4px solid ${getEventColor(event.type)}`,
              }}
            >
              <div style={styles.logHeader}>
                <span style={styles.eventIcon}>{getEventIcon(event.type)}</span>
                <span style={styles.eventTime}>{formatTime(event.timestamp)}</span>
              </div>
              <div style={styles.eventMessage}>{event.message}</div>
              {event.details && (
                <div style={styles.eventDetails}>{event.details}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * Toast Notification Component
 */
export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  React.useEffect(() => {
    toasts.forEach((toast) => {
      const duration = toast.duration || 3000;
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, duration);

      return () => clearTimeout(timer);
    });
  }, [toasts, onDismiss]);

  const getToastBackground = (type: Toast['type']): string => {
    switch (type) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'info':
      default:
        return '#3B82F6';
    }
  };

  return (
    <div style={styles.toastContainer}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            ...styles.toast,
            backgroundColor: getToastBackground(toast.type),
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <span style={styles.toastMessage}>{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            style={styles.toastClose}
          >
            ✕
          </button>
        </div>
      ))}
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
  },

  title: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#F3F4F6',
  },

  logContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '400px',
    overflowY: 'auto',
  },

  emptyState: {
    padding: '20px',
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
  },

  logEntry: {
    padding: '12px',
    backgroundColor: '#1F2937',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#E5E7EB',
  },

  logHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '5px',
  },

  eventIcon: {
    fontSize: '16px',
  },

  eventTime: {
    fontSize: '11px',
    color: '#9CA3AF',
    fontWeight: 'bold',
  },

  eventMessage: {
    fontSize: '13px',
    color: '#F3F4F6',
    fontWeight: '500',
  },

  eventDetails: {
    marginTop: '5px',
    fontSize: '11px',
    color: '#D1D5DB',
    fontFamily: 'Menlo, Courier New, monospace',
  },

  toastContainer: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1001,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },

  toast: {
    padding: '12px 16px',
    borderRadius: '6px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    minWidth: '250px',
  },

  toastMessage: {
    flex: 1,
  },

  toastClose: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0',
    lineHeight: '1',
  },
};
