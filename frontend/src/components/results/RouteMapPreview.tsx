import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import type { AddressInput, RoutePreviewDto, RouteStop, TravelMode } from '../../types/route';
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
  fallbackStart?: AddressInput;
  fallbackDestination?: AddressInput;
  fallbackStops?: RouteStop[];
  renderHeroOverlay?: React.ReactNode;
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
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
    iconCache.set(key, icon);
  }
  return icon;
};

const getPointsKey = (pts: [number, number][]): string => {
  if (pts.length === 0) return '';
  if (pts.length <= 10) {
    return pts.map((p) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join('|');
  }
  const first = pts[0];
  const mid = pts[Math.floor(pts.length / 2)];
  const last = pts[pts.length - 1];
  return `len:${pts.length}|${first[0].toFixed(5)},${first[1].toFixed(5)}|${mid[0].toFixed(5)},${mid[1].toFixed(5)}|${last[0].toFixed(5)},${last[1].toFixed(5)}`;
};

const MapBoundsUpdater: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  const prevPointsKeyRef = useRef<string>('');

  useEffect(() => {
    if (points.length === 0) {
      prevPointsKeyRef.current = '';
      return;
    }

    const currentKey = getPointsKey(points);
    if (currentKey === prevPointsKeyRef.current) {
      return;
    }
    prevPointsKeyRef.current = currentKey;

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    const bounds = L.latLngBounds(points);
    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
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
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -13],
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
  theme: _theme = 'light',
  onSetStart,
  onAddStop,
  onSetDestination,
  fallbackStart,
  fallbackDestination,
  fallbackStops,
  renderHeroOverlay,
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

  const preRoutePoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    if (fallbackStart?.latitude && fallbackStart?.longitude) {
      pts.push([fallbackStart.latitude, fallbackStart.longitude]);
    }
    fallbackStops?.forEach((s) => {
      if (s.latitude && s.longitude) {
        pts.push([s.latitude, s.longitude]);
      }
    });
    if (fallbackDestination?.latitude && fallbackDestination?.longitude) {
      pts.push([fallbackDestination.latitude, fallbackDestination.longitude]);
    }
    return pts;
  }, [fallbackStart, fallbackStops, fallbackDestination]);

  // Center of Ukraine by default (Cherkasy / Kropyvnytskyi region) or start point
  const mapCenter = useMemo<[number, number]>(() => {
    if (preview?.startPoint?.latitude && preview?.startPoint?.longitude) {
      return [preview.startPoint.latitude, preview.startPoint.longitude];
    }
    if (fallbackStart?.latitude && fallbackStart?.longitude) {
      return [fallbackStart.latitude, fallbackStart.longitude];
    }
    if (preRoutePoints.length > 0) {
      return preRoutePoints[0];
    }
    // Geographic Center of Ukraine
    return [48.3794, 31.1656];
  }, [preview, fallbackStart, preRoutePoints]);

  const googleMapsUrl = preview ? buildGoogleMapsDirectionsUrl(preview, travelMode) : null;

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

  const pointsToFit = preview
    ? polylinePositions.length > 0
      ? polylinePositions
      : allKeyPoints
    : preRoutePoints;

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="map-canvas-container">
      {/* FLOATING ACTION BUTTONS (GOOGLE MAPS & COPY LINK) */}
      {preview && googleMapsUrl && (
        <div className="map-floating-actions">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="floating-action-btn"
            title="Відкрити маршрут у Google Maps"
          >
            <span>Відкрити в Google Maps</span>
            <span className="action-arrow-icon" aria-hidden="true">↗</span>
          </a>

          <button
            type="button"
            className={`floating-action-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Скопіювати посилання на Google Maps"
            aria-live="polite"
          >
            {copied ? 'Скопійовано!' : 'Копіювати посилання'}
          </button>
        </div>
      )}

      {/* FLOATING HERO OVERLAY (WHEN RESULT EXISTS) */}
      {renderHeroOverlay && (
        <div className="map-hero-overlay-slot">
          {renderHeroOverlay}
        </div>
      )}

      {/* LEAFLET MAP */}
      <MapContainer
        center={mapCenter}
        zoom={preRoutePoints.length > 0 || preview ? 12 : 6}
        scrollWheelZoom={true}
        zoomControl={false}
        className="leaflet-map-element"
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
        />

        {pointsToFit.length > 0 && <MapBoundsUpdater points={pointsToFit} />}

        {/* 1. CALCULATED PREVIEW MARKERS & ROUTE */}
        {preview && (
          <>
            {/* Start Marker A */}
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

            {/* Stops Markers 1..N */}
            {preview.orderedStops.map((stop) => (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
                icon={getNumberedIcon(stop.order, 'stop')}
              >
                <Popup>
                  <div className="map-popup-content">
                    <strong>Зупинка #{stop.order}: {stop.label}</strong>
                    <p>{stop.address}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Destination Marker B */}
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

            {/* Orange Bold Route Polyline from mockup */}
            {polylinePositions.length > 1 && (
              <Polyline
                positions={polylinePositions}
                pathOptions={{
                  color: '#C9400F',
                  weight: 6,
                  opacity: 0.95,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )}
          </>
        )}

        {/* 2. DRAFT FALLBACK MARKERS (BEFORE CALCULATION) */}
        {!preview && (
          <>
            {fallbackStart?.latitude && fallbackStart?.longitude && (
              <Marker
                position={[fallbackStart.latitude, fallbackStart.longitude]}
                icon={getNumberedIcon('A', 'start')}
              >
                <Popup>
                  <div className="map-popup-content">
                    <strong>Старт: {fallbackStart.label || 'Старт'}</strong>
                    <p>{fallbackStart.address}</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {fallbackStops?.map((stop, idx) =>
              stop.latitude && stop.longitude ? (
                <Marker
                  key={stop.id}
                  position={[stop.latitude, stop.longitude]}
                  icon={getNumberedIcon(idx + 1, 'stop')}
                >
                  <Popup>
                    <div className="map-popup-content">
                      <strong>Зупинка #{idx + 1}: {stop.label}</strong>
                      <p>{stop.address}</p>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}

            {fallbackDestination?.latitude && fallbackDestination?.longitude && (
              <Marker
                position={[fallbackDestination.latitude, fallbackDestination.longitude]}
                icon={getNumberedIcon('B', 'destination')}
              >
                <Popup>
                  <div className="map-popup-content">
                    <strong>Фініш: {fallbackDestination.label || 'Фініш'}</strong>
                    <p>{fallbackDestination.address}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </>
        )}

        {/* Click-to-add waypoint handler */}
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

      {/* LOADING OVERLAY OVER MAP */}
      {isLoading && (
        <div className="map-loading-overlay" aria-busy="true">
          <div className="map-loading-spinner-box">
            <svg className="btn-spinner" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span>Будуємо оптимальний маршрут…</span>
          </div>
        </div>
      )}
    </div>
  );
};
