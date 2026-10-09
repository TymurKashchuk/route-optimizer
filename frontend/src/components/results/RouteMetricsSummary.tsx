import React, { useState } from 'react';
import type { RouteMetricsDto } from '../../types/route';

interface RouteMetricsSummaryProps {
  original: RouteMetricsDto;
  optimized: RouteMetricsDto;
  savedMinutes: number;
  savedDistanceKm: number;
  improvementPercent: number;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} хв`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours} год ${remaining} хв` : `${hours} год`;
}

export const RouteMetricsSummary: React.FC<RouteMetricsSummaryProps> = ({
  original,
  optimized,
  savedMinutes,
  savedDistanceKm,
  improvementPercent,
}) => {
  const [showComparison, setShowComparison] = useState(false);
  const hasSavings = savedMinutes > 0 || savedDistanceKm > 0;
  const totalTripMinutes = optimized.totalTravelMinutes + optimized.totalServiceMinutes;

  return (
    <div className="trip-summary-section">
      {/* 3 Main Personal Trip Metric Cards */}
      <div className="trip-metrics-grid">
        {/* Total Time */}
        <div className="trip-metric-card">
          <div className="trip-metric-header">
            <span className="trip-metric-label">Загальний час</span>
            <svg
              className="trip-metric-icon"
              width="16"
              height="16"
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
          </div>
          <span className="trip-metric-value">{formatDuration(totalTripMinutes)}</span>
          <span className="trip-metric-subtext">
            {optimized.totalServiceMinutes > 0
              ? `${optimized.totalTravelMinutes} хв у русі + ${optimized.totalServiceMinutes} хв зупинки`
              : `${optimized.totalTravelMinutes} хв без зупинок`}
          </span>
        </div>

        {/* Total Distance */}
        <div className="trip-metric-card">
          <div className="trip-metric-header">
            <span className="trip-metric-label">Відстань</span>
            <svg
              className="trip-metric-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          </div>
          <span className="trip-metric-value">{optimized.totalDistanceKm.toFixed(1)} км</span>
          <span className="trip-metric-subtext">Довжина всього маршруту</span>
        </div>

        {/* Savings or Trip Mode Status */}
        <div className={`trip-metric-card ${hasSavings ? 'trip-metric-card-savings' : ''}`}>
          <div className="trip-metric-header">
            <span className="trip-metric-label">
              {hasSavings ? 'Економія' : 'Маршрут'}
            </span>
            <svg
              className="trip-metric-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {hasSavings ? (
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              ) : (
                <polyline points="20 6 9 17 4 12" />
              )}
            </svg>
          </div>
          <span className="trip-metric-value">
            {hasSavings ? `${Math.abs(savedMinutes)} хв` : 'Прямий'}
          </span>
          <span className="trip-metric-subtext">
            {hasSavings
              ? `${Math.abs(savedDistanceKm).toFixed(1)} км${improvementPercent > 0 ? ` (+${improvementPercent.toFixed(1)}%)` : ''}`
              : 'Найшвидший шлях'}
          </span>
        </div>
      </div>

      {/* Savings Highlight Banner (if stops were reordered for optimization) */}
      {hasSavings && (
        <div className="savings-highlight-banner">
          <div className="savings-banner-content">
            <div className="savings-banner-icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div className="savings-banner-text">
              <strong>Маршрут оптимізовано!</strong> Завдяки кращій послідовності зупинок
              ви заощадите <strong>{Math.abs(savedMinutes)} хв</strong> та <strong>{Math.abs(savedDistanceKm).toFixed(1)} км</strong>.
            </div>
          </div>
          <button
            type="button"
            className="btn-toggle-comparison"
            onClick={() => setShowComparison(!showComparison)}
          >
            <span>{showComparison ? 'Сховати порівняння' : 'Порівняти з вихідним'}</span>
            <svg
              className={`comparison-arrow-icon ${showComparison ? 'open' : ''}`}
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      )}

      {/* Collapsible Comparison Table (Only shown on request) */}
      {hasSavings && showComparison && (
        <div className="metrics-comparison-card">
          <div className="comparison-col">
            <span className="comparison-title">Початковий порядок</span>
            <div className="comparison-stats">
              <div>У русі: <strong>{original.totalTravelMinutes} хв</strong></div>
              <div>Відстань: <strong>{original.totalDistanceKm.toFixed(1)} км</strong></div>
              <div>Зупинки: <strong>{original.totalServiceMinutes} хв</strong></div>
            </div>
          </div>

          <div className="comparison-divider" />

          <div className="comparison-col">
            <span className="comparison-title comparison-title-optimized">
              Оптимізований порядок
            </span>
            <div className="comparison-stats">
              <div>У русі: <strong>{optimized.totalTravelMinutes} хв</strong></div>
              <div>Відстань: <strong>{optimized.totalDistanceKm.toFixed(1)} км</strong></div>
              <div>Зупинки: <strong>{optimized.totalServiceMinutes} хв</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
