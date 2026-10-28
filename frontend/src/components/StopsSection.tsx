import React, { useState } from 'react';
import './StopsSection.css';
import type { RouteStop } from '../types/route';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { resolveUpdatedLabel } from '../utils/address';

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

  const handleMoveUp = (index: number) => {
    if (index <= 0 || isLoading) return;
    const updated = [...stops];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onReorderStops?.(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= stops.length - 1 || isLoading) return;
    const updated = [...stops];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onReorderStops?.(updated);
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
                        const cleanLabel = resolveUpdatedLabel(
                          stop.label,
                          stop.address,
                          newAddress,
                          `Зупинка ${index + 1}`,
                          suggestion?.displayName
                        );
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

                  {/* Reorder Stop Buttons (Mobile & Keyboard accessibility) */}
                  {stops.length >= 2 && (
                    <div className="stop-reorder-group">
                      <button
                        type="button"
                        className="stop-reorder-btn"
                        title={`Перемістити зупинку ${index + 1} вище`}
                        aria-label={`Перемістити зупинку ${index + 1} вище`}
                        onClick={() => handleMoveUp(index)}
                        disabled={isLoading || index === 0}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="18 15 12 9 6 15" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="stop-reorder-btn"
                        title={`Перемістити зупинку ${index + 1} нижче`}
                        aria-label={`Перемістити зупинку ${index + 1} нижче`}
                        onClick={() => handleMoveDown(index)}
                        disabled={isLoading || index === stops.length - 1}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                  )}

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
