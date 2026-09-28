import React from 'react';
import type { OptimizeRouteResponse } from '../types/route';
import { RouteMetricsSummary } from './results/RouteMetricsSummary';
import { OrderedStopsList } from './results/OrderedStopsList';
import { RouteExplanation } from './results/RouteExplanation';
import { TimelineView } from './results/TimelineView';

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
        {!isLoading && result && (
          <span className="badge-success">Optimized ({result.algorithm})</span>
        )}
        {!isLoading && !result && <span className="badge-muted">Waiting for execution</span>}
      </div>

      {isLoading && (
        <div className="skeleton-container" aria-busy="true" aria-live="polite">
          <div className="skeleton-header">
            <svg
              className="btn-spinner text-primary"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <div>
              <h3 className="skeleton-title">Calculating Optimal Route...</h3>
              <p className="skeleton-subtitle">Building distance matrix and running optimization</p>
            </div>
          </div>
          <div className="skeleton-cards">
            <div className="skeleton-block skeleton-block-metric"></div>
            <div className="skeleton-block skeleton-block-metric"></div>
            <div className="skeleton-block skeleton-block-metric"></div>
          </div>
          <div className="skeleton-block skeleton-block-wide"></div>
          <div className="skeleton-block skeleton-block-tall"></div>
        </div>
      )}

      {!isLoading && !result && (
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

      {!isLoading && result && (
        <div className="results-container">
          <RouteMetricsSummary
            original={result.original}
            optimized={result.optimized}
            savedMinutes={result.savedMinutes}
            savedDistanceKm={result.savedDistanceKm}
            improvementPercent={result.improvementPercent}
          />
          <OrderedStopsList orderedStops={result.orderedStops} />
          <RouteExplanation explanationSteps={result.explanationSteps} />
          <TimelineView timeline={result.timeline} />
        </div>
      )}
    </section>
  );
};
