import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { RoutePreviewDto, TravelMode } from '../../types/route';
import { buildGoogleMapsDirectionsUrl, copyToClipboard } from '../../utils/googleMaps';
import { reverseGeocode } from '../../api/geocodingClient';

interface RouteMapPreviewProps {
  preview?: RoutePreviewDto;
  isLoading?: boolean;
  travelMode?: TravelMode;
  theme?: 'light' | 'dark';
  onSetStart?: (address: string, lat: number, lng: number) => void;
  onAddStop?: (address: string, lat: number, lng: number) => void;
  onSetDestination?: (address: string, lat: number, lng: number) => void;
}

const iconCache = new Map<string, L.DivIcon>();

const getNumberedIcon = (label: string | number, type: 'start' | 'stop' | 'destination' = 'stop'): L.DivIcon => {
  const key = `${type}-${label}`;
  let icon = iconCache.get(key);
  if (!icon) {
    const badgeClass =
      type === 'start'
        ? 'map-marker-start'
        : type === 'destination'
        ? 'map-marker-dest'
        : 'map-marker-stop';

    icon = L.divIcon({
      className: 'custom-map-marker-container',
      html: `<div class="map-marker-badge ${badgeClass}">${label}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
    iconCache.set(key, icon);
  }
  return icon;
};

const MapBoundsUpdater: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }

    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [45, 45],
        maxZoom: 16,
      });
    }
  }, [map, points]);

  return null;
};

const getClickedIcon = (): L.DivIcon => {
  let icon = iconCache.get('clicked-pin');
  if (!icon) {
    icon = L.divIcon({
      className: 'custom-map-marker-container',
      html: `<div class="map-marker-badge map-marker-clicked"><span class="marker-pulse-ring"></span><span class="marker-clicked-dot"></span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
    iconCache.set('clicked-pin', icon);
  }
  return icon;
};

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface ClickedLocationState {
  lat: number;
  lng: number;
  address?: string;
  isLoading: boolean;
  error?: string;
}

export const RouteMapPreview: React.FC<RouteMapPreviewProps> = ({
  preview,
  isLoading,
  travelMode = 'driving',
  theme = 'light',
  onSetStart,
  onAddStop,
  onSetDestination,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const [clickedPoint, setClickedPoint] = useState<ClickedLocationState | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      if (reverseAbortRef.current) {
        reverseAbortRef.current.abort();
      }
    };
  }, []);

  const handleMapClick = async (lat: number, lng: number) => {
    if (reverseAbortRef.current) {
      reverseAbortRef.current.abort();
    }
    const controller = new AbortController();
    reverseAbortRef.current = controller;

    setClickedPoint({
      lat,
      lng,
      isLoading: true,
    });

    try {
      const suggestion = await reverseGeocode(lat, lng, controller.signal);
      setClickedPoint({
        lat,
        lng,
        address: suggestion.address || suggestion.displayName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        isLoading: false,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setClickedPoint({
        lat,
        lng,
        address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        isLoading: false,
        error: 'Не вдалося визначити точну поштову адресу',
      });
    }
  };

  const polylinePositions = useMemo<[number, number][]>(() => {
    if (!preview) return [];

    if (preview.geometryCoordinates && preview.geometryCoordinates.length > 0) {
      return preview.geometryCoordinates.map((coord) => [coord.latitude, coord.longitude]);
    }

    // Fallback: direct lines between start, stops, and destination
    const points: [number, number][] = [
      [preview.startPoint.latitude, preview.startPoint.longitude],
    ];
    preview.orderedStops.forEach((stop) => {
      points.push([stop.latitude, stop.longitude]);
    });
    if (preview.destinationPoint && preview.destinationPoint.address) {
      points.push([preview.destinationPoint.latitude, preview.destinationPoint.longitude]);
    }
    return points;
  }, [preview]);

  const allKeyPoints = useMemo<[number, number][]>(() => {
    if (!preview?.startPoint) return [];
    const points: [number, number][] = [
      [preview.startPoint.latitude, preview.startPoint.longitude],
    ];
    preview.orderedStops.forEach((stop) => {
      points.push([stop.latitude, stop.longitude]);
    });
    if (preview.destinationPoint && preview.destinationPoint.address) {
      points.push([preview.destinationPoint.latitude, preview.destinationPoint.longitude]);
    }
    return points;
  }, [preview]);

  if (isLoading) {
    return (
      <div className="card route-map-card">
        <div className="map-skeleton">
          <div className="btn-spinner text-primary" />
          <p className="skeleton-subtitle">Завантажуємо дорожню карту...</p>
        </div>
      </div>
    );
  }

  if (!preview || !preview.startPoint) {
    return (
      <div className="card route-map-card route-map-empty">
        <p className="empty-state-text">Дані для мапи наразі відсутні.</p>
      </div>
    );
  }

  const initialCenter: [number, number] = [
    preview.startPoint.latitude,
    preview.startPoint.longitude,
  ];

  const totalPointsCount = preview.orderedStops.length + 1 + (preview.destinationPoint?.address ? 1 : 0);
  const googleMapsUrl = buildGoogleMapsDirectionsUrl(preview, travelMode);

  const handleCopy = async () => {
    if (!googleMapsUrl) return;
    const success = await copyToClipboard(googleMapsUrl);
    if (success) {
      setCopied(true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 2500);
    }
  };

  return (
    <div className="card route-map-card">
      <div className="route-map-header">
        <div className="route-map-title-wrap">
          <h3 className="section-title">Мапа маршруту</h3>
          <span className="badge-muted">
            {totalPointsCount <= 2 ? 'Пряма лінія (2 точки)' : `${totalPointsCount} точок маршруту`}
          </span>
        </div>

        <div className="route-map-header-right">
          <div className="map-legend">
            <span className="legend-item">
              <span className="legend-badge legend-start">A</span> Старт
            </span>
            {preview.orderedStops.length > 0 && (
              <span className="legend-item">
                <span className="legend-badge legend-stop">1..N</span> Зупинки
              </span>
            )}
            <span className="legend-item">
              <span className="legend-badge legend-dest">B</span> Фініш
            </span>
          </div>

          <span className="map-header-divider" aria-hidden="true" />

          {googleMapsUrl && (
            <div className="map-actions-group">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="map-header-ext-link"
                title="Відкрити оптимізований маршрут у Google Maps"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Google Maps</span>
              </a>

              <button
                type="button"
                className={`map-header-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Скопіювати посилання на Google Maps"
                aria-live="polite"
              >
                {copied ? (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Скопійовано!</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Скопіювати</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="route-map-wrapper">
        <MapContainer
          center={initialCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="leaflet-map-element"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsUpdater
            points={polylinePositions.length > 0 ? polylinePositions : allKeyPoints}
          />

          {/* Start Marker */}
          <Marker
            position={[preview.startPoint.latitude, preview.startPoint.longitude]}
            icon={getNumberedIcon('A', 'start')}
          >
            <Popup>
              <div className="map-popup-content">
                <strong>Старт: {preview.startPoint.label}</strong>
                <p>{preview.startPoint.address}</p>
              </div>
            </Popup>
          </Marker>

          {/* Stop Markers in optimized sequence */}
          {preview.orderedStops.map((stop) => (
            <Marker
              key={stop.id}
              position={[stop.latitude, stop.longitude]}
              icon={getNumberedIcon(stop.order, 'stop')}
            >
              <Popup>
                <div className="map-popup-content">
                  <strong>
                    Зупинка #{stop.order}: {stop.label}
                  </strong>
                  <p>{stop.address}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Destination Marker */}
          {preview.destinationPoint && preview.destinationPoint.address && (
            <Marker
              position={[preview.destinationPoint.latitude, preview.destinationPoint.longitude]}
              icon={getNumberedIcon('B', 'destination')}
            >
              <Popup>
                <div className="map-popup-content">
                  <strong>Фініш: {preview.destinationPoint.label}</strong>
                  <p>{preview.destinationPoint.address}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Optimized Route Polyline */}
          {polylinePositions.length > 1 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: theme === 'dark' ? '#38bdf8' : '#2563eb',
                weight: 5,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* Map Click Listener */}
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Interactive Clicked Waypoint Marker & Action Popup */}
          {clickedPoint && (
            <Marker
              position={[clickedPoint.lat, clickedPoint.lng]}
              icon={getClickedIcon()}
            >
              <Popup
                autoPan={true}
                eventHandlers={{
                  remove: () => setClickedPoint(null),
                }}
              >
                <div className="map-click-popup">
                  <div className="map-click-header">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>Обрана точка</span>
                  </div>

                  {clickedPoint.isLoading ? (
                    <div className="map-click-loading">
                      <span className="btn-spinner text-primary" />
                      <span>Визначаємо адресу...</span>
                    </div>
                  ) : (
                    <>
                      <p className="map-click-address">{clickedPoint.address}</p>
                      {clickedPoint.error && (
                        <p className="map-click-error">{clickedPoint.error}</p>
                      )}

                      <div className="map-click-actions">
                        {onSetStart && (
                          <button
                            type="button"
                            className="map-action-btn btn-action-start"
                            onClick={() => {
                              onSetStart(clickedPoint.address || `${clickedPoint.lat.toFixed(5)}, ${clickedPoint.lng.toFixed(5)}`, clickedPoint.lat, clickedPoint.lng);
                              setClickedPoint(null);
                            }}
                            title="Встановити як початкову точку подорожі"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" stroke="none">A</text>
                            </svg>
                            <span>Старт</span>
                          </button>
                        )}

                        {onAddStop && (
                          <button
                            type="button"
                            className="map-action-btn btn-action-stop"
                            onClick={() => {
                              onAddStop(clickedPoint.address || `${clickedPoint.lat.toFixed(5)}, ${clickedPoint.lng.toFixed(5)}`, clickedPoint.lat, clickedPoint.lng);
                              setClickedPoint(null);
                            }}
                            title="Додати як проміжну зупинку"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>Зупинка</span>
                          </button>
                        )}

                        {onSetDestination && (
                          <button
                            type="button"
                            className="map-action-btn btn-action-dest"
                            onClick={() => {
                              onSetDestination(clickedPoint.address || `${clickedPoint.lat.toFixed(5)}, ${clickedPoint.lng.toFixed(5)}`, clickedPoint.lat, clickedPoint.lng);
                              setClickedPoint(null);
                            }}
                            title="Встановити як кінцеву точку подорожі"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor" stroke="none">B</text>
                            </svg>
                            <span>Фініш</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {copied && (
        <div className="export-toast-snackbar" role="status" aria-live="polite">
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
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Посилання на маршрут скопійовано!</span>
        </div>
      )}
    </div>
  );
};
