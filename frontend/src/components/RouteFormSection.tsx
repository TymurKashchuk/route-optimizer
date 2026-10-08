import React, { useState } from 'react';
import type { AddressInput, AlgorithmType, PlanningMode, RouteStop, SearchScope } from '../types/route';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { StopsSection } from './StopsSection';
import { reverseGeocode } from '../api/geocodingClient';

const POPULAR_CITIES = [
  'Житомир',
  'Київ',
  'Львів',
  'Вінниця',
  'Дніпро',
  'Одеса',
  'Харків',
  'Полтава',
  'Черкаси',
  'Чернігів',
  'Івано-Франківськ',
  'Тернопіль',
  'Рівне',
  'Луцьк',
  'Хмельницький',
  'Запоріжжя',
  'Миколаїв',
  'Ужгород',
  'Чернівці',
  'Кропивницький',
];

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface RouteFormSectionProps {
  start: AddressInput;
  onStartChange: (start: AddressInput) => void;
  destination: AddressInput;
  onDestinationChange: (destination: AddressInput) => void;
  stops: RouteStop[];
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onUpdateStop: (id: string, fields: Partial<RouteStop>) => void;
  isDirectTrip: boolean;
  onDirectTripChange: (isDirect: boolean) => void;
  searchScope: SearchScope;
  onSearchScopeChange: (scope: SearchScope) => void;
  selectedCity: string;
  onSelectedCityChange: (city: string) => void;
  planningMode: PlanningMode;
  onPlanningModeChange: (mode: PlanningMode) => void;
  departureTime: string;
  onDepartureTimeChange: (time: string) => void;
  arrivalBy: string;
  onArrivalByChange: (time: string) => void;
  algorithm: AlgorithmType;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  isLoading: boolean;
  onOptimize: () => void;
}

