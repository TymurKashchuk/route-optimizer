import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadTripDraft,
  saveTripDraft,
  clearTripDraft,
  type TripDraft,
} from '../draftStorage';

const mockDraft: TripDraft = {
  start: { label: 'Старт', address: 'вул. Хрещатик, 1' },
  destination: { label: 'Фініш', address: 'вул. Басейна, 2' },
  stops: [
    {
      id: 'stop-1',
      label: 'Зупинка 1',
      address: 'площа Льва Толстого, 3',
      serviceMinutes: 15,
    },
  ],
  isDirectTrip: false,
  planningMode: 'depart-at',
  travelMode: 'driving',
  departureTime: '2026-10-26T09:00',
  arrivalBy: '2026-10-26T14:00',
  algorithm: 'two-opt',
  searchScope: 'city',
  selectedCity: 'Київ',
};

describe('draftStorage utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no draft exists', () => {
    expect(loadTripDraft()).toBeNull();
  });

  it('saves and loads a valid trip draft', () => {
    const saved = saveTripDraft(mockDraft);
    expect(saved).toBe(true);

    const loaded = loadTripDraft();
    expect(loaded).not.toBeNull();
    expect(loaded?.start.address).toBe('вул. Хрещатик, 1');
    expect(loaded?.destination.address).toBe('вул. Басейна, 2');
    expect(loaded?.stops).toHaveLength(1);
    expect(loaded?.selectedCity).toBe('Київ');
    expect(loaded?.lastSavedAt).toBeDefined();
  });

  it('clears saved trip draft', () => {
    saveTripDraft(mockDraft);
    expect(loadTripDraft()).not.toBeNull();

    clearTripDraft();
    expect(loadTripDraft()).toBeNull();
  });

  it('returns null and handles invalid JSON gracefully', () => {
    localStorage.setItem('routewise_trip_draft_v1', 'invalid-json{{{');
    expect(loadTripDraft()).toBeNull();
  });

  it('returns null when essential fields are missing', () => {
    localStorage.setItem(
      'routewise_trip_draft_v1',
      JSON.stringify({ someOtherField: true })
    );
    expect(loadTripDraft()).toBeNull();
  });
});
