import React from 'react';

export const StopsSection: React.FC = () => {
  return (
    <section className="card stops-section" aria-labelledby="stops-section-title">
      <div className="section-header">
        <div>
          <h2 id="stops-section-title" className="section-title">
            Stops
          </h2>
          <span className="section-subtitle">2 stops configured (max 10)</span>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" disabled>
          + Add Stop
        </button>
      </div>

      <div className="stops-list">
        {/* Sample static stop item 1 */}
        <div className="stop-card">
          <div className="stop-card-header">
            <span className="stop-badge">#1</span>
            <span className="stop-title">Client A</span>
            <button type="button" className="btn-icon text-danger" title="Remove stop" disabled>
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
                  defaultValue="Bohdana Khmelnytskoho 10, Kyiv"
                  readOnly
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label-sm">Service (min)</label>
                <input
                  type="number"
                  className="form-input form-input-sm"
                  defaultValue="15"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sample static stop item 2 */}
        <div className="stop-card">
          <div className="stop-card-header">
            <span className="stop-badge">#2</span>
            <span className="stop-title">Client B</span>
            <button type="button" className="btn-icon text-danger" title="Remove stop" disabled>
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
                  defaultValue="Volodymyrska 24, Kyiv"
                  readOnly
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label-sm">Service (min)</label>
                <input
                  type="number"
                  className="form-input form-input-sm"
                  defaultValue="20"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
