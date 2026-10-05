import React from 'react';
import type { AddressInput, AlgorithmType } from '../types/route';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';

interface RouteFormSectionProps {
  start: AddressInput;
  onStartChange: (start: AddressInput) => void;
  destination: AddressInput;
  onDestinationChange: (destination: AddressInput) => void;
  departureTime: string;
  onDepartureTimeChange: (time: string) => void;
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
  departureTime,
  onDepartureTimeChange,
  algorithm,
  onAlgorithmChange,
  isLoading,
  onOptimize,
}) => {
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
            placeholder="Label (e.g. Depot)"
            value={start.label}
            onChange={(e) => onStartChange({ ...start, label: e.target.value })}
            disabled={isLoading}
          />
          <AddressAutocompleteInput
            id="start-address"
            className="form-input"
            placeholder="Address (e.g. Khreshchatyk 1, Kyiv)"
            value={start.address}
            onChange={(newAddress) => onStartChange({ ...start, address: newAddress })}
            disabled={isLoading}
          />
        </div>
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
            placeholder="Label (e.g. Garage)"
            value={destination.label}
            onChange={(e) => onDestinationChange({ ...destination, label: e.target.value })}
            disabled={isLoading}
          />
          <AddressAutocompleteInput
            id="destination-address"
            className="form-input"
            placeholder="Address (e.g. Zhytomyr Depot)"
            value={destination.address}
            onChange={(newAddress) => onDestinationChange({ ...destination, address: newAddress })}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label className="form-label" htmlFor="departure-time">
            Departure Time
          </label>
          <input
            id="departure-time"
            type="datetime-local"
            className="form-input"
            value={departureTime}
            onChange={(e) => onDepartureTimeChange(e.target.value)}
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
            disabled={isLoading}
          >
            <option value="nearest-neighbor">Nearest Neighbor (Fast Greedy)</option>
            <option value="two-opt">2-Opt Heuristic (Optimized)</option>
            <option value="original">Original Order (Baseline)</option>
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
        ) : (
          'Optimize Route'
        )}
      </button>
    </section>
  );
};
