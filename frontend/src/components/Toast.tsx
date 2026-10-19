import React, { useEffect } from 'react';

export type ToastType = 'error' | 'info' | 'success';

interface ToastProps {
  message: string | null;
  type?: ToastType;
  onClose: () => void;
  autoCloseDurationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'error',
  onClose,
  autoCloseDurationMs = type === 'error' ? 6000 : 3500,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDurationMs);
    return () => clearTimeout(timer);
  }, [message, autoCloseDurationMs, onClose]);

  if (!message) return null;

  return (
    <div
      className="toast-container"
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className={`toast-card toast-${type}`}>
        <div className="toast-icon">
          {type === 'error' && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {type === 'info' && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
          {type === 'success' && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
        </div>
        <div className="toast-content">
          <p className="toast-message">{message}</p>
        </div>
        <button
          type="button"
          className="toast-close"
          onClick={onClose}
          aria-label="Закрити сповіщення"
          title="Закрити"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

