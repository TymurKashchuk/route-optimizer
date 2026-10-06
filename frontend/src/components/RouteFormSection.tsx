import React, { useState } from 'react';
import type { AddressInput, AlgorithmType, PlanningMode } from '../types/route';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { reverseGeocode } from '../api/geocodingClient';

interface RouteFormSectionProps {
  start: AddressInput;
  onStartChange: (start: AddressInput) => void;
  destination: AddressInput;
  onDestinationChange: (destination: AddressInput) => void;
  isDirectTrip: boolean;
  onDirectTripChange: (isDirect: boolean) => void;
  planningMode: PlanningMode;
  onPlanningModeChange: (mode: PlanningMode) => void;
  departureTime: string;
  onDepartureTimeChange: (time: string) => void;
  arrivalBy: string;
  onArrivalByChange: (time: string) => void;
  algorithm: AlgorithmType;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  isLoading: boolean;
  onOptimize: () => void;
}

export const RouteFormSection: React.FC<RouteFormSectionProps> = ({
  start,
  onStartChange,
  destination,
  onDestinationChange,
  isDirectTrip,
  onDirectTripChange,
  planningMode,
  onPlanningModeChange,
  departureTime,
  onDepartureTimeChange,
  arrivalBy,
  onArrivalByChange,
  algorithm,
  onAlgorithmChange,
  isLoading,
  onOptimize,
}) => {
  const isArriveBy = planningMode === 'arrive-by';
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Геолокація не підтримується вашим браузером.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const result = await reverseGeocode(latitude, longitude);
          onStartChange({
            label: start.label && start.label !== 'Home' ? start.label : 'Моє місцезнаходження',
            address: result.address,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Не вдалося визначити адресу за вашими координатами.';
          setLocationError(message);
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setIsLocating(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setLocationError('Доступ до геопозиції відхилено. Дозвольте доступ у браузері.');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setLocationError('GPS-дані недоступні. Перевірте зʼєднання.');
            break;
          case geoError.TIMEOUT:
            setLocationError('Час очікування відповіді GPS вичерпано.');
            break;
          default:
            setLocationError('Не вдалося визначити поточну геопозицію.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <section className="card form-section" aria-labelledby="route-params-title">
      <h2 id="route-params-title" className="section-title">
        Route Parameters
      </h2>

      <div className="form-group">
        <label className="form-label" htmlFor="start-address">
          Start Location
        </label>
        <div className="input-group">
          <input
            id="start-label"
            type="text"
            className="form-input start-label-input"
            placeholder="Label (e.g. Home)"
            value={start.label}
            onChange={(e) => onStartChange({ ...start, label: e.target.value })}
            disabled={isLoading || isLocating}
          />
          <AddressAutocompleteInput
            id="start-address"
            className="form-input"
            placeholder="Address (e.g. Khreshchatyk 1, Kyiv)"
            value={start.address}
            onChange={(newAddress) => {
              setLocationError(null);
              onStartChange({ ...start, address: newAddress });
            }}
            disabled={isLoading || isLocating}
          />
          <button
            type="button"
            className="btn btn-secondary geolocation-btn"
            onClick={handleUseCurrentLocation}
            disabled={isLoading || isLocating}
            title="Використати моє поточне місцезнаходження"
            aria-label="Використати моє поточне місцезнаходження"
          >
            {isLocating ? (
              <svg
                className="btn-spinner geolocation-spinner"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg
                className="geolocation-icon"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="7" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
        {locationError && <p className="form-error-sm">{locationError}</p>}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="destination-address">
          Destination Location (Fixed Finish)
        </label>
        <div className="input-group">
          <input
            id="destination-label"
            type="text"
            className="form-input start-label-input"
            placeholder="Label (e.g. Hospital)"
            value={destination.label}
            onChange={(e) => onDestinationChange({ ...destination, label: e.target.value })}
            disabled={isLoading}
          />
          <AddressAutocompleteInput
            id="destination-address"
            className="form-input"
            placeholder="Address (e.g. Zhytomyr City Hospital)"
            value={destination.address}
            onChange={(newAddress) => onDestinationChange({ ...destination, address: newAddress })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className={`form-group direct-trip-group ${isDirectTrip ? 'active' : ''}`}>
        <label className="toggle-switch-label" htmlFor="direct-trip-toggle">
          <div className="toggle-switch-wrapper">
            <input
              id="direct-trip-toggle"
              type="checkbox"
              className="toggle-switch-input"
              checked={isDirectTrip}
              onChange={(e) => onDirectTripChange(e.target.checked)}
              disabled={isLoading}
            />
            <span className="toggle-switch-slider"></span>
          </div>
          <div className="toggle-switch-text">
            <span className="toggle-title">Прямий маршрут (без проміжних зупинок)</span>
            <span className="toggle-description">
              {isDirectTrip
                ? 'Поїздка будується напряму від Старту до Фінішу (А → Б)'
                : 'Увімкніть, щоб доїхати напряму без додаткових зупинок'}
            </span>
          </div>
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">Planning Mode</label>
        <div className="planning-mode-group" role="radiogroup" aria-label="Planning Mode">
          <button
            type="button"
            className={`planning-mode-btn ${!isArriveBy ? 'active' : ''}`}
            onClick={() => onPlanningModeChange('depart-at')}
            disabled={isLoading}
            role="radio"
            aria-checked={!isArriveBy}
          >
            Depart At (Leave at)
          </button>
          <button
            type="button"
            className={`planning-mode-btn ${isArriveBy ? 'active' : ''}`}
            onClick={() => onPlanningModeChange('arrive-by')}
            disabled={isLoading}
            role="radio"
            aria-checked={isArriveBy}
          >
            Arrive By (Deadline)
          </button>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label className="form-label" htmlFor="route-time">
            {isArriveBy ? 'Target Arrival Time (Deadline)' : 'Departure Time'}
          </label>
          <input
            id="route-time"
            type="datetime-local"
            className="form-input"
            value={isArriveBy ? arrivalBy : departureTime}
            onChange={(e) => (isArriveBy ? onArrivalByChange(e.target.value) : onDepartureTimeChange(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <div className="form-group flex-1">
          <label className="form-label" htmlFor="algorithm-select">
            Optimization Algorithm
          </label>
          <select
            id="algorithm-select"
            className="form-select"
            value={algorithm}
            onChange={(e) => onAlgorithmChange(e.target.value as AlgorithmType)}
            disabled={isLoading || isDirectTrip}
            title={isDirectTrip ? 'Оптимізація не потрібна для прямого маршруту' : undefined}
          >
            {isDirectTrip ? (
              <option value={algorithm}>Direct Route (Point-to-Point)</option>
            ) : (
              <>
                <option value="nearest-neighbor">Nearest Neighbor (Fast Greedy)</option>
                <option value="two-opt">2-Opt Heuristic (Optimized)</option>
                <option value="original">Original Order (Baseline)</option>
              </>
            )}
          </select>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={onOptimize}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="btn-spinner"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span>Calculating Route...</span>
          </>
        ) : isDirectTrip ? (
          'Calculate Direct Route'
        ) : (
          'Optimize Route'
        )}
      </button>
    </section>
  );
};
