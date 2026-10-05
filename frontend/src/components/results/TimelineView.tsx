import React from 'react';
import type { PlanningMode, TimelineItemDto } from '../../types/route';

interface TimelineViewProps {
  timeline: TimelineItemDto[];
  planningMode?: PlanningMode;
}

function formatTime(isoString: string): string {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getServiceDuration(arrivalIso: string, departureIso: string): number {
  const arrival = new Date(arrivalIso).getTime();
  const departure = new Date(departureIso).getTime();
  if (isNaN(arrival) || isNaN(departure) || departure <= arrival) return 0;
  return Math.round((departure - arrival) / (1000 * 60));
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline, planningMode }) => {
  if (!timeline || timeline.length === 0) return null;

  return (
    <div className="results-block">
      <h3 className="block-title">Estimated Timeline (ETA Schedule)</h3>
      <div className="timeline-list">
        {timeline.map((item, index) => {
          const serviceMinutes = getServiceDuration(item.arrivalTime, item.departureTime);
          const isStart = index === 0;
          const isDestination = index === timeline.length - 1 && timeline.length > 1;

          return (
            <div key={`${item.label}-${index}`} className="timeline-item">
              <div className="timeline-rail">
                <span className={`timeline-dot ${isStart ? 'timeline-dot-start' : ''}`}></span>
                {index < timeline.length - 1 && <span className="timeline-line"></span>}
              </div>

              <div className="timeline-details">
                <div className="timeline-header-row">
                  <span className="timeline-stop-title">
                    {item.label}
                    {isStart && (
                      <span className="timeline-tag">
                        {planningMode === 'arrive-by' ? 'Recommended Start' : 'Start Point'}
                      </span>
                    )}
                    {isDestination && planningMode === 'arrive-by' && (
                      <span className="timeline-tag timeline-tag-deadline">
                        Target Arrival
                      </span>
                    )}
                  </span>
                  <div className="timeline-times">
                    {!isStart && (
                      <span className="time-badge time-arrival" title="Estimated Arrival Time">
                        Arr: {formatTime(item.arrivalTime)}
                      </span>
                    )}
                    <span className="time-badge time-departure" title="Estimated Departure Time">
                      Dep: {formatTime(item.departureTime)}
                    </span>
                  </div>
                </div>

                {serviceMinutes > 0 && (
                  <span className="timeline-service-hint">
                    Stop duration: {serviceMinutes} min service
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
