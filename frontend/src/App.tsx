import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { Header } from './components/Header';
import { RouteFormSection } from './components/RouteFormSection';
import { ResultsSection } from './components/ResultsSection';
import { Toast, type ToastType } from './components/Toast';
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

function getRouteSignature(params: {
  start: AddressInput;
  destination: AddressInput;
  stops: RouteStop[];
  planningMode: PlanningMode;
  travelMode: TravelMode;
  departureTime: string;
  arrivalBy: string;
  algorithm: AlgorithmType;
}): string {
  return JSON.stringify({
    s: { a: params.start.address.trim(), lat: params.start.latitude, lng: params.start.longitude },
    d: { a: params.destination.address.trim(), lat: params.destination.latitude, lng: params.destination.longitude },
    stops: params.stops.map((s) => ({
      a: s.address.trim(),
      lat: s.latitude,
      lng: s.longitude,
      m: s.serviceMinutes,
    })),
    pm: params.planningMode,
    tm: params.travelMode,
    t: params.planningMode === 'arrive-by' ? params.arrivalBy : params.departureTime,
    alg: params.algorithm,
  });
}

export type ThemeMode = 'light' | 'dark';

function getInitialTheme(): ThemeMode {
  if (typeof window !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme') as ThemeMode | null;
    if (attr === 'light' || attr === 'dark') {
      return attr;
    }
    const saved = localStorage.getItem('routewise_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
}

export const App: React.FC = () => {
  // Theme State
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0F172A' : '#EEF1F4');
    }
    try {
      localStorage.setItem('routewise_theme', theme);
    } catch {
      // LocalStorage might be disabled in some environments
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

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
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
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
    if (stops.length >= 10) {
      setToast({
        message: 'Досягнуто ліміт: максимум 10 зупинок для одного маршруту.',
        type: 'error',
      });
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
    setToast({
      message: `Початок маршруту встановлено: ${label}`,
      type: 'info',
    });
  };

  const handleSetDestinationFromMap = (address: string, lat?: number, lng?: number) => {
    const label = deriveStopLabel(address, 'Фініш');
    setDestination({
      label,
      address,
      latitude: lat,
      longitude: lng,
    });
    setToast({
      message: `Фініш маршруту встановлено: ${label}`,
      type: 'info',
    });
  };

  const handleAddStopFromMap = (address: string, lat?: number, lng?: number) => {
    if (stops.length >= 10) {
      setToast({
        message: 'Досягнуто ліміт: максимум 10 зупинок для одного маршруту.',
        type: 'error',
      });
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
    setToast({
      message: `Додано зупинку: ${label}`,
      type: 'info',
    });
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

  const handleTryExample = () => {
    setStart({
      label: 'Житомир, майдан Корольова',
      address: 'Житомир, майдан Корольова',
      latitude: 50.2547,
      longitude: 28.6587,
    });
    setStops([
      {
        id: `stop-${generateId()}`,
        label: 'Брусилів, АЗС',
        address: 'Брусилів, АЗС',
        serviceMinutes: 15,
        latitude: 50.2882,
        longitude: 29.5312,
      },
      {
        id: `stop-${generateId()}`,
        label: 'Фастів, вокзал',
        address: 'Фастів, вокзал',
        serviceMinutes: 20,
        latitude: 50.0789,
        longitude: 29.9168,
      },
    ]);
    setDestination({
      label: 'Київ, Хрещатик',
      address: 'Київ, Хрещатик',
      latitude: 50.4501,
      longitude: 30.5234,
    });
    setTravelMode('driving');
    setPlanningMode('depart-at');
    setDepartureTime(`${getTodayDateString()}T09:00`);
    setAlgorithm('two-opt');
    setSearchScope('all-ukraine');
    setToast(null);
  };

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
    setLastOptimizedSignature(null);
    setToast(null);
    setIsDraftSaved(false);
  };

  const handleOptimize = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setToast(null);

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
            label: (start.label && start.label.trim().length >= 3)
              ? start.label.trim()
              : deriveStopLabel(start.address, 'Старт'),
          },
          destination: {
            ...destination,
            label: (destination.label && destination.label.trim().length >= 3)
              ? destination.label.trim()
              : deriveStopLabel(destination.address, 'Фініш'),
          },
          stops: stops.map((s, idx) => ({
            ...s,
            label: (s.label && s.label.trim().length >= 3)
              ? s.label.trim()
              : deriveStopLabel(s.address, `Зупинка ${idx + 1}`),
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
        setToast({ message: err.message, type: 'error' });
      } else {
        setToast({
          message: 'Під час розрахунку маршруту сталася неочікувана помилка.',
          type: 'error',
        });
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
        onClose={() => setToast(null)}
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
