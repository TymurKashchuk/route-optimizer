import React from 'react';
import type { OptimizeRouteResponse } from '../types/route';
import { RouteMetricsSummary } from './results/RouteMetricsSummary';
import { TimelineView } from './results/TimelineView';
import { RouteMapPreview } from './results/RouteMapPreview';
import { ErrorBoundary } from './ErrorBoundary';
import { formatTime } from '../utils/dateTime';

interface ResultsSectionProps {
  result: OptimizeRouteResponse | null;
  isLoading: boolean;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ result, isLoading }) => {
  const isDirect = result ? result.orderedStops.length === 0 : false;

  return (
    <section className="card results-section" aria-labelledby="results-section-title">
      <div className="section-header">
        <div>
          <h2 id="results-section-title" className="section-title">
            Результати подорожі
          </h2>
          <span className="section-subtitle">
            {isLoading
              ? 'Виконуємо оптимізацію...'
              : result
              ? isDirect
                ? 'Прямий маршрут між двома точками'
                : 'Оптимізований маршрут із зупинками'
              : 'Карта та розклад поїздки'}
          </span>
        </div>

        {isLoading && <span className="badge-muted">Розраховуємо...</span>}
        {!isLoading && result && (
          <div className="results-header-badges">
            <span
              className="badge-travel-mode"
              title={`Режим пересування: ${result.travelMode === 'walking' ? 'Пішки' : result.travelMode === 'cycling' ? 'Велосипед' : 'Авто'}`}
            >
              {result.travelMode === 'walking' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                  <path d="m6.5 21.5 3.5-6.5 3 2.5v4" />
                  <path d="m6 11 3.5 1.5 3-3.5 3 2.5 3.5-1.5" />
                  <path d="m9.5 12.5 2 3.5" />
                </svg>
              ) : result.travelMode === 'cycling' ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="5.5" cy="17.5" r="3.5" />
                  <circle cx="18.5" cy="17.5" r="3.5" />
                  <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5 2-6.5h3.5" />
                  <path d="M5.5 17.5 9 9l3.5 5.5H18" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              )}
              <span>{result.travelMode === 'walking' ? 'Пішки' : result.travelMode === 'cycling' ? 'Велосипед' : 'Авто'}</span>
            </span>
            <span className="badge-success">
              {isDirect ? 'Пряма поїздка' : 'Маршрут оптимізовано'}
            </span>
          </div>
        )}
        {!isLoading && !result && <span className="badge-muted">Очікує старту</span>}
      </div>

      {/* SKELETON LOADING STATE */}
      {isLoading && (
        <div className="skeleton-container" aria-busy="true" aria-live="polite">
          <div className="skeleton-header">
            <svg
              className="btn-spinner text-primary"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <div>
              <h3 className="skeleton-title">Будуємо оптимальний маршрут...</h3>
              <p className="skeleton-subtitle">Розраховуємо дорожню геометрію та формуємо графік</p>
            </div>
          </div>
          <div className="skeleton-cards">
            <div className="skeleton-block skeleton-block-metric" />
            <div className="skeleton-block skeleton-block-metric" />
            <div className="skeleton-block skeleton-block-metric" />
          </div>
          <div className="skeleton-block skeleton-block-tall" />
          <div className="skeleton-block skeleton-block-wide" />
        </div>
      )}

      {/* EMPTY STATE */}
      {!isLoading && !result && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
          </div>
          <h3 className="empty-state-title">Ваша подорож зʼявиться тут</h3>
          <p className="empty-state-text">
            Вкажіть звідки і куди ви прямуєте, за бажанням додайте проміжні зупинки,
            та натисніть <strong>«Побудувати маршрут»</strong>. Ми розрахуємо найкращу послідовність,
            покажемо шлях на мапі та сформуємо покроковий розклад вашого дня.
          </p>
        </div>
      )}

      {/* CALCULATED RESULTS */}
      {!isLoading && result && (
        <div className="results-container">
          {/* Recommendation Banner for Arrive-By mode */}
          {result.planningMode === 'arrive-by' && result.recommendedDepartureTime && (
            <div className="recommendation-banner">
              <div className="recommendation-banner-icon" aria-hidden="true">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="recommendation-banner-body">
                <h3 className="recommendation-banner-title">
                  Рекомендований час виїзду: <strong>{formatTime(result.recommendedDepartureTime)}</strong>
                </h3>
                <p className="recommendation-banner-subtitle">
                  Вирушайте о цій порі, щоб комфортно прибути до місця призначення без запізнень.
                </p>
              </div>
            </div>
          )}

          {/* Trip Summary Metrics */}
          <RouteMetricsSummary
            original={result.original}
            optimized={result.optimized}
            savedMinutes={result.savedMinutes}
            savedDistanceKm={result.savedDistanceKm}
            improvementPercent={result.improvementPercent}
          />

          {/* Interactive Map Preview with Google Maps navigation and copy action */}
          <ErrorBoundary
            fallbackTitle="Не вдалося відобразити інтерактивну мапу"
            fallbackMessage="Виникла помилка під час рендерингу карти Leaflet. Інші деталі маршруту та покроковий розклад доступні нижче."
          >
            <RouteMapPreview preview={result.routePreview} travelMode={result.travelMode} />
          </ErrorBoundary>

          {/* Integrated Step-by-Step Itinerary */}
          <TimelineView
            timeline={result.timeline}
            planningMode={result.planningMode}
            explanationSteps={result.explanationSteps}
            travelMode={result.travelMode}
          />
        </div>
      )}
    </section>
  );
};
