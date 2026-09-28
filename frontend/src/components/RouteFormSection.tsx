import React from 'react';
import type { AddressInput, AlgorithmType } from '../types/route';

interface RouteFormSectionProps {
  start: AddressInput;
  onStartChange: (start: AddressInput) => void;
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
          <input
            id="start-address"
            type="text"
            className="form-input"
            placeholder="Address (e.g. Khreshchatyk 1, Kyiv)"
            value={start.address}
            onChange={(e) => onStartChange({ ...start, address: e.target.value })}
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
