import React from 'react';
import type { AddressInput, OptimizeRouteResponse, RouteStop } from '../types/route';
import { RouteMetricsSummary } from './results/RouteMetricsSummary';
import { TimelineView } from './results/TimelineView';
import { RouteMapPreview } from './results/RouteMapPreview';
import { ErrorBoundary } from './ErrorBoundary';

interface ResultsSectionProps {
  result: OptimizeRouteResponse | null;
  isLoading: boolean;
  theme?: 'light' | 'dark';
  start?: AddressInput;
  destination?: AddressInput;
  stops?: RouteStop[];
  onSetStartFromMap?: (address: string, lat: number, lng: number) => void;
  onAddStopFromMap?: (address: string, lat: number, lng: number) => void;
  onSetDestinationFromMap?: (address: string, lat: number, lng: number) => void;
  onTryExample?: () => void;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  result,
  isLoading,
  theme = 'light',
  start,
  destination,
  stops,
  onSetStartFromMap,
  onAddStopFromMap,
  onSetDestinationFromMap,
  onTryExample,
}) => {
  return (
    <div className="results-column-wrapper">
      {/* 1. CENTRAL MAP (ALWAYS VISIBLE WITH FLOATING ACTIONS & HERO OVERLAY) */}
      <div className="card map-stage-card">
        <ErrorBoundary
          fallbackTitle="Не вдалося відобразити мапу"
          fallbackMessage="Виникла помилка під час рендерингу карти Leaflet."
        >
          <RouteMapPreview
            preview={result?.routePreview}
            isLoading={isLoading}
            travelMode={result?.travelMode}
            theme={theme}
            fallbackStart={start}
            fallbackDestination={destination}
            fallbackStops={stops}
            onSetStart={onSetStartFromMap}
            onAddStop={onAddStopFromMap}
            onSetDestination={onSetDestinationFromMap}
            renderHeroOverlay={
              result ? (
                <RouteMetricsSummary
                  original={result.original}
                  optimized={result.optimized}
                  savedMinutes={result.savedMinutes}
                  savedDistanceKm={result.savedDistanceKm}
                  improvementPercent={result.improvementPercent}
                  planningMode={result.planningMode}
                  recommendedDepartureTime={result.recommendedDepartureTime}
                />
              ) : null
            }
          />
        </ErrorBoundary>
      </div>

      {/* 2. BELOW THE MAP: EMPTY STATE / HOW IT WORKS (BEFORE RUN) */}
      {!isLoading && !result && (
        <div className="card empty-guide-card">
          <div className="guide-header">
            <h3 className="guide-title">Як це працює</h3>
            {onTryExample && (
              <button
                type="button"
                className="btn-try-example"
                onClick={onTryExample}
                title="Заповнити форму тестовим маршрутом"
              >
                Спробувати приклад
              </button>
            )}
          </div>
          <div className="guide-steps-grid">
            <div className="guide-step-item">
              <span className="guide-step-num">1</span>
              <div>
                <strong>Вкажіть адреси</strong>
                <p>Оберіть початок, зупинки по дорозі та фініш</p>
              </div>
            </div>
            <div className="guide-step-item">
              <span className="guide-step-num">2</span>
              <div>
                <strong>Налаштуйте час</strong>
                <p>Виїзд або бажаний час прибуття (дедлайн)</p>
              </div>
            </div>
            <div className="guide-step-item">
              <span className="guide-step-num">3</span>
              <div>
                <strong>Отримайте розклад</strong>
                <p>Оптимальний порядок об'їзду та графік</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. BELOW THE MAP: STEP-BY-STEP ITINERARY TIMELINE (AFTER RUN) */}
      {!isLoading && result && (
        <div className="card timeline-card-wrap">
          <TimelineView
            timeline={result.timeline}
            planningMode={result.planningMode}
            explanationSteps={result.explanationSteps}
            travelMode={result.travelMode}
          />
        </div>
      )}
    </div>
  );
};
