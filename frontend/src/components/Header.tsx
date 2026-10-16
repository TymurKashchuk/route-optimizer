import React, { useEffect, useState } from 'react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

type ServerStatus = 'checking' | 'online' | 'offline';

export const Header: React.FC<HeaderProps> = ({ theme, onToggleTheme }) => {
  const [status, setStatus] = useState<ServerStatus>('checking');

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    async function checkHealth() {
      try {
        const res = await fetch('/api/health', {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!isCurrent) return;
        if (res.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch (err: unknown) {
        if (!isCurrent) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setStatus('offline');
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      isCurrent = false;
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 19.5h10a3 3 0 0 0 0-6H7a3 3 0 0 1 0-6h10" />
              <circle cx="5" cy="19.5" r="2" fill="currentColor" />
              <circle cx="19" cy="7.5" r="2" fill="var(--accent-bright, #E8501F)" stroke="var(--accent-bright, #E8501F)" />
            </svg>
          </div>
          <div className="brand-text-wrap">
            <h1 className="brand-title">RouteWise</h1>
            <p className="brand-subtitle">Планувальник поїздок із зупинками</p>
          </div>
        </div>

        <div className="header-actions">
          <div className={`header-status-badge status-${status}`} role="status">
            <span className="status-dot" aria-hidden="true" />
            <span className="status-label">
              {status === 'checking' && 'Перевіряємо…'}
              {status === 'online' && 'Сервер працює'}
              {status === 'offline' && 'Сервер недоступний'}
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Перемкнути на світлу тему' : 'Перемкнути на темну тему'}
            title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}
            className={`theme-toggle-btn ${theme === 'dark' ? 'dark' : 'light'}`}
            onClick={onToggleTheme}
          >
            <span className="theme-toggle-track">
              <span className="theme-icon sun-icon" aria-hidden="true">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4.5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </span>
              <span className="theme-icon moon-icon" aria-hidden="true">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </span>
              <span className="theme-toggle-thumb" aria-hidden="true" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
