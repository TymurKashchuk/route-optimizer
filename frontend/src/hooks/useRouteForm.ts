import { useState } from 'react';
import type {
  AddressInput,
  AlgorithmType,
  PlanningMode,
  RouteStop,
  SearchScope,
  TravelMode,
} from '../types/route';
import type { ToastType } from '../components/Toast';
import { getInitialDraft, useTripDraft } from './useTripDraft';
import { getCurrentRoundedDateTimeString, getTodayDateString } from '../utils/dateTime';
import { deriveStopLabel } from '../utils/address';
import {
  createExampleRoute,
  DEFAULT_DESTINATION,
  DEFAULT_START,
  DEFAULT_STOPS,
  generateId,
  getRouteSignature,
  MAX_STOPS,
} from '../utils/routeHelpers';

export interface UseRouteFormOptions {
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
  onResetResult?: () => void;
}

const initialDraftValues = getInitialDraft();

export function useRouteForm({ showToast, clearToast, onResetResult }: UseRouteFormOptions) {
  const [start, setStart] = useState<AddressInput>(initialDraftValues.initialStart);
  const [destination, setDestination] = useState<AddressInput>(initialDraftValues.initialDestination);
  const [planningMode, setPlanningMode] = useState<PlanningMode>(initialDraftValues.initialPlanningMode);
  const [travelMode, setTravelMode] = useState<TravelMode>(initialDraftValues.initialTravelMode);
  const [departureTime, setDepartureTime] = useState<string>(initialDraftValues.initialDepartureTime);
  const [arrivalBy, setArrivalBy] = useState<string>(initialDraftValues.initialArrivalBy);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(initialDraftValues.initialAlgorithm);
  const [stops, setStops] = useState<RouteStop[]>(initialDraftValues.initialStops);
  const [searchScope, setSearchScope] = useState<SearchScope>(initialDraftValues.initialSearchScope);
  const [selectedCity, setSelectedCity] = useState<string>(initialDraftValues.initialSelectedCity);

  const { isDraftSaved, resetDraft } = useTripDraft({
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
  });

  const currentRouteSignature = getRouteSignature({
    start,
    destination,
    stops,
    planningMode,
    travelMode,
    departureTime,
    arrivalBy,
    algorithm,
  });

  const handlePlanningModeChange = (mode: PlanningMode) => {
    setPlanningMode(mode);
    const todayStr = getTodayDateString();
    if (mode === 'arrive-by') {
      let datePart = departureTime.split('T')[0] || todayStr;
      if (datePart < todayStr) datePart = todayStr;
      const timePart = arrivalBy.split('T')[1] || '14:00';
      setArrivalBy(`${datePart}T${timePart}`);
    } else {
      let datePart = arrivalBy.split('T')[0] || todayStr;
      if (datePart < todayStr) datePart = todayStr;
      const timePart = departureTime.split('T')[1] || '09:00';
      setDepartureTime(`${datePart}T${timePart}`);
    }
  };

  const handleAddStop = () => {
    if (stops.length >= MAX_STOPS) {
      showToast('Досягнуто ліміт: максимум 10 зупинок для одного маршруту.', 'error');
      return;
    }
    const newStop: RouteStop = {
      id: `stop-${generateId()}`,
      label: `Зупинка ${stops.length + 1}`,
      address: '',
      serviceMinutes: 15,
    };
    setStops((prev) => [...prev, newStop]);
  };

  const handleRemoveStop = (id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateStop = (id: string, fields: Partial<RouteStop>) => {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...fields } : s))
    );
  };

  const handleReorderStops = (reorderedStops: RouteStop[]) => {
    setStops(reorderedStops);
  };

  const handleSetStartFromMap = (address: string, lat?: number, lng?: number) => {
    const label = deriveStopLabel(address, 'Старт');
    setStart({
      label,
      address,
      latitude: lat,
      longitude: lng,
    });
    showToast(`Початок маршруту встановлено: ${label}`, 'info');
  };

  const handleSetDestinationFromMap = (address: string, lat?: number, lng?: number) => {
    const label = deriveStopLabel(address, 'Фініш');
    setDestination({
      label,
      address,
      latitude: lat,
      longitude: lng,
    });
    showToast(`Фініш маршруту встановлено: ${label}`, 'info');
  };

  const handleAddStopFromMap = (address: string, lat?: number, lng?: number) => {
    if (stops.length >= MAX_STOPS) {
      showToast('Досягнуто ліміт: максимум 10 зупинок для одного маршруту.', 'error');
      return;
    }
    const label = deriveStopLabel(address, `Зупинка ${stops.length + 1}`);
    const newStop: RouteStop = {
      id: `stop-${generateId()}`,
      label,
      address,
      latitude: lat,
      longitude: lng,
      serviceMinutes: 15,
    };
    setStops((prev) => [...prev, newStop]);
    showToast(`Додано зупинку: ${label}`, 'info');
  };

  const handleTryExample = () => {
    const example = createExampleRoute();
    setStart(example.start);
    setStops(example.stops);
    setDestination(example.destination);
    setTravelMode('driving');
    setPlanningMode('depart-at');
    setDepartureTime(getCurrentRoundedDateTimeString());
    setAlgorithm('two-opt');
    setSearchScope('all-ukraine');
    clearToast();
  };

  const handleResetDraft = () => {
    resetDraft(() => {
      setStart(DEFAULT_START);
      setDestination(DEFAULT_DESTINATION);
      setStops(DEFAULT_STOPS);
      setPlanningMode('depart-at');
      setTravelMode('driving');
      setDepartureTime(getCurrentRoundedDateTimeString());
      setArrivalBy(`${getTodayDateString()}T14:00`);
      setAlgorithm('two-opt');
      setSearchScope('all-ukraine');
      setSelectedCity('Житомир');
      onResetResult?.();
      clearToast();
    });
  };

  return {
    start,
    setStart,
    destination,
    setDestination,
    stops,
    planningMode,
    travelMode,
    setTravelMode,
    departureTime,
    setDepartureTime,
    arrivalBy,
    setArrivalBy,
    algorithm,
    setAlgorithm,
    searchScope,
    setSearchScope,
    selectedCity,
    setSelectedCity,
    isDraftSaved,
    currentRouteSignature,
    handlePlanningModeChange,
    handleAddStop,
    handleRemoveStop,
    handleUpdateStop,
    handleReorderStops,
    handleSetStartFromMap,
    handleSetDestinationFromMap,
    handleAddStopFromMap,
    handleTryExample,
    handleResetDraft,
  };
}
