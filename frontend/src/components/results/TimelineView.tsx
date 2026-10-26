import React from 'react';
import './TimelineView.css';
import type { PlanningMode, RouteStepDto, TimelineItemDto, TravelMode } from '../../types/route';
import { formatDayMonthUk, formatTime, getServiceDuration, isTimestampInPast } from '../../utils/dateTime';

interface TimelineViewProps {
  timeline: TimelineItemDto[];
  planningMode?: PlanningMode;
  explanationSteps?: RouteStepDto[];
  travelMode?: TravelMode;
  isStale?: boolean;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  planningMode,
  explanationSteps = [],
  isStale,
}) => {
  if (!timeline || timeline.length === 0) return null;

  const dateSubheader = timeline[0]?.departureTime
    ? formatDayMonthUk(timeline[0].departureTime)
    : formatDayMonthUk();

  const isDepartureInPast =
    planningMode === 'arrive-by' && isTimestampInPast(timeline[0]?.departureTime);

  return (
    <div className={`schedule-timeline-container ${isStale ? 'is-stale' : ''}`}>
      {/* Header matching mockup: "Розклад поїздки" and "4 пункти · пт, 16 жовтня" */}
      <div className="schedule-header">
        <h3 className="schedule-title">Розклад поїздки</h3>
        <span className="schedule-meta tabular-nums">
          {timeline.length} {timeline.length === 1 ? 'пункт' : timeline.length < 5 ? 'пункти' : 'пунктів'}
          {dateSubheader && ` · ${dateSubheader}`}
        </span>
      </div>

      {isDepartureInPast && (
        <div className="schedule-late-alert" role="alert">
          <svg className="late-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            Розрахований час виїзду ({formatTime(timeline[0].departureTime)}) уже минув. Щоб прибути вчасно, потрібно було вирушити раніше або скоригувати час прибуття.
          </span>
        </div>
      )}

      {isStale && (
        <div className="schedule-stale-notice" role="status">
          <span className="stale-dot" aria-hidden="true" />
          <span>Розклад складено для попередніх параметрів. Оновіть розрахунок для актуальних даних.</span>
        </div>
      )}

      {/* Vertical Timeline sequence */}
      <div className="schedule-items-list">
        {timeline.map((item, index) => {
          const serviceMinutes = getServiceDuration(item.arrivalTime, item.departureTime);
          const isStart = index === 0;
          const isLast = index === timeline.length - 1;
          const isDestination = isLast && timeline.length > 1;
          const legStep = explanationSteps[index];

          // Primary display time
          const mainTime = isStart
            ? formatTime(item.departureTime)
            : formatTime(item.arrivalTime);

          const subTime = !isStart && !isDestination && item.departureTime
            ? `до ${formatTime(item.departureTime)}`
            : null;

          return (
            <div key={`${item.label}-${index}`} className={`schedule-step-item ${isLast ? 'is-last' : ''}`}>
              {/* 1. Time Column */}
              <div className="schedule-time-col">
                <span className="schedule-main-time tabular-nums">{mainTime}</span>
                {subTime && (
                  <span className="schedule-sub-time tabular-nums">{subTime}</span>
                )}
              </div>

              {/* 2. Spine Track: Marker Dot & Continuous Stem Line */}
              <div className="schedule-spine-col">
                <span
                  className={`timeline-dot ${
                    isStart ? 'dot-start' : isDestination ? 'dot-dest' : 'dot-stop'
                  }`}
                  aria-hidden="true"
                />
                {!isLast && <span className="timeline-continuous-stem" aria-hidden="true" />}
              </div>

              {/* 3. Stop Details & Transit Pill */}
              <div className="schedule-body-col">
                <div className="schedule-stop-header">
                  <div className="schedule-name-text">
                    {isStart && item.label}
                    {isDestination && item.label}
                    {!isStart && !isDestination && (
                      <>
                        <strong>Зупинка {index}</strong> · {item.label}
                      </>
                    )}
                  </div>
                  <div className="schedule-status-subtext">
                    {isStart && (planningMode === 'arrive-by' ? 'Рекомендований виїзд' : 'Виїзд')}
                    {isDestination && (planningMode === 'arrive-by' ? 'Дедлайн прибуття' : 'Кінець маршруту')}
                    {!isStart && !isDestination && (
                      serviceMinutes > 0 ? `Стоянка ${serviceMinutes} хв` : 'Коротка зупинка'
                    )}
                  </div>
                </div>

                {/* Transit pill between stops */}
                {!isLast && (
                  <div className="schedule-transit-chip-row">
                    <span className="schedule-leg-pill tabular-nums">
                      {legStep ? `${legStep.travelMinutes} хв у дорозі` : 'У дорозі'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
