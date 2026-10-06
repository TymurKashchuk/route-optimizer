import React from 'react';
import type { RouteStop } from '../types/route';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';

interface StopsSectionProps {
  stops: RouteStop[];
  isLoading: boolean;
  isDirectTrip: boolean;
  startLabel: string;
  destinationLabel: string;
  onDirectTripChange: (isDirect: boolean) => void;
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onUpdateStop: (id: string, fields: Partial<RouteStop>) => void;
}

export const StopsSection: React.FC<StopsSectionProps> = ({
  stops,
  isLoading,
  isDirectTrip,
  startLabel,
  destinationLabel,
  onDirectTripChange,
  onAddStop,
  onRemoveStop,
  onUpdateStop,
}) => {
  const isMaxStopsReached = stops.length >= 10;

  if (isDirectTrip) {
    return (
      <section className="card stops-section stops-section-direct" aria-labelledby="stops-section-title">
        <div className="section-header">
          <div>
            <h2 id="stops-section-title" className="section-title">
              Stops
            </h2>
            <span className="section-subtitle">
              Прямий маршрут (0 проміжних зупинок)
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onDirectTripChange(false)}
            disabled={isLoading}
            title="Увімкнути зупинки"
          >
            + Add Stops
          </button>
        </div>

        <div className="direct-trip-notice">
          <div className="direct-trip-notice-icon" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
          <div className="direct-trip-notice-body">
            <h4 className="direct-trip-notice-title">Прямий маршрут активний</h4>
            <p className="direct-trip-notice-desc">
              Поїздка будується напряму від <strong>{startLabel || 'Старту'}</strong> до <strong>{destinationLabel || 'Фінішу'}</strong>.
              {stops.length > 0 ? (
                <> Ваші налаштовані зупинки ({stops.length}) збережено та буде відновлено при вимкненні перемикача або натисканні <em>"+ Add Stops"</em>.</>
              ) : (
                <> Натисніть <em>"+ Add Stops"</em>, якщо знадобиться додати проміжні зупинки.</>
              )}
            </p>
          </div>
        </div>
      </section>
    );
  }

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
                title="Remove stop"
                onClick={() => onRemoveStop(stop.id)}
                disabled={isLoading}
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
                  <AddressAutocompleteInput
                    id={`stop-address-${stop.id}`}
                    className="form-input form-input-sm"
                    placeholder="Address (e.g. Khmelnytskoho 10, Kyiv)"
                    value={stop.address}
                    onChange={(newAddress) => onUpdateStop(stop.id, { address: newAddress })}
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label-sm" htmlFor={`stop-service-${stop.id}`} title="Time spent at this stop">
                    Stay (min)
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
