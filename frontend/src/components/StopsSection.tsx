import React from 'react';
import type { RouteStop } from '../types/route';

interface StopsSectionProps {
  stops: RouteStop[];
  isLoading: boolean;
}

export const StopsSection: React.FC<StopsSectionProps> = ({ stops, isLoading }) => {
  return (
    <section className="card stops-section" aria-labelledby="stops-section-title">
      <div className="section-header">
        <div>
          <h2 id="stops-section-title" className="section-title">
            Stops
          </h2>
          <span className="section-subtitle">
            {stops.length} stop{stops.length === 1 ? '' : 's'} configured (max 10)
          </span>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" disabled={isLoading || stops.length >= 10}>
          + Add Stop
        </button>
      </div>

      <div className="stops-list">
        {stops.map((stop, index) => (
          <div key={stop.id} className="stop-card">
            <div className="stop-card-header">
              <span className="stop-badge">#{index + 1}</span>
              <span className="stop-title">{stop.label || `Stop ${index + 1}`}</span>
              <button
                type="button"
                className="btn-icon text-danger"
                title="Remove stop"
                disabled={isLoading}
              >
                &times;
              </button>
            </div>
            <div className="stop-card-body">
              <div className="form-row">
                <div className="form-group flex-2">
                  <label className="form-label-sm">Address</label>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    value={stop.address}
                    readOnly
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label-sm">Service (min)</label>
                  <input
                    type="number"
                    className="form-input form-input-sm"
                    value={stop.serviceMinutes}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
