import { describe, it, expect } from 'vitest';
import {
  createExampleRoute,
  DEFAULT_DESTINATION,
  DEFAULT_START,
  DEFAULT_STOPS,
  generateId,
  getRouteSignature,
  MAX_STOPS,
  type RouteSignatureParams,
} from '../routeHelpers';

const baseParams: RouteSignatureParams = {
  start: { label: 'Старт', address: ' Житомир ', latitude: 50.25, longitude: 28.65 },
  destination: { label: 'Фініш', address: ' Київ ', latitude: 50.45, longitude: 30.52 },
  stops: [
    { id: 's1', label: 'Зупинка 1', address: ' Брусилів ', serviceMinutes: 15, latitude: 50.28, longitude: 29.53 },
  ],
  planningMode: 'depart-at',
  travelMode: 'driving',
  departureTime: '2026-11-22T09:00',
  arrivalBy: '2026-11-22T14:00',
  algorithm: 'two-opt',
};

describe('routeHelpers', () => {
  it('exposes expected defaults and MAX_STOPS', () => {
    expect(MAX_STOPS).toBe(10);
    expect(DEFAULT_START).toEqual({ label: 'Старт', address: '' });
    expect(DEFAULT_DESTINATION).toEqual({ label: 'Фініш', address: '' });
    expect(DEFAULT_STOPS).toEqual([]);
  });

  it('generateId returns non-empty unique strings', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1.length).toBeGreaterThan(0);
    expect(id1).not.toBe(id2);
  });

  it('getRouteSignature trims addresses and uses active planningMode time', () => {
    const sigDepart = getRouteSignature(baseParams);
    const sigDifferentLabel = getRouteSignature({
      ...baseParams,
      start: { ...baseParams.start, label: 'Інша назва', address: 'Житомир' },
    });
    expect(sigDepart).toBe(sigDifferentLabel);

    const sigArriveBy = getRouteSignature({
      ...baseParams,
      planningMode: 'arrive-by',
    });
    expect(sigArriveBy).not.toBe(sigDepart);
  });

  it('createExampleRoute returns start, 2 stops with unique ids, and destination', () => {
    const example = createExampleRoute();
    expect(example.start.address).toContain('Житомир');
    expect(example.destination.address).toContain('Київ');
    expect(example.stops).toHaveLength(2);
    expect(example.stops[0].id).not.toBe(example.stops[1].id);
  });
});