export const RouteFormSection: React.FC<RouteFormSectionProps> = ({
  start,
  onStartChange,
  destination,
  onDestinationChange,
  stops,
  onAddStop,
  onRemoveStop,
  onUpdateStop,
  isDirectTrip,
  onDirectTripChange,
  searchScope,
  onSearchScopeChange,
  selectedCity,
  onSelectedCityChange,
  planningMode,
  onPlanningModeChange,
  departureTime,
  onDepartureTimeChange,
  arrivalBy,
  onArrivalByChange,
  algorithm,
  onAlgorithmChange,
  isLoading,
  onOptimize,
}) => {
  const isArriveBy = planningMode === 'arrive-by';
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCustomCity, setIsCustomCity] = useState<boolean>(() => !POPULAR_CITIES.includes(selectedCity));

  const activeCity = searchScope === 'city' ? selectedCity.trim() : undefined;

  // Parse Date and Time parts
  const activeDateTime = isArriveBy ? arrivalBy : departureTime;
  const datePart = activeDateTime.split('T')[0] || getTodayDateString();
  const timePart = activeDateTime.split('T')[1] || (isArriveBy ? '14:00' : '09:00');

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  const handleDateChange = (newDate: string) => {
    const combined = `${newDate}T${timePart}`;
    if (isArriveBy) {
      onArrivalByChange(combined);
    } else {
      onDepartureTimeChange(combined);
    }
  };

  const handleTimeChange = (newTime: string) => {
    const combined = `${datePart}T${newTime}`;
    if (isArriveBy) {
      onArrivalByChange(combined);
    } else {
      onDepartureTimeChange(combined);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Геолокація не підтримується вашим браузером.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const result = await reverseGeocode(latitude, longitude);
          onStartChange({
            label: 'Моє місцезнаходження',
            address: result.address,
            latitude,
            longitude,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Не вдалося визначити адресу за координатами.';
          setLocationError(message);
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setIsLocating(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setLocationError('Доступ до геопозиції відхилено у налаштуваннях браузера.');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setLocationError('GPS-дані наразі недоступні.');
            break;
          case geoError.TIMEOUT:
            setLocationError('Час очікування відповіді GPS вичерпано.');
            break;
          default:
            setLocationError('Не вдалося визначити поточну геопозицію.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleEnableStopsMode = () => {
    onDirectTripChange(false);
    if (stops.length === 0) {
      onAddStop();
    }
  };

  return (
    <section className="card trip-planner-card" aria-labelledby="trip-planner-title">
      <div className="trip-planner-header">
        <div>
          <h2 id="trip-planner-title" className="section-title">
            Маршрут подорожі
          </h2>
          <p className="section-subtitle">
            {isDirectTrip
              ? 'Пряма поїздка від точки старту до фінішу'
              : `Поїздка із ${stops.length} ${stops.length === 1 ? 'проміжною зупинкою' : 'проміжними зупинками'}`}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="trip-mode-tabs" role="tablist" aria-label="Тип поїздки">
          <button
            type="button"
            role="tab"
            aria-selected={isDirectTrip}
            className={`trip-mode-tab ${isDirectTrip ? 'active' : ''}`}
            onClick={() => onDirectTripChange(true)}
            disabled={isLoading}
          >
            <span>Пряма (А → Б)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isDirectTrip}
            className={`trip-mode-tab ${!isDirectTrip ? 'active' : ''}`}
            onClick={() => onDirectTripChange(false)}
            disabled={isLoading}
          >
            <span>Із зупинками</span>
            {stops.length > 0 && <span className="tab-count-badge">{stops.length}</span>}
          </button>
        </div>
      </div>

      {/* SEARCH SCOPE SELECTOR */}
      <div className="search-scope-panel">
        <div className="search-scope-header">
          <div className="search-scope-title-wrap">
            <span className="search-scope-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Область пошуку</span>
            </span>
            <span className="search-scope-hint">
              {searchScope === 'all-ukraine'
                ? 'Пошук по всій Україні (міжміські маршрути)'
                : `Пошук обмежено містом: ${selectedCity || 'не вказано'}`}
            </span>
          </div>

          <div className="scope-pills-group" role="radiogroup" aria-label="Область пошуку адрес">
            <button
              type="button"
              role="radio"
              aria-checked={searchScope === 'all-ukraine'}
              className={`scope-pill-btn ${searchScope === 'all-ukraine' ? 'active' : ''}`}
              onClick={() => onSearchScopeChange('all-ukraine')}
              disabled={isLoading}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Вся Україна</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={searchScope === 'city'}
              className={`scope-pill-btn ${searchScope === 'city' ? 'active' : ''}`}
              onClick={() => onSearchScopeChange('city')}
              disabled={isLoading}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                <line x1="9" y1="6" x2="9" y2="6.01" />
                <line x1="15" y1="6" x2="15" y2="6.01" />
                <line x1="9" y1="10" x2="9" y2="10.01" />
                <line x1="15" y1="10" x2="15" y2="10.01" />
                <line x1="9" y1="14" x2="9" y2="14.01" />
                <line x1="15" y1="14" x2="15" y2="14.01" />
                <path d="M10 22v-4h4v4" />
              </svg>
              <span>Вибране місто</span>
            </button>
          </div>
        </div>

        {searchScope === 'city' && (
          <div className="city-scope-picker">
            <div className="city-scope-controls">
              <label htmlFor="city-select-dropdown" className="city-scope-label">
                Місто для пошуку адрес:
              </label>
              <div className="city-inputs-row">
                <select
                  id="city-select-dropdown"
                  className="form-select city-select-input"
                  value={POPULAR_CITIES.includes(selectedCity) && !isCustomCity ? selectedCity : '__custom__'}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomCity(true);
                    } else {
                      setIsCustomCity(false);
                      onSelectedCityChange(e.target.value);
                    }
                  }}
                  disabled={isLoading}
                >
                  {POPULAR_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__custom__">Інше місто (ввести вручну)...</option>
                </select>

                {(isCustomCity || !POPULAR_CITIES.includes(selectedCity)) && (
                  <input
                    type="text"
                    className="form-input form-input-sm city-text-input"
                    placeholder="Введіть назву міста (наприклад: Бровари)"
                    value={selectedCity}
                    onChange={(e) => onSelectedCityChange(e.target.value)}
                    disabled={isLoading}
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div className="city-quick-pills">
              <span className="city-quick-hint">Швидкий вибір:</span>
              {['Житомир', 'Київ', 'Львів', 'Вінниця', 'Дніпро', 'Одеса'].map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`city-pill-btn ${selectedCity === c && !isCustomCity ? 'active' : ''}`}
                  onClick={() => {
                    setIsCustomCity(false);
                    onSelectedCityChange(c);
                  }}
                  disabled={isLoading}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vertical Route Journey Chain */}
      <div className="route-chain-flow">
        {/* START POINT */}
        <div className="chain-node chain-node-start">
          <div className="chain-marker" aria-hidden="true">
            <span className="marker-dot marker-dot-start">A</span>
          </div>
          <div className="chain-content">
            <div className="chain-title-row">
              <label className="chain-label" htmlFor="start-address">
                Звідки (Початок)
              </label>
              {start.label && (
                <span className="chain-active-tag">{start.label}</span>
              )}
            </div>

            <div className="input-with-action">
              <AddressAutocompleteInput
                id="start-address"
                className="form-input"
                placeholder={
                  activeCity
                    ? `Введіть адресу або точку старту в м. ${activeCity}`
                    : 'Введіть адресу або точку старту'
                }
                value={start.address}
                city={activeCity}
                onChange={(newAddress, suggestion) => {
                  setLocationError(null);
                  onStartChange({
                    ...start,
                    label: start.label || 'Старт',
                    address: newAddress,
                    latitude: suggestion?.latitude,
                    longitude: suggestion?.longitude,
                  });
                }}
                disabled={isLoading || isLocating}
              />
              <button
                type="button"
                className="btn-location-action"
                onClick={handleUseCurrentLocation}
                disabled={isLoading || isLocating}
                title="Визначити моє поточне місцезнаходження за GPS"
                aria-label="Використати моє поточне місцезнаходження"
              >
                {isLocating ? (
                  <svg
                    className="btn-spinner"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="7" />
                    <line x1="12" y1="2" x2="12" y2="5" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="5" y2="12" />
                    <line x1="19" y1="12" x2="22" y2="12" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                )}
              </button>
            </div>
            {locationError && <p className="form-error-sm">{locationError}</p>}

            {/* Quick Preset Chips for Start */}
            <div className="point-quick-chips">
              <span className="chips-hint">Мітка:</span>
              <button
                type="button"
                className={`chip-btn ${start.label === 'Дім' ? 'selected' : ''}`}
                onClick={() => onStartChange({ ...start, label: 'Дім' })}
                disabled={isLoading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Дім</span>
              </button>
              <button
                type="button"
                className={`chip-btn ${start.label === 'Робота' ? 'selected' : ''}`}
                onClick={() => onStartChange({ ...start, label: 'Робота' })}
                disabled={isLoading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <span>Робота</span>
              </button>
              <button
                type="button"
                className={`chip-btn ${start.label === 'Моє місцезнаходження' ? 'selected' : ''}`}
                onClick={() => onStartChange({ ...start, label: 'Моє місцезнаходження' })}
                disabled={isLoading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                <span>Моє місце</span>
              </button>
            </div>
          </div>
        </div>

        {/* CONNECTOR & INTERMEDIATE STOPS */}
        <div className="chain-connector-segment">
          <div className="chain-connector-line" aria-hidden="true" />

          {isDirectTrip ? (
            <div className="direct-trip-shortcut">
              <div className="direct-shortcut-info">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span className="direct-shortcut-text">Прямий шлях без зупинок</span>
              </div>
              <button
                type="button"
                className="btn-inline-add"
                onClick={handleEnableStopsMode}
                disabled={isLoading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Додати зупинку по дорозі</span>
              </button>
            </div>
          ) : (
            <div className="stops-chain-wrapper">
              <StopsSection
                stops={stops}
                isLoading={isLoading}
                onAddStop={onAddStop}
                onRemoveStop={onRemoveStop}
                onUpdateStop={onUpdateStop}
                city={activeCity}
              />
            </div>
          )}
        </div>

        {/* DESTINATION POINT */}
        <div className="chain-node chain-node-dest">
          <div className="chain-marker" aria-hidden="true">
            <span className="marker-dot marker-dot-dest">B</span>
          </div>
          <div className="chain-content">
            <div className="chain-title-row">
              <label className="chain-label" htmlFor="destination-address">
                Куди (Призначення)
              </label>
              {destination.label && (
                <span className="chain-active-tag">{destination.label}</span>
              )}
            </div>

            <AddressAutocompleteInput
              id="destination-address"
              className="form-input"
              placeholder={
                activeCity
                  ? `Введіть адресу фінішу в м. ${activeCity}`
                  : 'Введіть адресу або заклад фінішу'
              }
              value={destination.address}
              city={activeCity}
              onChange={(newAddress, suggestion) => {
                onDestinationChange({
                  ...destination,
                  label: destination.label || 'Фініш',
                  address: newAddress,
                  latitude: suggestion?.latitude,
                  longitude: suggestion?.longitude,
                });
              }}
              disabled={isLoading}
            />

            {/* Quick Preset Chips for Destination */}
            <div className="point-quick-chips">
              <span className="chips-hint">Мітка:</span>
              <button
                type="button"
                className={`chip-btn ${destination.label === 'Офіс' ? 'selected' : ''}`}
                onClick={() => onDestinationChange({ ...destination, label: 'Офіс' })}
                disabled={isLoading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
                <span>Офіс</span>
              </button>
              <button
                type="button"
                className={`chip-btn ${destination.label === 'Лікарня' ? 'selected' : ''}`}
                onClick={() => onDestinationChange({ ...destination, label: 'Лікарня' })}
                disabled={isLoading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                <span>Лікарня</span>
              </button>
              <button
                type="button"
                className={`chip-btn ${destination.label === 'ТРЦ' ? 'selected' : ''}`}
                onClick={() => onDestinationChange({ ...destination, label: 'ТРЦ' })}
                disabled={isLoading}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span>ТРЦ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TRIP SCHEDULE & OPTIMIZATION SETTINGS */}
      <div className="trip-settings-panel">
        <h3 className="settings-panel-title">Час та деталі поїздки</h3>

        {/* Planning Mode Selector (Depart At vs Arrive By) */}
        <div className="form-group">
          <label className="form-label-sm">Режим часу</label>
          <div className="planning-mode-group" role="radiogroup" aria-label="Режим планування часу">
            <button
              type="button"
              className={`planning-mode-btn ${!isArriveBy ? 'active' : ''}`}
              onClick={() => onPlanningModeChange('depart-at')}
              disabled={isLoading}
              role="radio"
              aria-checked={!isArriveBy}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Виїхати о...</span>
            </button>
            <button
              type="button"
              className={`planning-mode-btn ${isArriveBy ? 'active' : ''}`}
              onClick={() => onPlanningModeChange('arrive-by')}
              disabled={isLoading}
              role="radio"
              aria-checked={isArriveBy}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
              <span>Прибути до (дедлайн)</span>
            </button>
          </div>
        </div>

        {/* SEPARATED DATE & TIME INPUTS */}
        <div className="trip-datetime-grid">
          <div className="form-group">
            <label className="form-label-sm" htmlFor="trip-date">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Дата поїздки</span>
            </label>
            <div className="date-input-container">
              <input
                id="trip-date"
                type="date"
                className="form-input form-input-sm"
                value={datePart}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={isLoading}
              />
              <div className="quick-date-pills">
                <button
                  type="button"
                  className={`btn-date-pill ${datePart === todayStr ? 'active' : ''}`}
                  onClick={() => handleDateChange(todayStr)}
                  disabled={isLoading}
                >
                  Сьогодні
                </button>
                <button
                  type="button"
                  className={`btn-date-pill ${datePart === tomorrowStr ? 'active' : ''}`}
                  onClick={() => handleDateChange(tomorrowStr)}
                  disabled={isLoading}
                >
                  Завтра
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label-sm" htmlFor="trip-time">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{isArriveBy ? 'Час прибуття' : 'Час виїзду'}</span>
            </label>
            <input
              id="trip-time"
              type="time"
              className="form-input form-input-sm time-only-input"
              value={timePart}
              onChange={(e) => handleTimeChange(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* OPTIMIZATION PRIORITY (INTERACTIVE CARDS) */}
        <div className="trip-optimization-section">
          <label className="form-label-sm">
            Пріоритет побудови маршруту
          </label>

          {isDirectTrip ? (
            <div className="direct-priority-notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Прямий маршрут: розраховується найкоротший шлях напряму від Старту до Фінішу.</span>
            </div>
          ) : (
            <div className="algorithm-cards-grid" role="radiogroup" aria-label="Пріоритет побудови маршруту">
              <button
                type="button"
                role="radio"
                aria-checked={algorithm === 'two-opt'}
                className={`algo-card ${algorithm === 'two-opt' ? 'selected' : ''}`}
                onClick={() => onAlgorithmChange('two-opt')}
                disabled={isLoading}
              >
                <div className="algo-card-head">
                  <span className="algo-radio-dot" />
                  <span className="algo-name">Розумна оптимізація</span>
                  <span className="algo-recommended-badge">Кращий</span>
                </div>
                <p className="algo-card-desc">2-Opt: переставляє зупинки для мінімального часу в дорозі</p>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={algorithm === 'nearest-neighbor'}
                className={`algo-card ${algorithm === 'nearest-neighbor' ? 'selected' : ''}`}
                onClick={() => onAlgorithmChange('nearest-neighbor')}
                disabled={isLoading}
              >
                <div className="algo-card-head">
                  <span className="algo-radio-dot" />
                  <span className="algo-name">Найближчі точки</span>
                </div>
                <p className="algo-card-desc">Послідовно прямує до найближчого наступного пункту</p>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={algorithm === 'original'}
                className={`algo-card ${algorithm === 'original' ? 'selected' : ''}`}
                onClick={() => onAlgorithmChange('original')}
                disabled={isLoading}
              >
                <div className="algo-card-head">
                  <span className="algo-radio-dot" />
                  <span className="algo-name">Мій порядок</span>
                </div>
                <p className="algo-card-desc">Зберігає вказану вами послідовність зупинок без змін</p>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ACTION BUTTON */}
      <button
        type="button"
        className="btn btn-primary btn-block btn-optimize-trip"
        onClick={onOptimize}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg
              className="btn-spinner"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span>Розраховуємо найкращий маршрут...</span>
          </>
        ) : isDirectTrip ? (
          'Розрахувати прямий маршрут'
        ) : (
          'Оптимізувати та побудувати маршрут'
        )}
      </button>
    </section>
  );
};
