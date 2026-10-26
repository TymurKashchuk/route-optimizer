import { useState, useEffect, useRef } from 'react';
import type {
  AddressInput,
  AlgorithmType,
  PlanningMode,
  RouteStop,
  SearchScope,
  TravelMode,
} from '../types/route';
import { loadTripDraft, saveTripDraft, clearTripDraft } from '../utils/draftStorage';
import { getCurrentRoundedTimeString, getTodayDateString } from '../utils/dateTime';

export function sanitizeDraftDate(dateTimeStr?: string, defaultHour?: string): string {
  const todayStr = getTodayDateString();
  const fallbackHour = defaultHour || getCurrentRoundedTimeString();
  if (!dateTimeStr) return `${todayStr}T${fallbackHour}`;
  const [date, time] = dateTimeStr.split('T');
  const safeTime = time || fallbackHour;
  if (!date || date < todayStr) {
    return `${todayStr}T${safeTime}`;
  }
  return `${date}T${safeTime}`;
}

export function getInitialDraft() {
  const draft = loadTripDraft();
  return {
    initialStart: draft?.start ?? { label: 'Старт', address: '' },
    initialDestination: draft?.destination ?? { label: 'Фініш', address: '' },
    initialStops: draft?.stops ?? [],
    initialPlanningMode: draft?.planningMode ?? 'depart-at',
    initialTravelMode: draft?.travelMode ?? 'driving',
    initialDepartureTime: sanitizeDraftDate(draft?.departureTime),
    initialArrivalBy: sanitizeDraftDate(draft?.arrivalBy, '14:00'),
    initialAlgorithm: draft?.algorithm ?? 'two-opt',
    initialSearchScope: draft?.searchScope ?? 'all-ukraine',
    initialSelectedCity: draft?.selectedCity ?? 'Житомир',
    hasSavedDraft: Boolean(draft),
  };
}

export interface UseTripDraftState {
  start: AddressInput;
  destination: AddressInput;
  stops: RouteStop[];
  planningMode: PlanningMode;
  travelMode: TravelMode;
  departureTime: string;
  arrivalBy: string;
  algorithm: AlgorithmType;
  searchScope: SearchScope;
  selectedCity: string;
}

export function useTripDraft(formState: UseTripDraftState) {
  const [isDraftSaved, setIsDraftSaved] = useState<boolean>(() => Boolean(loadTripDraft()));
  const isInitialMount = useRef(true);

  const {
    start,
    destination,
    stops,
    planningMode,
    travelMode,
    departureTime,
    arrivalBy,
    algorithm,
    searchScope,
    selectedCity,
  } = formState;

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveTripDraft({
        start,
        destination,
        stops,
        isDirectTrip: stops.length === 0,
        planningMode,
        travelMode,
        departureTime,
        arrivalBy,
        algorithm,
        searchScope,
        selectedCity,
      });
      setIsDraftSaved(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [
    start,
    destination,
    stops,
    planningMode,
    travelMode,
    departureTime,
    arrivalBy,
    algorithm,
    searchScope,
    selectedCity,
  ]);

  const resetDraft = (onResetState: () => void) => {
    clearTripDraft();
    setIsDraftSaved(false);
    onResetState();
  };

  return {
    isDraftSaved,
    resetDraft,
  };
}
