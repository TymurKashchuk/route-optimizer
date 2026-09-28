import React from 'react';
import type { RouteStop } from '../types/route';

interface StopsSectionProps {
  stops: RouteStop[];
  isLoading: boolean;
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onUpdateStop: (id: string, fields: Partial<RouteStop>) => void;
}

export const StopsSection: React.FC<StopsSectionProps> = ({
  stops,
  isLoading,
  onAddStop,
  onRemoveStop,
  onUpdateStop,
}) => {
  const isMaxStopsReached = stops.length >= 10;
  const isMinStopsReached = stops.length <= 1;

  return (
    <section className="card stops-section" aria-labelledby="stops-section-title">
      <div className="section-header">
        <div>
          <h2 id="stops-section-title" className="section-title">
            Stops
          </h2>
          <span className="section-subtitle">
            {stops.length} of 10 stops configured
          </span>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onAddStop}
          disabled={isLoading || isMaxStopsReached}
          title={isMaxStopsReached ? 'Maximum 10 stops allowed' : 'Add new stop'}
        >
          + Add Stop
        </button>
      </div>

      <div className="stops-list">
        {stops.map((stop, index) => (
          <div key={stop.id} className="stop-card">
            <div className="stop-card-header">
              <span className="stop-badge">#{index + 1}</span>
              <input
                type="text"
                className="stop-title-input"
                placeholder="Stop label"
                value={stop.label}
                onChange={(e) => onUpdateStop(stop.id, { label: e.target.value })}
                disabled={isLoading}
              />
              <button
                type="button"
                className="btn-icon text-danger"
                title={isMinStopsReached ? 'At least one stop is required' : 'Remove stop'}
                onClick={() => onRemoveStop(stop.id)}
                disabled={isLoading || isMinStopsReached}
              >
                &times;
              </button>
            </div>
            <div className="stop-card-body">
              <div className="form-row">
                <div className="form-group flex-2">
                  <label className="form-label-sm" htmlFor={`stop-address-${stop.id}`}>
                    Address
                  </label>
                  <input
                    id={`stop-address-${stop.id}`}
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="Address (e.g. Khmelnytskoho 10, Kyiv)"
                    value={stop.address}
                    onChange={(e) => onUpdateStop(stop.id, { address: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label-sm" htmlFor={`stop-service-${stop.id}`}>
                    Service (min)
                  </label>
                  <input
                    id={`stop-service-${stop.id}`}
                    type="number"
                    min={0}
                    max={480}
                    className="form-input form-input-sm"
                    value={stop.serviceMinutes}
                    onChange={(e) => {
                      const minutes = parseInt(e.target.value, 10);
                      onUpdateStop(stop.id, { serviceMinutes: isNaN(minutes) ? 0 : Math.max(0, minutes) });
                    }}
                    disabled={isLoading}
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
