import React from 'react';
import type { PlanningMode, RouteStepDto, TimelineItemDto, TravelMode } from '../../types/route';
import { formatTime, getServiceDuration } from '../../utils/dateTime';

interface TimelineViewProps {
  timeline: TimelineItemDto[];
  planningMode?: PlanningMode;
  explanationSteps?: RouteStepDto[];
  travelMode?: TravelMode;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  timeline,
  planningMode,
  explanationSteps = [],
  travelMode = 'driving',
}) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="trip-itinerary-card">
      <div className="itinerary-header">
        <div className="itinerary-title-wrap">
          <svg
            className="itinerary-title-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <h3 className="itinerary-title">Розклад подорожі покроково</h3>
        </div>
        <span className="itinerary-badge">
          {timeline.length <= 2 ? 'Пряма поїздка' : `${timeline.length} пунктів`}
        </span>
      </div>

      <div className="itinerary-flow">
        {timeline.map((item, index) => {
          const serviceMinutes = getServiceDuration(item.arrivalTime, item.departureTime);
          const isStart = index === 0;
          const isDestination = index === timeline.length - 1 && timeline.length > 1;
          const legStep = explanationSteps[index];

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              {/* Waypoint Card */}
              <div className={`itinerary-node ${isStart ? 'node-start' : isDestination ? 'node-dest' : 'node-stop'}`}>
                {/* Node Badge / Marker */}
                <div className="itinerary-marker">
                  <span className={`marker-circle ${isStart ? 'marker-start' : isDestination ? 'marker-dest' : 'marker-stop'}`}>
                    {isStart ? 'A' : isDestination ? 'B' : index}
                  </span>
                </div>

                {/* Node Details */}
                <div className="itinerary-node-body">
                  <div className="node-main-row">
                    <span className="node-name">{item.label}</span>

                    {/* Role Tags */}
                    {isStart && (
                      <span className="node-tag node-tag-start">
                        {planningMode === 'arrive-by' ? 'Рекомендований виїзд' : 'Початок'}
                      </span>
                    )}
                    {isDestination && (
                      <span className={`node-tag ${planningMode === 'arrive-by' ? 'node-tag-deadline' : 'node-tag-dest'}`}>
                        {planningMode === 'arrive-by' ? 'Дедлайн прибуття' : 'Кінець'}
                      </span>
                    )}

                    {/* Times Badges */}
                    <div className="node-times">
                      {!isStart && (
                        <div className="time-pill time-pill-arr" title="Орієнтовний час прибуття">
                          <span className="time-pill-label">Прибуття:</span>
                          <strong>{formatTime(item.arrivalTime)}</strong>
                        </div>
                      )}
                      {!isDestination && (
                        <div className="time-pill time-pill-dep" title="Орієнтовний час виїзду">
                          <span className="time-pill-label">Виїзд:</span>
                          <strong>{formatTime(item.departureTime)}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stop Stay Duration Note */}
                  {serviceMinutes > 0 && (
                    <div className="node-stay-hint">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Запланована зупинка: <strong>{serviceMinutes} хв</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* Transit Leg Between Points */}
              {index < timeline.length - 1 && (
                <div className="itinerary-transit-leg">
                  <div className="transit-track-line" aria-hidden="true" />
                  <div className="transit-info-badge">
                    {travelMode === 'walking' ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M13 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                        <path d="m6.5 21.5 3.5-6.5 3 2.5v4" />
                        <path d="m6 11 3.5 1.5 3-3.5 3 2.5 3.5-1.5" />
                        <path d="m9.5 12.5 2 3.5" />
                      </svg>
                    ) : travelMode === 'cycling' ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="5.5" cy="17.5" r="3.5" />
                        <circle cx="18.5" cy="17.5" r="3.5" />
                        <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5 2-6.5h3.5" />
                        <path d="M5.5 17.5 9 9l3.5 5.5H18" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
                        <circle cx="7" cy="17" r="2" />
                        <path d="M9 17h6" />
                        <circle cx="17" cy="17" r="2" />
                      </svg>
                    )}
                    <span>
                      {legStep
                        ? `${legStep.travelMinutes} хв у дорозі`
                        : travelMode === 'walking'
                        ? 'Піший перехід до наступної точки'
                        : travelMode === 'cycling'
                        ? 'Поїздка велосипедом до наступної точки'
                        : 'Переїзд до наступної точки'}
                    </span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
