import { describe, it, expect } from 'vitest';
import { buildGoogleMapsDirectionsUrl } from '../googleMaps';
import type { RoutePreviewDto } from '../../types/route';

describe('googleMaps utils', () => {
  it('returns null when preview or start point is missing', () => {
    expect(buildGoogleMapsDirectionsUrl(undefined)).toBeNull();
    expect(buildGoogleMapsDirectionsUrl({} as RoutePreviewDto)).toBeNull();
  });

  it('builds standard Google Maps directions URL for route with waypoints', () => {
    const preview: RoutePreviewDto = {
      startPoint: {
        id: 'start',
        label: 'Старт',
        address: 'вул. Хрещатик, 1',
        latitude: 50.4501,
        longitude: 30.5234,
        order: 0,
      },
      destinationPoint: {
        id: 'dest',
        label: 'Фініш',
        address: 'вул. Басейна, 2',
        latitude: 50.4411,
        longitude: 30.5211,
        order: 2,
      },
      orderedStops: [
        {
          id: 'stop-1',
          label: 'Зупинка 1',
          address: 'площа Льва Толстого, 3',
          latitude: 50.4392,
          longitude: 30.5173,
          order: 1,
        },
      ],
      geometryCoordinates: [],
    };

    const url = buildGoogleMapsDirectionsUrl(preview, 'driving');
    expect(url).not.toBeNull();
    expect(url).toContain('https://www.google.com/maps/dir/?api=1');
    expect(url).toContain('origin=50.4501%2C30.5234');
    expect(url).toContain('destination=50.4411%2C30.5211');
    expect(url).toContain('waypoints=50.4392%2C30.5173');
    expect(url).toContain('travelmode=driving');
  });

  it('maps cycling travel mode to bicycling for Google Maps', () => {
    const preview: RoutePreviewDto = {
      startPoint: {
        id: 'start',
        label: 'Старт',
        address: 'Київ',
        latitude: 50.45,
        longitude: 30.52,
        order: 0,
      },
      destinationPoint: {
        id: 'dest',
        label: 'Фініш',
        address: 'Львів',
        latitude: 49.84,
        longitude: 24.03,
        order: 1,
      },
      orderedStops: [],
      geometryCoordinates: [],
    };

    const url = buildGoogleMapsDirectionsUrl(preview, 'cycling');
    expect(url).toContain('travelmode=bicycling');
  });
});
