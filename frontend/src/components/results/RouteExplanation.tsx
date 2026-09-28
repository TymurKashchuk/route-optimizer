import React from 'react';
import type { RouteStepDto } from '../../types/route';

interface RouteExplanationProps {
  explanationSteps: RouteStepDto[];
}

export const RouteExplanation: React.FC<RouteExplanationProps> = ({ explanationSteps }) => {
  if (!explanationSteps || explanationSteps.length === 0) return null;

  return (
    <div className="results-block">
      <h3 className="block-title">Route Legs & Travel Explanation</h3>
      <div className="explanation-steps">
        {explanationSteps.map((step, index) => (
          <div key={`${step.from}-${step.to}-${index}`} className="explanation-step-card">
            <div className="step-point step-from">
              <span className="step-label-tag">From</span>
              <span className="step-point-name">{step.from}</span>
            </div>

            <div className="step-transit">
              <span className="step-duration">{step.travelMinutes} min drive</span>
              <div className="step-line"></div>
            </div>

            <div className="step-point step-to">
              <span className="step-label-tag">To</span>
              <span className="step-point-name">{step.to}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
