import React from 'react';

interface OrderedStopsListProps {
  orderedStops: string[];
}

export const OrderedStopsList: React.FC<OrderedStopsListProps> = ({ orderedStops }) => {
  return (
    <div className="results-block">
      <h3 className="block-title">Optimal Stop Sequence</h3>
      <div className="ordered-stops-list">
        {orderedStops.map((stopLabel, index) => (
          <div key={`${stopLabel}-${index}`} className="ordered-stop-item">
            <span className="ordered-stop-index">{index + 1}</span>
            <span className="ordered-stop-name">{stopLabel}</span>
            {index < orderedStops.length - 1 && (
              <span className="ordered-stop-connector" aria-hidden="true">
                &rarr;
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
