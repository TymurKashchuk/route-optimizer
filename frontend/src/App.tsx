import React, { useRef, useState } from 'react';
import './App.css';
import { Header } from './components/Header';
import { RouteFormSection } from './components/RouteFormSection';
import { ResultsSection } from './components/ResultsSection';
import { Toast } from './components/Toast';
import type { AddressInput, AlgorithmType, OptimizeRouteResponse, PlanningMode, RouteStop, SearchScope, TravelMode } from './types/route';
import { optimizeRoute } from './api/routeClient';
import { getInitialDraft, useTripDraft } from './hooks/useTripDraft';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { getCurrentRoundedDateTimeString, getTodayDateString } from './utils/dateTime';
import { deriveStopLabel, isDefaultOrDerivedLabel } from './utils/address';
import {
  createExampleRoute,
  DEFAULT_DESTINATION,
  DEFAULT_START,
  DEFAULT_STOPS,
  generateId,
  getRouteSignature,
  MAX_STOPS,
} from './utils/routeHelpers';

const initialDraftValues = getInitialDraft();

export type { ThemeMode } from './hooks/useTheme';

export const App: React.FC = () => {
  const { theme, toggleTheme: handleToggleTheme } = useTheme();
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast, showToast, clearToast } = useToast();
  const [result, setResult] = useState<OptimizeRouteResponse | null>(null);
  const [lastOptimizedSignature, setLastOptimizedSignature] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

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

  const isStale = Boolean(
    result && lastOptimizedSignature && lastOptimizedSignature !== currentRouteSignature
  );

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
      setResult(null);
      setLastOptimizedSignature(null);
      clearToast();
    });
  };

  const handleOptimize = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    clearToast();

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
            label: isDefaultOrDerivedLabel(start.label, start.address, 'Старт')
              ? deriveStopLabel(start.address, 'Старт')
              : start.label.trim(),
          },
          destination: {
            ...destination,
            label: isDefaultOrDerivedLabel(destination.label, destination.address, 'Фініш')
              ? deriveStopLabel(destination.address, 'Фініш')
              : destination.label.trim(),
          },
          stops: stops.map((s, idx) => ({
            ...s,
            label: isDefaultOrDerivedLabel(s.label, s.address, `Зупинка ${idx + 1}`)
              ? deriveStopLabel(s.address, `Зупинка ${idx + 1}`)
              : s.label.trim(),
          })),
        },
        controller.signal
      );
      setResult(data);
      setLastOptimizedSignature(currentRouteSignature);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      if (err instanceof Error) {
        showToast(err.message, 'error');
      } else {
        showToast('Під час розрахунку маршруту сталася неочікувана помилка.', 'error');
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="app-root">
      <Toast
        message={toast?.message ?? null}
        type={toast?.type ?? 'error'}
        onClose={clearToast}
      />
      <Header theme={theme} onToggleTheme={handleToggleTheme} />
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
              onReorderStops={handleReorderStops}
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
              isStale={isStale}
            />
          </div>
          <div className="right-column">
            <ResultsSection
              result={result}
              isLoading={isLoading}
              theme={theme}
              start={start}
              destination={destination}
              stops={stops}
              onSetStartFromMap={handleSetStartFromMap}
              onAddStopFromMap={handleAddStopFromMap}
              onSetDestinationFromMap={handleSetDestinationFromMap}
              onTryExample={handleTryExample}
              isStale={isStale}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
