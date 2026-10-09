import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RoutePreviewDto } from '../../types/route';
import { buildGoogleMapsDirectionsUrl, copyToClipboard } from '../../utils/googleMaps';

interface RouteMapPreviewProps {
  preview?: RoutePreviewDto;
  isLoading?: boolean;
}

const createNumberedIcon = (label: string | number, type: 'start' | 'stop' | 'destination' = 'stop') => {
  const badgeClass =
    type === 'start'
      ? 'map-marker-start'
      : type === 'destination'
      ? 'map-marker-dest'
      : 'map-marker-stop';

  return L.divIcon({
    className: 'custom-map-marker-container',
    html: `<div class="map-marker-badge ${badgeClass}">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
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
    map.fitBounds(bounds, {
      padding: [45, 45],
      maxZoom: 16,
    });
  }, [map, points]);

  return null;
};

export const RouteMapPreview: React.FC<RouteMapPreviewProps> = ({ preview, isLoading }) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
  const googleMapsUrl = buildGoogleMapsDirectionsUrl(preview);

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
            icon={createNumberedIcon('A', 'start')}
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
              icon={createNumberedIcon(stop.order, 'stop')}
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
              icon={createNumberedIcon('B', 'destination')}
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
                color: '#2563eb',
                weight: 5,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
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
