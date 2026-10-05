import React from 'react';
import type { RouteMetricsDto } from '../../types/route';

interface RouteMetricsSummaryProps {
  original: RouteMetricsDto;
  optimized: RouteMetricsDto;
  savedMinutes: number;
  savedDistanceKm: number;
  improvementPercent: number;
}

export const RouteMetricsSummary: React.FC<RouteMetricsSummaryProps> = ({
  original,
  optimized,
  savedMinutes,
  savedDistanceKm,
  improvementPercent,
}) => {
  const hasSavings = savedMinutes > 0 || savedDistanceKm > 0;

  return (
    <div className="metrics-section">
      <div className="metrics-grid">
        <div className={`metric-card ${hasSavings ? 'metric-card-positive' : ''}`}>
          <span className="metric-label">Time Saved</span>
          <span className="metric-value">{savedMinutes} min</span>
          <span className="metric-subtext">
            {savedMinutes > 0 ? `Reduced by ${savedMinutes} min` : 'Same travel duration'}
          </span>
        </div>

        <div className={`metric-card ${hasSavings ? 'metric-card-positive' : ''}`}>
          <span className="metric-label">Distance Saved</span>
          <span className="metric-value">{savedDistanceKm.toFixed(1)} km</span>
          <span className="metric-subtext">
            {savedDistanceKm > 0 ? `Reduced by ${savedDistanceKm.toFixed(1)} km` : 'Same distance'}
          </span>
        </div>

        <div className={`metric-card ${improvementPercent > 0 ? 'metric-card-accent' : ''}`}>
          <span className="metric-label">Efficiency Gain</span>
          <span className="metric-value">
            {improvementPercent > 0 ? `+${improvementPercent.toFixed(1)}%` : '0.0%'}
          </span>
          <span className="metric-subtext">Route optimization ratio</span>
        </div>
      </div>

      <div className="metrics-comparison">
        <div className="comparison-col">
          <span className="comparison-title">Original (Baseline)</span>
          <div className="comparison-stats">
            <div>Travel: <strong>{original.totalTravelMinutes} min</strong></div>
            <div>Distance: <strong>{original.totalDistanceKm.toFixed(1)} km</strong></div>
            <div>Stops stay: <strong>{original.totalServiceMinutes} min</strong></div>
          </div>
        </div>

        <div className="comparison-divider"></div>

        <div className="comparison-col">
          <span className="comparison-title comparison-title-optimized">Optimized Result</span>
          <div className="comparison-stats">
            <div>Travel: <strong>{optimized.totalTravelMinutes} min</strong></div>
            <div>Distance: <strong>{optimized.totalDistanceKm.toFixed(1)} km</strong></div>
            <div>Stops stay: <strong>{optimized.totalServiceMinutes} min</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
