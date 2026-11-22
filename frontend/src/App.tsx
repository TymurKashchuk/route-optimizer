import React, { useRef, useState } from 'react';
import './App.css';
import { Header } from './components/Header';
import { RouteFormSection } from './components/RouteFormSection';
import { ResultsSection } from './components/ResultsSection';
import { Toast } from './components/Toast';
import type { OptimizeRouteResponse } from './types/route';
import { optimizeRoute } from './api/routeClient';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { useRouteForm } from './hooks/useRouteForm';
import { deriveStopLabel, isDefaultOrDerivedLabel } from './utils/address';

export type { ThemeMode } from './hooks/useTheme';

export const App: React.FC = () => {
  const { theme, toggleTheme: handleToggleTheme } = useTheme();
  const { toast, showToast, clearToast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizeRouteResponse | null>(null);
  const [lastOptimizedSignature, setLastOptimizedSignature] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const {
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
  } = useRouteForm({
    showToast,
    clearToast,
    onResetResult: () => {
      setResult(null);
      setLastOptimizedSignature(null);
    },
  });

  const isStale = Boolean(
    result && lastOptimizedSignature && lastOptimizedSignature !== currentRouteSignature
  );

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
