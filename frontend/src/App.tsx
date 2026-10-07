import React, { useRef, useState } from 'react';
import './App.css';
import { Header } from './components/Header';
import { RouteFormSection } from './components/RouteFormSection';
import { ResultsSection } from './components/ResultsSection';
import { Toast } from './components/Toast';
import type { AddressInput, AlgorithmType, OptimizeRouteResponse, PlanningMode, RouteStop, SearchScope } from './types/route';
import { optimizeRoute } from './api/routeClient';

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_START: AddressInput = {
  label: 'Home',
  address: 'майдан Соборний, Житомир',
};

const DEFAULT_DESTINATION: AddressInput = {
  label: 'Office',
  address: 'вулиця Київська, Житомир',
};

const DEFAULT_STOPS: RouteStop[] = [
  {
    id: 'stop-1',
    label: 'Pharmacy',
    address: 'майдан Перемоги, Житомир',
    serviceMinutes: 15,
  },
  {
    id: 'stop-2',
    label: 'Supermarket',
    address: 'вулиця Покровська, Житомир',
    serviceMinutes: 20,
  },
];

export const App: React.FC = () => {
  // Form State
  const [start, setStart] = useState<AddressInput>(DEFAULT_START);
  const [destination, setDestination] = useState<AddressInput>(DEFAULT_DESTINATION);
  const [planningMode, setPlanningMode] = useState<PlanningMode>('depart-at');
  const [departureTime, setDepartureTime] = useState<string>(() => `${getTodayDateString()}T09:00`);
  const [arrivalBy, setArrivalBy] = useState<string>(() => `${getTodayDateString()}T14:00`);
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('two-opt');
  const [stops, setStops] = useState<RouteStop[]>(DEFAULT_STOPS);
  const [isDirectTrip, setIsDirectTrip] = useState<boolean>(false);
  const [searchScope, setSearchScope] = useState<SearchScope>('all-ukraine');
  const [selectedCity, setSelectedCity] = useState<string>('Житомир');

  const handlePlanningModeChange = (mode: PlanningMode) => {
    setPlanningMode(mode);
    if (mode === 'arrive-by') {
      const datePart = departureTime.split('T')[0] || getTodayDateString();
      const timePart = arrivalBy.split('T')[1] || '14:00';
      setArrivalBy(`${datePart}T${timePart}`);
    } else {
      const datePart = arrivalBy.split('T')[0] || getTodayDateString();
      const timePart = departureTime.split('T')[1] || '09:00';
      setDepartureTime(`${datePart}T${timePart}`);
    }
  };

  const handleDirectTripChange = (isDirect: boolean) => {
    setIsDirectTrip(isDirect);
    if (!isDirect && stops.length === 0) {
      setStops([
        {
          id: `stop-${crypto.randomUUID()}`,
          label: 'Stop 1',
          address: '',
          serviceMinutes: 15,
        },
      ]);
    }
  };

  // Request & Execution State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeRouteResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAddStop = () => {
    if (isDirectTrip) {
      setIsDirectTrip(false);
    }
    if (stops.length >= 10) return;
    const newStop: RouteStop = {
      id: `stop-${crypto.randomUUID()}`,
      label: `Stop ${stops.length + 1}`,
      address: '',
      serviceMinutes: 10,
    };
    setStops((prev) => [...prev, newStop]);
  };

  const handleRemoveStop = (id: string) => {
    setStops((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      if (updated.length === 0) {
        setIsDirectTrip(true);
      }
      return updated;
    });
  };

  const handleUpdateStop = (id: string, fields: Partial<RouteStop>) => {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...fields } : s))
    );
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
          departureTime: planningMode === 'depart-at' ? departureTime : undefined,
          arrivalBy: planningMode === 'arrive-by' ? arrivalBy : undefined,
          start,
          destination,
          stops: isDirectTrip ? [] : stops,
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
              isDirectTrip={isDirectTrip}
              onDirectTripChange={handleDirectTripChange}
              searchScope={searchScope}
              onSearchScopeChange={setSearchScope}
              selectedCity={selectedCity}
              onSelectedCityChange={setSelectedCity}
              planningMode={planningMode}
              onPlanningModeChange={handlePlanningModeChange}
              departureTime={departureTime}
              onDepartureTimeChange={setDepartureTime}
              arrivalBy={arrivalBy}
              onArrivalByChange={setArrivalBy}
              algorithm={algorithm}
              onAlgorithmChange={setAlgorithm}
              isLoading={isLoading}
              onOptimize={handleOptimize}
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
