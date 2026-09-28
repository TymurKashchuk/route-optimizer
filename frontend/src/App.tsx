import React from 'react';
import './App.css';
import { Header } from './components/Header';
import { RouteFormSection } from './components/RouteFormSection';
import { StopsSection } from './components/StopsSection';
import { ResultsSection } from './components/ResultsSection';

export const App: React.FC = () => {
  return (
    <div className="app-root">
      <Header />
      <main className="main-container">
        <div className="planner-grid">
          <div className="left-column">
            <RouteFormSection />
            <StopsSection />
          </div>
          <div className="right-column">
            <ResultsSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
