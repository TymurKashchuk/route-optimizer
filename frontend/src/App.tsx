import React, { useState } from 'react';
import './App.css';
import { Header } from './components/Header';
import { RouteFormSection } from './components/RouteFormSection';
import { StopsSection } from './components/StopsSection';
import { ResultsSection } from './components/ResultsSection';
import type { AddressInput, AlgorithmType, OptimizeRouteResponse, RouteStop } from './types/route';

const DEFAULT_START: AddressInput = {
  label: 'Start Depot',
  address: 'Khreshchatyk 1, Kyiv',
};

const DEFAULT_STOPS: RouteStop[] = [
  {
    id: 'stop-1',
    label: 'Client A',
    address: 'Bohdana Khmelnytskoho 10, Kyiv',
    serviceMinutes: 15,
  },
  {
    id: 'stop-2',
    label: 'Client B',
    address: 'Volodymyrska 24, Kyiv',
    serviceMinutes: 20,
  },
];

export const App: React.FC = () => {
  // Form State
  const [start, setStart] = useState<AddressInput>(DEFAULT_START);
  const [departureTime, setDepartureTime] = useState<string>('2026-09-28T09:00');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('two-opt');
  const [stops, setStops] = useState<RouteStop[]>(DEFAULT_STOPS);

  // Request & Execution State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizeRouteResponse | null>(null);

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

  const handleOptimize = () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Simulated response until backend integration
    setTimeout(() => {
      setIsLoading(false);
      console.log('Optimize request payload:', {
        algorithm,
        departureTime,
        start,
        stops,
      });
    }, 600);
  };

  return (
    <div className="app-root">
      <Header />
      <main className="main-container">
        <div className="planner-grid">
          <div className="left-column">
            <RouteFormSection
              start={start}
              onStartChange={setStart}
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
            <ResultsSection result={result} isLoading={isLoading} error={error} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
