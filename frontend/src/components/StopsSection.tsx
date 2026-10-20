import React, { useState } from 'react';
import type { RouteStop } from '../types/route';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { deriveStopLabel } from '../utils/address';

interface StopsSectionProps {
  stops: RouteStop[];
  isLoading: boolean;
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onUpdateStop: (id: string, fields: Partial<RouteStop>) => void;
  onReorderStops?: (reorderedStops: RouteStop[]) => void;
  city?: string;
  onEnterPress?: () => void;
}

export const StopsSection: React.FC<StopsSectionProps> = ({
  stops,
  isLoading,
  onAddStop,
  onRemoveStop,
  onUpdateStop,
  onReorderStops,
  city,
  onEnterPress,
}) => {
  const isMaxStopsReached = stops.length >= 10;
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...stops];
    const [moved] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, moved);

    onReorderStops?.(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="stops-chain-container">
      {stops.length > 0 && (
        <div className="stops-compact-list">
          {stops.map((stop, index) => {
            const rowZIndex = 80 - index;

            return (
              <div
                key={stop.id}
                className={`stop-row-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                style={{ zIndex: rowZIndex }}
                draggable={!isLoading && stops.length >= 2}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                {/* Outlined Numbered Circle Marker */}
                <div
                  className="stop-circle-marker"
                  title={stops.length >= 2 ? `Зупинка ${index + 1} (потягніть, щоб змінити порядок)` : `Зупинка ${index + 1}`}
                >
                  <span className="stop-circle-num">{index + 1}</span>
                </div>

                {/* Input Fields Wrapper */}
                <div className="stop-fields-wrap">
                  <div className="stop-address-box">
                    <AddressAutocompleteInput
                      id={`stop-address-${stop.id}`}
                      className="form-input form-input-clean stop-address-input"
                      placeholder={
                        city
                          ? `Адреса зупинки ${index + 1} (${city})`
                          : `Адреса зупинки ${index + 1}`
                      }
                      value={stop.address}
                      city={city}
                      hasCoordinates={Boolean(stop.latitude && stop.longitude)}
                      onEnterPress={onEnterPress}
                      onChange={(newAddress, suggestion) => {
                        const isDefaultLabel =
                          !stop.label ||
                          stop.label.startsWith('Зупинка') ||
                          stop.label.startsWith('Stop') ||
                          stop.label.trim().length < 3;
                        const cleanLabel = isDefaultLabel
                          ? deriveStopLabel(newAddress, `Зупинка ${index + 1}`)
                          : stop.label;
                        onUpdateStop(stop.id, {
                          address: newAddress,
                          label: cleanLabel,
                          latitude: suggestion?.latitude,
                          longitude: suggestion?.longitude,
                        });
                      }}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Service / Stay Duration Input */}
                  <div className="stop-stay-box" title="Час перебування на зупинці (хвилини)">
                    <input
                      id={`stop-service-${stop.id}`}
                      type="number"
                      min={0}
                      max={480}
                      className="stop-stay-input"
                      value={stop.serviceMinutes === 0 ? '' : stop.serviceMinutes}
                      placeholder="0"
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === '') {
                          onUpdateStop(stop.id, { serviceMinutes: 0 });
                          return;
                        }
                        const minutes = parseInt(raw, 10);
                        if (!isNaN(minutes)) {
                          onUpdateStop(stop.id, {
                            serviceMinutes: Math.min(480, Math.max(0, minutes)),
                          });
                        }
                      }}
                      disabled={isLoading}
                      aria-label={`Час перебування на зупинці ${index + 1}`}
                    />
                    <span className="stop-stay-unit">хв</span>
                  </div>

                  {/* Remove Stop Button */}
                  <button
                    type="button"
                    className="stop-remove-btn"
                    title={`Видалити зупинку ${index + 1}`}
                    onClick={() => onRemoveStop(stop.id)}
                    disabled={isLoading}
                    aria-label={`Видалити зупинку ${index + 1}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Add Stop Pill Button */}
      <div className="stops-action-row">
        <button
          type="button"
          className="btn-add-stop-pill"
          onClick={onAddStop}
          disabled={isLoading || isMaxStopsReached}
          title={isMaxStopsReached ? 'Досягнуто ліміт 10 зупинок' : 'Додати проміжну зупинку'}
        >
          <span className="add-icon-plus" aria-hidden="true">+</span>
          <span>Додати зупинку</span>
          <span className="add-count-badge">{stops.length}/10</span>
        </button>
      </div>
    </div>
  );
};
