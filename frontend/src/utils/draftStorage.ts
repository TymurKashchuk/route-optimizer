import type {
  AddressInput,
  AlgorithmType,
  PlanningMode,
  RouteStop,
  SearchScope,
} from '../types/route';

const DRAFT_STORAGE_KEY = 'routewise_trip_draft_v1';

export interface TripDraft {
  start: AddressInput;
  destination: AddressInput;
  stops: RouteStop[];
  isDirectTrip: boolean;
  planningMode: PlanningMode;
  departureTime: string;
  arrivalBy: string;
  algorithm: AlgorithmType;
  searchScope: SearchScope;
  selectedCity: string;
  lastSavedAt?: string;
}

/**
 * Safely loads the saved trip draft from localStorage.
 * Returns null if no draft exists, or if the stored data is corrupted/invalid.
 */
export function loadTripDraft(): TripDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    // Basic structural validation to ensure shape integrity
    if (!parsed.start || typeof parsed.start.address !== 'string') return null;
    if (!parsed.destination || typeof parsed.destination.address !== 'string') return null;
    if (!Array.isArray(parsed.stops)) return null;

    return parsed as TripDraft;
  } catch (err) {
    console.warn('[DraftStorage] Failed to read trip draft from localStorage:', err);
    return null;
  }
}

/**
 * Safely saves the trip draft into localStorage.
 */
export function saveTripDraft(draft: TripDraft): boolean {
  try {
    const payload: TripDraft = {
      ...draft,
      lastSavedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[DraftStorage] Failed to save trip draft into localStorage:', err);
    return false;
  }
}

/**
 * Clears the saved trip draft from localStorage.
 */
export function clearTripDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (err) {
    console.warn('[DraftStorage] Failed to clear trip draft from localStorage:', err);
  }
}
