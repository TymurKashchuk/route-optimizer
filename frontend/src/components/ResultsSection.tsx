import React from 'react';
import type { OptimizeRouteResponse } from '../types/route';

interface ResultsSectionProps {
  result: OptimizeRouteResponse | null;
  isLoading: boolean;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ result, isLoading }) => {
  return (
    <section className="card results-section" aria-labelledby="results-section-title">
      <div className="section-header">
        <h2 id="results-section-title" className="section-title">
          Optimization Results
        </h2>
        {isLoading && <span className="badge-muted">Calculating route...</span>}
        {!isLoading && result && <span className="badge-muted">Optimized ({result.algorithm})</span>}
        {!isLoading && !result && <span className="badge-muted">Waiting for execution</span>}
      </div>

      {/* Empty State before first optimization */}
      {!result && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-light)' }}
            >
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
          </div>
          <h3 className="empty-state-title">No Route Calculated Yet</h3>
          <p className="empty-state-text">
            Configure start location, add at least one stop, select an optimization algorithm, and click
            <strong> "Optimize Route"</strong> to compute the optimal delivery sequence and view timeline metrics.
          </p>
        </div>
      )}

      {!result && (
        <div className="results-preview-placeholder">
          <div className="preview-card-placeholder">
            <span className="placeholder-label">Key Metrics (Saved Time, Distance & Efficiency)</span>
          </div>
          <div className="preview-card-placeholder">
            <span className="placeholder-label">Ordered Stops & Route Explanation</span>
          </div>
          <div className="preview-card-placeholder">
            <span className="placeholder-label">Schedule & Estimated Arrival Timeline (ETA)</span>
          </div>
        </div>
      )}

      {result && (
        <div className="results-content">
          <p>Route successfully calculated! Saved {result.savedMinutes} minutes ({result.savedDistanceKm.toFixed(1)} km).</p>
        </div>
      )}
    </section>
  );
};
