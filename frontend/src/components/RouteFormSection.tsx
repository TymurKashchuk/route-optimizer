import React, { useState } from 'react';
import type { AddressInput, AlgorithmType, PlanningMode, RouteStop, SearchScope, TravelMode } from '../types/route';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { StopsSection } from './StopsSection';
import { reverseGeocode } from '../api/geocodingClient';
import { adjustTimeString, getCurrentRoundedTimeString, getTodayDateString, getTomorrowDateString } from '../utils/dateTime';
import { deriveStopLabel } from '../utils/address';

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

interface RouteFormSectionProps {
  start: AddressInput;
  onStartChange: (start: AddressInput) => void;
  destination: AddressInput;
  onDestinationChange: (destination: AddressInput) => void;
  stops: RouteStop[];
  onAddStop: () => void;
  onRemoveStop: (id: string) => void;
  onUpdateStop: (id: string, fields: Partial<RouteStop>) => void;
  onReorderStops?: (reorderedStops: RouteStop[]) => void;
  searchScope: SearchScope;
  onSearchScopeChange: (scope: SearchScope) => void;
  selectedCity: string;
  onSelectedCityChange: (city: string) => void;
  planningMode: PlanningMode;
  onPlanningModeChange: (mode: PlanningMode) => void;
  travelMode?: TravelMode;
  onTravelModeChange?: (mode: TravelMode) => void;
  departureTime: string;
  onDepartureTimeChange: (time: string) => void;
  arrivalBy: string;
  onArrivalByChange: (time: string) => void;
  algorithm: AlgorithmType;
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  isLoading: boolean;
  onOptimize: () => void;
  isDraftSaved?: boolean;
  onResetDraft?: () => void;
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
  onReorderStops,
  searchScope,
  onSearchScopeChange,
  selectedCity,
  onSelectedCityChange,
  planningMode,
  onPlanningModeChange,
  travelMode = 'driving',
  onTravelModeChange,
  departureTime,
  onDepartureTimeChange,
  arrivalBy,
  onArrivalByChange,
  algorithm,
  onAlgorithmChange,
  isLoading,
  onOptimize,
  isDraftSaved,
  onResetDraft,
}) => {
  const isArriveBy = planningMode === 'arrive-by';
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const isCustomCity = !POPULAR_CITIES.includes(selectedCity);

  const activeCity = searchScope === 'city' ? selectedCity.trim() : undefined;

  // Parse Date and Time parts
  const activeDateTime = isArriveBy ? arrivalBy : departureTime;
  const datePart = activeDateTime.split('T')[0] || getTodayDateString();
  const timePart = activeDateTime.split('T')[1] || (isArriveBy ? '14:00' : '09:00');

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  const handleDateChange = (newDate: string) => {
    const safeDate = newDate && newDate < todayStr ? todayStr : newDate;
    const combined = `${safeDate}T${timePart}`;
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

  return (
    <section className="card trip-planner-card" aria-labelledby="trip-planner-title">
      <div className="trip-planner-header">
        <div>
          <div className="trip-planner-title-row">
            <h2 id="trip-planner-title" className="section-title">
              Маршрут подорожі
            </h2>
            {isDraftSaved && (
              <span className="draft-status-badge" title="Зміни автоматично збережені у вашому браузері">
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Чернетку збережено</span>
              </span>
            )}
          </div>
          <p className="section-subtitle">
            {stops.length === 0
              ? 'Прямий маршрут від точки старту до фінішу'
              : `Маршрут із ${stops.length} ${stops.length === 1 ? 'проміжною зупинкою' : 'проміжними зупинками'}`}
          </p>
        </div>

        {/* Header Actions: Reset Button */}
        {onResetDraft && (
          <div className="trip-header-actions">
            <button
              type="button"
              className="btn-reset-draft"
              onClick={onResetDraft}
              title="Скинути форму та очистити збережену чернетку"
              disabled={isLoading}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Скинути</span>
            </button>
          </div>
        )}
      </div>

      {/* SEARCH SCOPE BAR (COMPACT INLINE) */}
      <div className="search-scope-bar">
        <div className="scope-inline-selector">
          <svg
            className="scope-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <label htmlFor="search-scope-select" className="scope-inline-label">
            Область пошуку:
          </label>
          <select
            id="search-scope-select"
            className="scope-compact-select"
            value={searchScope === 'all-ukraine' ? 'all-ukraine' : (POPULAR_CITIES.includes(selectedCity) ? selectedCity : '__custom__')}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'all-ukraine') {
                onSearchScopeChange('all-ukraine');
              } else if (val === '__custom__') {
                onSearchScopeChange('city');
                onSelectedCityChange('');
              } else {
                onSearchScopeChange('city');
                onSelectedCityChange(val);
              }
            }}
            disabled={isLoading}
            aria-label="Область пошуку адрес"
          >
            <option value="all-ukraine">Вся Україна (міжміський)</option>
            <optgroup label="Популярні міста">
              {POPULAR_CITIES.map((c) => (
                <option key={c} value={c}>
                  м. {c}
                </option>
              ))}
            </optgroup>
            <option value="__custom__">Інше місто (ввести вручну)...</option>
          </select>
        </div>

        {searchScope === 'city' && isCustomCity && (
          <input
            type="text"
            className="form-input form-input-sm city-inline-custom-input"
            placeholder="Введіть назву міста (наприклад: Бровари)"
            value={selectedCity}
            onChange={(e) => onSelectedCityChange(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
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
              {start.label === 'Моє місцезнаходження' && (
                <span className="chain-active-tag">Моє місцезнаходження</span>
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
                    label: deriveStopLabel(newAddress, 'Старт'),
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
          </div>
        </div>

        {/* CONNECTOR & INTERMEDIATE STOPS */}
        <div className="chain-connector-segment">
          <div className="chain-connector-line" aria-hidden="true" />
          <div className="stops-chain-wrapper">
            <StopsSection
              stops={stops}
              isLoading={isLoading}
              onAddStop={onAddStop}
              onRemoveStop={onRemoveStop}
              onUpdateStop={onUpdateStop}
              onReorderStops={onReorderStops}
              city={activeCity}
            />
          </div>
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
                  label: deriveStopLabel(newAddress, 'Фініш'),
                  address: newAddress,
                  latitude: suggestion?.latitude,
                  longitude: suggestion?.longitude,
                });
              }}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* TRIP SCHEDULE & OPTIMIZATION SETTINGS */}
      <div className="trip-settings-panel">
        <h3 className="settings-panel-title">Час та деталі поїздки</h3>

        {/* Travel Mode Selector (Driving, Walking, Cycling) */}
        <div className="form-group">
          <label className="form-label-sm">Спосіб пересування</label>
          <div className="travel-mode-group" role="radiogroup" aria-label="Спосіб пересування">
            <button
              type="button"
              className={`travel-mode-btn ${travelMode === 'driving' ? 'active' : ''}`}
              onClick={() => onTravelModeChange?.('driving')}
              disabled={isLoading}
              role="radio"
              aria-checked={travelMode === 'driving'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
              <span>Авто</span>
            </button>
            <button
              type="button"
              className={`travel-mode-btn ${travelMode === 'walking' ? 'active' : ''}`}
              onClick={() => onTravelModeChange?.('walking')}
              disabled={isLoading}
              role="radio"
              aria-checked={travelMode === 'walking'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
                <path d="m6.5 21.5 3.5-6.5 3 2.5v4" />
                <path d="m6 11 3.5 1.5 3-3.5 3 2.5 3.5-1.5" />
                <path d="m9.5 12.5 2 3.5" />
              </svg>
              <span>Пішки</span>
            </button>
            <button
              type="button"
              className={`travel-mode-btn ${travelMode === 'cycling' ? 'active' : ''}`}
              onClick={() => onTravelModeChange?.('cycling')}
              disabled={isLoading}
              role="radio"
              aria-checked={travelMode === 'cycling'}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="5.5" cy="17.5" r="3.5" />
                <circle cx="18.5" cy="17.5" r="3.5" />
                <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5 2-6.5h3.5" />
                <path d="M5.5 17.5 9 9l3.5 5.5H18" />
              </svg>
              <span>Велосипед</span>
            </button>
          </div>
        </div>

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
                min={todayStr}
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
            <div className="time-input-container">
              <div className="time-picker-controls">
                <input
                  id="trip-time"
                  type="time"
                  className="form-input form-input-sm time-picker-input"
                  value={timePart}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  disabled={isLoading}
                  required
                />

                <div className="time-stepper-btns">
                  <button
                    type="button"
                    className="btn-time-step"
                    onClick={() => handleTimeChange(adjustTimeString(timePart, -15))}
                    disabled={isLoading}
                    title="Зсунути на 15 хв раніше"
                  >
                    -15 хв
                  </button>
                  <button
                    type="button"
                    className="btn-time-step"
                    onClick={() => handleTimeChange(adjustTimeString(timePart, 15))}
                    disabled={isLoading}
                    title="Зсунути на 15 хв пізніше"
                  >
                    +15 хв
                  </button>
                </div>
              </div>

              <div className="quick-time-pills">
                <button
                  type="button"
                  className="btn-time-pill"
                  onClick={() => handleTimeChange(getCurrentRoundedTimeString())}
                  disabled={isLoading}
                  title="Встановити поточний час"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Зараз</span>
                </button>
                {['09:00', '12:00', '15:00', '18:00'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`btn-time-pill ${timePart === preset ? 'active' : ''}`}
                    onClick={() => handleTimeChange(preset)}
                    disabled={isLoading}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* OPTIMIZATION PRIORITY (COMPACT SEGMENTED CONTROL) */}
        {stops.length >= 2 && (
          <div className="trip-optimization-group">
            <label className="form-label-sm">Порядок об'їзду зупинок</label>
            <div className="algo-segmented-group" role="radiogroup" aria-label="Порядок об'їзду зупинок">
              <button
                type="button"
                role="radio"
                aria-checked={algorithm === 'two-opt'}
                className={`algo-segment-btn ${algorithm === 'two-opt' ? 'active' : ''}`}
                onClick={() => onAlgorithmChange('two-opt')}
                disabled={isLoading}
                title="2-Opt: розумна оптимізація послідовності для найшвидшого маршруту"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Оптимальний</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={algorithm === 'nearest-neighbor'}
                className={`algo-segment-btn ${algorithm === 'nearest-neighbor' ? 'active' : ''}`}
                onClick={() => onAlgorithmChange('nearest-neighbor')}
                disabled={isLoading}
                title="Послідовно прямує до кожної наступної найближчої точки"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
                <span>Найближчі</span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={algorithm === 'original'}
                className={`algo-segment-btn ${algorithm === 'original' ? 'active' : ''}`}
                onClick={() => onAlgorithmChange('original')}
                disabled={isLoading}
                title="Зберігає вказаний вами порядок зупинок без автоматичної перестановки"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <span>Мій порядок</span>
              </button>
            </div>
          </div>
        )}
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
        ) : stops.length === 0 ? (
          'Розрахувати прямий маршрут'
        ) : (
          'Оптимізувати та побудувати маршрут'
        )}
      </button>
    </section>
  );
};
