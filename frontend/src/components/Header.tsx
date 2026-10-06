import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="19" r="3" />
              <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
              <circle cx="18" cy="5" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="brand-title">RouteWise</h1>
            <p className="brand-subtitle">Персональний планувальник поїздок</p>
          </div>
        </div>

        <div className="header-badge">
          <span className="badge-dot" aria-hidden="true" />
          <span>Планувальник активний</span>
        </div>
      </div>
    </header>
  );
};
