import React from 'react';
import type { RouteStop } from '../types/route';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';

interface StopsSectionProps {
  stops: RouteStop[];
  isLoading: boolean;
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onUpdateStop: (id: string, fields: Partial<RouteStop>) => void;
  city?: string;
}

export const StopsSection: React.FC<StopsSectionProps> = ({
  stops,
  isLoading,
  onAddStop,
  onRemoveStop,
  onUpdateStop,
  city,
}) => {
  const isMaxStopsReached = stops.length >= 10;

  return (
    <div className="stops-chain-container">
      <div className="stops-compact-list">
        {stops.map((stop, index) => {
          // Dynamic z-index so earlier rows paint over later rows when dropdown opens
          const rowZIndex = 80 - index;

          return (
            <div
              key={stop.id}
              className="stop-compact-row"
              style={{ zIndex: rowZIndex }}
            >
              {/* Stop Number Badge */}
              <div className="stop-num-badge" title={`Зупинка №${index + 1}`}>
                {index + 1}
              </div>

              {/* Address Input */}
              <div className="stop-address-wrapper">
                <AddressAutocompleteInput
                  id={`stop-address-${stop.id}`}
                  className="form-input form-input-sm stop-address-input"
                  placeholder={
                    city
                      ? `Адреса зупинки ${index + 1} (${city})`
                      : `Адреса зупинки ${index + 1}`
                  }
                  value={stop.address}
                  city={city}
                  onChange={(newAddress) => {
                    const cleanLabel =
                      stop.label && !stop.label.startsWith('Зупинка')
                        ? stop.label
                        : newAddress.split(',')[0]?.trim() || `Зупинка ${index + 1}`;
                    onUpdateStop(stop.id, { address: newAddress, label: cleanLabel });
                  }}
                  disabled={isLoading}
                />
              </div>

              {/* Stay Duration (Minutes) */}
              <div className="stop-stay-pill" title="Час перебування на зупинці (у хвилинах)">
                <svg
                  className="stay-pill-icon"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <input
                  id={`stop-service-${stop.id}`}
                  type="number"
                  min={0}
                  max={480}
                  className="stay-pill-input"
                  value={stop.serviceMinutes}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value, 10);
                    onUpdateStop(stop.id, {
                      serviceMinutes: isNaN(minutes) ? 0 : Math.max(0, minutes),
                    });
                  }}
                  disabled={isLoading}
                  aria-label={`Час перебування на зупинці ${index + 1}`}
                />
                <span className="stay-pill-unit">хв</span>
              </div>

              {/* Remove Stop Button */}
              <button
                type="button"
                className="btn-remove-compact"
                title={`Видалити зупинку ${index + 1}`}
                onClick={() => onRemoveStop(stop.id)}
                disabled={isLoading}
                aria-label={`Видалити зупинку ${index + 1}`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <div className="stops-action-bar">
        <button
          type="button"
          className="btn btn-secondary btn-sm btn-add-compact"
          onClick={onAddStop}
          disabled={isLoading || isMaxStopsReached}
          title={isMaxStopsReached ? 'Максимум 10 зупинок' : 'Додати проміжну зупинку'}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{stops.length === 0 ? 'Додати першу зупинку' : 'Додати зупинку'}</span>
          <span className="stops-count-hint">({stops.length}/10)</span>
        </button>
      </div>
    </div>
  );
};
