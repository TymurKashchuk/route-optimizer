import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo">RW</div>
          <div>
            <h1 className="brand-title">RouteWise</h1>
            <p className="brand-subtitle">Smart Route Optimizer & Planner</p>
          </div>
        </div>
        <div className="header-badge">
          <span className="badge-dot"></span>
          <span>API Connected (Ready)</span>
        </div>
      </div>
    </header>
  );
};
