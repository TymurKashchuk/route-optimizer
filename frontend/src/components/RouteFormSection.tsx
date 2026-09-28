import React from 'react';

export const RouteFormSection: React.FC = () => {
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
            defaultValue="Start Depot"
            readOnly
          />
          <input
            id="start-address"
            type="text"
            className="form-input"
            placeholder="Address (e.g. Khreshchatyk 1, Kyiv)"
            defaultValue="Khreshchatyk 1, Kyiv"
            readOnly
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
            defaultValue="2026-09-28T09:00"
            readOnly
          />
        </div>

        <div className="form-group flex-1">
          <label className="form-label" htmlFor="algorithm-select">
            Optimization Algorithm
          </label>
          <select id="algorithm-select" className="form-select" defaultValue="two-opt" disabled>
            <option value="nearest-neighbor">Nearest Neighbor (Fast Greedy)</option>
            <option value="two-opt">2-Opt Heuristic (Optimized)</option>
            <option value="original">Original Order (Baseline)</option>
          </select>
        </div>
      </div>

      <button type="button" className="btn btn-primary btn-block" disabled>
        Optimize Route
      </button>
    </section>
  );
};
