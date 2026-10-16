import React, { useState } from 'react';
import type { AddressInput, AlgorithmType, PlanningMode, RouteStop, SearchScope, TravelMode } from '../types/route';
import { AddressAutocompleteInput } from './AddressAutocompleteInput';
import { StopsSection } from './StopsSection';
import { CustomDatePicker } from './CustomDatePicker';
import { CustomTimePicker } from './CustomTimePicker';
import { reverseGeocode } from '../api/geocodingClient';
import { adjustTimeString, getCurrentRoundedTimeString, getTodayDateString } from '../utils/dateTime';
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
            setLocationError('Доступ до геопозиції відхилено.');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setLocationError('GPS-дані недоступні.');
            break;
          case geoError.TIMEOUT:
            setLocationError('Час очікування GPS вичерпано.');
            break;
          default:
            setLocationError('Не вдалося визначити геопозицію.');
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
    <section className="card form-planner-card" aria-labelledby="form-planner-title">
      {/* CARD HEADER */}
      <div className="planner-card-header">
        <div className="planner-heading-group">
          <h2 id="form-planner-title" className="planner-main-title">
            Новий маршрут
          </h2>
          {isDraftSaved && (
            <span className="draft-saved-pill" title="Чернетку автоматично збережено">
              Збережено
            </span>
          )}
        </div>

        {onResetDraft && (
          <button
            type="button"
            className="btn-card-reset"
            onClick={onResetDraft}
            title="Очистити поля форми та збережену чернетку"
            disabled={isLoading}
          >
            Скинути
          </button>
        )}
      </div>
      <div className="form-sub-section">
        <div className="section-step-label">1 · КУДИ ЇДЕМО</div>
        <div className="scope-inline-row">
          <span className="scope-text-prefix">Регіон:</span>
          <select
            id="search-scope-select"
            className="scope-select-input"
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
            <option value="all-ukraine">Вся Україна</option>
            <optgroup label="Популярні міста">
              {POPULAR_CITIES.map((c) => (
                <option key={c} value={c}>
                  м. {c}
                </option>
              ))}
            </optgroup>
            <option value="__custom__">Інше місто…</option>
          </select>

          {searchScope === 'city' && isCustomCity && (
            <input
              type="text"
              className="scope-custom-input"
              placeholder="Назва міста"
              value={selectedCity}
              onChange={(e) => onSelectedCityChange(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          )}
        </div>
        <div className="route-chain-stack">
          <div className="chain-row-item chain-row-start" style={{ zIndex: 90 }}>
            <div className="marker-solid-a" aria-hidden="true">
              A
            </div>
            <div className="chain-input-box">
              <AddressAutocompleteInput
                id="start-address"
                className="form-input form-input-clean"
                placeholder={
                  activeCity
                    ? `Адреса старту (${activeCity})`
                    : 'Звідки: адреса або точка старту'
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
                className="btn-gps-action"
                onClick={handleUseCurrentLocation}
                disabled={isLoading || isLocating}
                title="Визначити моє поточне місцезнаходження за GPS"
                aria-label="Використати моє поточне місцезнаходження"
              >
                {isLocating ? (
                  <svg className="btn-spinner" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
          </div>
          {locationError && <p className="form-error-sm">{locationError}</p>}

          {/* INTERMEDIATE STOPS */}
          <StopsSection
            stops={stops}
            isLoading={isLoading}
            onAddStop={onAddStop}
            onRemoveStop={onRemoveStop}
            onUpdateStop={onUpdateStop}
            onReorderStops={onReorderStops}
            city={activeCity}
          />
          <div className="chain-row-item chain-row-dest" style={{ zIndex: 10 }}>
            <div className="marker-solid-b" aria-hidden="true">
              B
            </div>
            <div className="chain-input-box">
              <AddressAutocompleteInput
                id="destination-address"
                className="form-input form-input-clean"
                placeholder={
                  activeCity
                    ? `Адреса фінішу (${activeCity})`
                    : 'Куди: адреса або заклад фінішу'
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
      </div>
      <div className="form-sub-section">
        <div className="section-step-label">2 · КОЛИ</div>
        <div className="mode-toggle-bar" role="radiogroup" aria-label="Режим планування часу">
          <button
            type="button"
            className={`mode-toggle-tab ${!isArriveBy ? 'active' : ''}`}
            onClick={() => onPlanningModeChange('depart-at')}
            disabled={isLoading}
            role="radio"
            aria-checked={!isArriveBy}
          >
            Виїхати о...
          </button>
          <button
            type="button"
            className={`mode-toggle-tab ${isArriveBy ? 'active' : ''}`}
            onClick={() => onPlanningModeChange('arrive-by')}
            disabled={isLoading}
            role="radio"
            aria-checked={isArriveBy}
          >
            Прибути до...
          </button>
        </div>
        <div className="datetime-compact-row">
          <div className="datetime-field-group">
            <label className="datetime-label" htmlFor="trip-date">
              Дата
            </label>
            <CustomDatePicker
              id="trip-date"
              value={datePart}
              minDate={todayStr}
              onChange={handleDateChange}
              disabled={isLoading}
            />
          </div>

          <div className="datetime-field-group">
            <label className="datetime-label" htmlFor="trip-time">
              {isArriveBy ? 'Час прибуття' : 'Час виїзду'}
            </label>
            <div className="time-input-stepper-wrap">
              <CustomTimePicker
                id="trip-time"
                value={timePart}
                onChange={handleTimeChange}
                disabled={isLoading}
              />
              <div className="time-stepper-mini">
                <button
                  type="button"
                  className="btn-step-mini"
                  onClick={() => handleTimeChange(adjustTimeString(timePart, -15))}
                  disabled={isLoading}
                  title="-15 хвилин"
                  aria-label="-15 хвилин"
                >
                  -15
                </button>
                <button
                  type="button"
                  className="btn-step-mini"
                  onClick={() => handleTimeChange(adjustTimeString(timePart, 15))}
                  disabled={isLoading}
                  title="+15 хвилин"
                  aria-label="+15 хвилин"
                >
                  +15
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="quick-presets-row">
          <button
            type="button"
            className="preset-time-chip"
            onClick={() => handleTimeChange(getCurrentRoundedTimeString())}
            disabled={isLoading}
          >
            Зараз
          </button>
          {['09:00', '12:00', '15:00', '18:00'].map((preset) => (
            <button
              key={preset}
              type="button"
              className={`preset-time-chip ${timePart === preset ? 'active' : ''}`}
              onClick={() => handleTimeChange(preset)}
              disabled={isLoading}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
      <div className="form-sub-section">
        <div className="section-step-label">3 · ЯК ЇДЕМО</div>
        <div className="travel-mode-cards-grid" role="radiogroup" aria-label="Спосіб пересування">
          <button
            type="button"
            className={`travel-mode-card ${travelMode === 'driving' ? 'active' : ''}`}
            onClick={() => onTravelModeChange?.('driving')}
            disabled={isLoading}
            role="radio"
            aria-checked={travelMode === 'driving'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
              <circle cx="7" cy="17" r="2" />
              <path d="M9 17h6" />
              <circle cx="17" cy="17" r="2" />
            </svg>
            <span className="mode-card-label">Авто</span>
          </button>

          <button
            type="button"
            className={`travel-mode-card ${travelMode === 'walking' ? 'active' : ''}`}
            onClick={() => onTravelModeChange?.('walking')}
            disabled={isLoading}
            role="radio"
            aria-checked={travelMode === 'walking'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
              <path d="m6.5 21.5 3.5-6.5 3 2.5v4" />
              <path d="m6 11 3.5 1.5 3-3.5 3 2.5 3.5-1.5" />
              <path d="m9.5 12.5 2 3.5" />
            </svg>
            <span className="mode-card-label">Пішки</span>
          </button>

          <button
            type="button"
            className={`travel-mode-card ${travelMode === 'cycling' ? 'active' : ''}`}
            onClick={() => onTravelModeChange?.('cycling')}
            disabled={isLoading}
            role="radio"
            aria-checked={travelMode === 'cycling'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="5.5" cy="17.5" r="3.5" />
              <circle cx="18.5" cy="17.5" r="3.5" />
              <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5 2-6.5h3.5" />
              <path d="M5.5 17.5 9 9l3.5 5.5H18" />
            </svg>
            <span className="mode-card-label">Велосипед</span>
          </button>
        </div>

        {/* Stop Reordering Algorithm (shown when >= 2 stops) */}
        {stops.length >= 2 && (
          <div className="algo-segmented-bar" role="radiogroup" aria-label="Порядок об'їзду зупинок">
            <button
              type="button"
              role="radio"
              aria-checked={algorithm === 'two-opt'}
              className={`algo-btn ${algorithm === 'two-opt' ? 'active' : ''}`}
              onClick={() => onAlgorithmChange('two-opt')}
              disabled={isLoading}
              title="2-Opt: розумна оптимізація послідовності для найшвидшого маршруту"
            >
              Оптимальний
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={algorithm === 'nearest-neighbor'}
              className={`algo-btn ${algorithm === 'nearest-neighbor' ? 'active' : ''}`}
              onClick={() => onAlgorithmChange('nearest-neighbor')}
              disabled={isLoading}
              title="Послідовно прямує до кожної наступної найближчої точки"
            >
              Найближчі
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={algorithm === 'original'}
              className={`algo-btn ${algorithm === 'original' ? 'active' : ''}`}
              onClick={() => onAlgorithmChange('original')}
              disabled={isLoading}
              title="Зберігає вказаний порядок зупинок без автоматичної перестановки"
            >
              Мій порядок
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          PRIMARY CTA: Оптимізувати маршрут
          ========================================================================= */}
      <div className="planner-cta-wrap">
        <button
          type="button"
          className="btn-hero-cta"
          onClick={onOptimize}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="cta-loading-content">
              <svg className="btn-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <span>Розраховуємо маршрут…</span>
            </span>
          ) : (
            'Оптимізувати маршрут'
          )}
        </button>
      </div>
    </section>
  );
};
