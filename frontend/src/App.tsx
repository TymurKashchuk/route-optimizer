import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { Header } from './components/Header';
import { RouteFormSection } from './components/RouteFormSection';
import { ResultsSection } from './components/ResultsSection';
import { Toast } from './components/Toast';
import type { AddressInput, AlgorithmType, OptimizeRouteResponse, PlanningMode, RouteStop, SearchScope, TravelMode } from './types/route';
import { optimizeRoute } from './api/routeClient';
import { clearTripDraft, loadTripDraft, saveTripDraft } from './utils/draftStorage';
import { getTodayDateString } from './utils/dateTime';
import { deriveStopLabel } from './utils/address';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

const DEFAULT_START: AddressInput = {
  label: 'Старт',
  address: '',
};

const DEFAULT_DESTINATION: AddressInput = {
  label: 'Фініш',
  address: '',
};

const DEFAULT_STOPS: RouteStop[] = [];

// Load saved trip draft once on module evaluation
const initialDraft = loadTripDraft();

function sanitizeDraftDate(dateTimeStr?: string, defaultHour = '09:00'): string {
  const todayStr = getTodayDateString();
  if (!dateTimeStr) return `${todayStr}T${defaultHour}`;
  const [date, time] = dateTimeStr.split('T');
  const safeTime = time || defaultHour;
  if (!date || date < todayStr) {
    return `${todayStr}T${safeTime}`;
  }
  return `${date}T${safeTime}`;
}

export const App: React.FC = () => {
  // Form State
  const [start, setStart] = useState<AddressInput>(() => initialDraft?.start ?? DEFAULT_START);
  const [destination, setDestination] = useState<AddressInput>(() => initialDraft?.destination ?? DEFAULT_DESTINATION);
  const [planningMode, setPlanningMode] = useState<PlanningMode>(() => initialDraft?.planningMode ?? 'depart-at');
  const [travelMode, setTravelMode] = useState<TravelMode>(() => initialDraft?.travelMode ?? 'driving');
  const [departureTime, setDepartureTime] = useState<string>(() => sanitizeDraftDate(initialDraft?.departureTime, '09:00'));
  const [arrivalBy, setArrivalBy] = useState<string>(() => sanitizeDraftDate(initialDraft?.arrivalBy, '14:00'));
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(() => initialDraft?.algorithm ?? 'two-opt');
  const [stops, setStops] = useState<RouteStop[]>(() => initialDraft?.stops ?? DEFAULT_STOPS);
  const isDirectTrip = stops.length === 0;
  const [searchScope, setSearchScope] = useState<SearchScope>(() => initialDraft?.searchScope ?? 'all-ukraine');
  const [selectedCity, setSelectedCity] = useState<string>(() => initialDraft?.selectedCity ?? 'Житомир');
  const [isDraftSaved, setIsDraftSaved] = useState<boolean>(Boolean(initialDraft));

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

  // Request & Execution State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeRouteResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAddStop = () => {
    if (stops.length >= 10) return;
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

  // Autosave draft on form changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      saveTripDraft({
        start,
        destination,
        stops,
        isDirectTrip,
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
    isDirectTrip,
    planningMode,
    travelMode,
    departureTime,
    arrivalBy,
    algorithm,
    searchScope,
    selectedCity,
  ]);

  const handleResetDraft = () => {
    clearTripDraft();
    setStart(DEFAULT_START);
    setDestination(DEFAULT_DESTINATION);
    setStops(DEFAULT_STOPS);
    setPlanningMode('depart-at');
    setTravelMode('driving');
    setDepartureTime(`${getTodayDateString()}T09:00`);
    setArrivalBy(`${getTodayDateString()}T14:00`);
    setAlgorithm('two-opt');
    setSearchScope('all-ukraine');
    setSelectedCity('Житомир');
    setResult(null);
    setError(null);
    setIsDraftSaved(false);
  };

  const handleOptimize = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await optimizeRoute(
        {
          algorithm,
          planningMode,
          travelMode,
          departureTime: planningMode === 'depart-at' ? departureTime : undefined,
          arrivalBy: planningMode === 'arrive-by' ? arrivalBy : undefined,
          start: {
            ...start,
            label: start.label?.trim() || deriveStopLabel(start.address, 'Старт'),
          },
          destination: {
            ...destination,
            label: destination.label?.trim() || deriveStopLabel(destination.address, 'Фініш'),
          },
          stops: stops.map((s, idx) => ({
            ...s,
            label: s.label?.trim() || deriveStopLabel(s.address, `Зупинка ${idx + 1}`),
          })),
        },
        controller.signal
      );
      setResult(data);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while calculating the route.');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="app-root">
      <Toast message={error} onClose={() => setError(null)} />
      <Header />
      <main className="main-container">
        <div className="planner-grid">
          <div className="left-column">
            <RouteFormSection
              start={start}
              onStartChange={setStart}
              destination={destination}
              onDestinationChange={setDestination}
              stops={stops}
              onAddStop={handleAddStop}
              onRemoveStop={handleRemoveStop}
              onUpdateStop={handleUpdateStop}
              searchScope={searchScope}
              onSearchScopeChange={setSearchScope}
              selectedCity={selectedCity}
              onSelectedCityChange={setSelectedCity}
              planningMode={planningMode}
              onPlanningModeChange={handlePlanningModeChange}
              travelMode={travelMode}
              onTravelModeChange={setTravelMode}
              departureTime={departureTime}
              onDepartureTimeChange={setDepartureTime}
              arrivalBy={arrivalBy}
              onArrivalByChange={setArrivalBy}
              algorithm={algorithm}
              onAlgorithmChange={setAlgorithm}
              isLoading={isLoading}
              onOptimize={handleOptimize}
              isDraftSaved={isDraftSaved}
              onResetDraft={handleResetDraft}
            />
          </div>
          <div className="right-column">
            <ResultsSection result={result} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
