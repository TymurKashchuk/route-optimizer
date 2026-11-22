import React from 'react';
import './App.css';
import { Header } from './components/Header';
import { RouteFormSection } from './components/RouteFormSection';
import { ResultsSection } from './components/ResultsSection';
import { Toast } from './components/Toast';
import { useTheme } from './hooks/useTheme';
import { useToast } from './hooks/useToast';
import { useRouteForm } from './hooks/useRouteForm';
import { useRouteOptimization } from './hooks/useRouteOptimization';

export type { ThemeMode } from './hooks/useTheme';

export const App: React.FC = () => {
  const { theme, toggleTheme: handleToggleTheme } = useTheme();
  const { toast, showToast, clearToast } = useToast();
  const {
    isLoading,
    result,
    lastOptimizedSignature,
    optimize,
    resetResult,
  } = useRouteOptimization({ showToast, clearToast });

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
    onResetResult: resetResult,
  });

  const isStale = Boolean(
    result && lastOptimizedSignature && lastOptimizedSignature !== currentRouteSignature
  );

  const handleOptimize = () =>
    optimize({
      algorithm,
      planningMode,
      travelMode,
      departureTime,
      arrivalBy,
      start,
      destination,
      stops,
      signature: currentRouteSignature,
    });

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
