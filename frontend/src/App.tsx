import React, { useRef, useState } from 'react';
import './App.css';
import { Header } from './components/Header';
import { RouteFormSection } from './components/RouteFormSection';
import { StopsSection } from './components/StopsSection';
import { ResultsSection } from './components/ResultsSection';
import { Toast } from './components/Toast';
import type { AddressInput, AlgorithmType, OptimizeRouteResponse, RouteStop } from './types/route';
import { optimizeRoute } from './api/routeClient';

const DEFAULT_START: AddressInput = {
  label: 'Central Depot',
  address: 'Zhytomyr Central Square',
};

const DEFAULT_DESTINATION: AddressInput = {
  label: 'Final Garage',
  address: 'Zhytomyr Central Square',
};

const DEFAULT_STOPS: RouteStop[] = [
  {
    id: 'stop-1',
    label: 'Railway Station',
    address: 'Zhytomyr Railway Station',
    serviceMinutes: 15,
  },
  {
    id: 'stop-2',
    label: 'City Hospital',
    address: 'Zhytomyr City Hospital',
    serviceMinutes: 20,
  },
];

export const App: React.FC = () => {
  // Form State
  const [start, setStart] = useState<AddressInput>(DEFAULT_START);
  const [destination, setDestination] = useState<AddressInput>(DEFAULT_DESTINATION);
  const [departureTime, setDepartureTime] = useState<string>('2026-09-28T09:00');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('two-opt');
  const [stops, setStops] = useState<RouteStop[]>(DEFAULT_STOPS);

  // Request & Execution State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeRouteResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleAddStop = () => {
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
    if (stops.length <= 1) return;
    setStops((prev) => prev.filter((s) => s.id !== id));
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
          departureTime,
          start,
          destination,
          stops,
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
              departureTime={departureTime}
              onDepartureTimeChange={setDepartureTime}
              algorithm={algorithm}
              onAlgorithmChange={setAlgorithm}
              isLoading={isLoading}
              onOptimize={handleOptimize}
            />
            <StopsSection
              stops={stops}
              isLoading={isLoading}
              onAddStop={handleAddStop}
              onRemoveStop={handleRemoveStop}
              onUpdateStop={handleUpdateStop}
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
