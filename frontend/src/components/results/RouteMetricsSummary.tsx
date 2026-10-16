import React, { useState } from 'react';
import type { PlanningMode, RouteMetricsDto } from '../../types/route';
import { formatDuration, formatTime } from '../../utils/dateTime';

interface RouteMetricsSummaryProps {
  original: RouteMetricsDto;
  optimized: RouteMetricsDto;
  savedMinutes: number;
  savedDistanceKm: number;
  improvementPercent: number;
  planningMode?: PlanningMode;
  recommendedDepartureTime?: string;
}

export const RouteMetricsSummary: React.FC<RouteMetricsSummaryProps> = ({
  original,
  optimized,
  savedMinutes,
  savedDistanceKm,
  improvementPercent,
  planningMode,
  recommendedDepartureTime,
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const hasTimeSavings = savedMinutes > 0;
  const hasDistanceSavings = savedDistanceKm > 0;
  const hasSavings = hasTimeSavings || hasDistanceSavings;
  const totalTripMinutes = optimized.totalTravelMinutes + optimized.totalServiceMinutes;

  return (
    <div className="hero-metrics-card">
      {/* Mini top caption */}
      <div className="hero-caption-row">
        <span className="hero-caption">ЗАГАЛЬНИЙ ЧАС</span>
        {planningMode === 'arrive-by' && recommendedDepartureTime && (
          <span className="hero-recommended-dep" title="Рекомендований час початку подорожі">
            Виїзд о <strong>{formatTime(recommendedDepartureTime)}</strong>
          </span>
        )}
      </div>

      {/* Main Hero Accent: Total Travel Time */}
      <div className="hero-time-value tabular-nums">
        {formatDuration(totalTripMinutes)}
      </div>

      {/* Subtext with distance, driving and stay times */}
      <div className="hero-subline tabular-nums">
        <span>{optimized.totalDistanceKm.toFixed(0)} км</span>
        <span className="hero-subdot">·</span>
        <span>{optimized.totalTravelMinutes} хв у русі</span>
        {optimized.totalServiceMinutes > 0 && (
          <>
            <span className="hero-subdot">+</span>
            <span>{optimized.totalServiceMinutes} хв на зупинках</span>
          </>
        )}
      </div>

      {/* Savings pills & Comparison toggle */}
      <div className="hero-actions-row">
        {hasSavings ? (
          <div className="hero-savings-chips">
            {hasTimeSavings && (
              <span className="hero-pill-saving tabular-nums">
                -{savedMinutes} хв
              </span>
            )}
            {hasDistanceSavings && (
              <span className="hero-pill-saving tabular-nums">
                -{savedDistanceKm.toFixed(0)} км
              </span>
            )}
            {improvementPercent > 0 && !hasTimeSavings && !hasDistanceSavings && (
              <span className="hero-pill-saving tabular-nums">
                +{improvementPercent.toFixed(1)}%
              </span>
            )}
          </div>
        ) : (
          <span className="hero-neutral-text">
            {optimized.totalServiceMinutes > 0 ? 'Без оптимізації' : 'Оптимальний прямий шлях'}
          </span>
        )}

        {hasSavings && (
          <button
            type="button"
            className="hero-btn-compare"
            onClick={() => setShowComparison(!showComparison)}
            aria-expanded={showComparison}
          >
            {showComparison ? 'Сховати' : 'Порівняти з вихідним'}
          </button>
        )}
      </div>

      {/* Collapsible Comparison Details (Secondary) */}
      {hasSavings && showComparison && (
        <div className="hero-compare-expanded">
          <div className="compare-mini-col">
            <span className="compare-mini-label">Вихідний:</span>
            <span className="tabular-nums">{original.totalDistanceKm.toFixed(1)} км · {original.totalTravelMinutes} хв</span>
          </div>
          <div className="compare-mini-col">
            <span className="compare-mini-label compare-accent">Оптимізований:</span>
            <span className="tabular-nums">{optimized.totalDistanceKm.toFixed(1)} км · {optimized.totalTravelMinutes} хв</span>
          </div>
        </div>
      )}
    </div>
  );
};
