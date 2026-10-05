import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RoutePreviewDto } from '../../types/route';

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
          <p className="skeleton-subtitle">Loading map geometry...</p>
        </div>
      </div>
    );
  }

  if (!preview || !preview.startPoint) {
    return (
      <div className="card route-map-card route-map-empty">
        <p className="empty-state-text">No route preview data available.</p>
      </div>
    );
  }

  const initialCenter: [number, number] = [
    preview.startPoint.latitude,
    preview.startPoint.longitude,
  ];

  const totalPointsCount = preview.orderedStops.length + 1 + (preview.destinationPoint?.address ? 1 : 0);

  return (
    <div className="card route-map-card">
      <div className="route-map-header">
        <div className="route-map-title-wrap">
          <h3 className="section-title">Route Map Preview</h3>
          <span className="badge-muted">
            {totalPointsCount} points total
          </span>
        </div>
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-badge legend-start">S</span> Start
          </span>
          <span className="legend-item">
            <span className="legend-badge legend-stop">1..N</span> Stops
          </span>
          <span className="legend-item">
            <span className="legend-badge legend-dest">D</span> Destination
          </span>
        </div>
      </div>

      <div className="route-map-wrapper">
        <MapContainer
          center={initialCenter}
          zoom={13}
          scrollWheelZoom={false}
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
            icon={createNumberedIcon('S', 'start')}
          >
            <Popup>
              <div className="map-popup-content">
                <strong>Start: {preview.startPoint.label}</strong>
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
                    Stop #{stop.order}: {stop.label}
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
              icon={createNumberedIcon('D', 'destination')}
            >
              <Popup>
                <div className="map-popup-content">
                  <strong>Destination: {preview.destinationPoint.label}</strong>
                  <p>{preview.destinationPoint.address}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Polyline */}
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
    </div>
  );
};
