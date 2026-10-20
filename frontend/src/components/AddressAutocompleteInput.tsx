import React, { useState, useEffect, useRef, useId } from 'react';
import { searchAddresses } from '../api/geocodingClient';
import type { AddressSuggestionDto } from '../types/route';

interface AddressAutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string, suggestion?: AddressSuggestionDto) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  city?: string;
  hasCoordinates?: boolean;
  onEnterPress?: () => void;
}

export const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  city,
  hasCoordinates,
  onEnterPress,
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listboxId = `${inputId}-listbox`;

  const [suggestions, setSuggestions] = useState<AddressSuggestionDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasUserTypedRef = useRef(false);

  const handleInputChange = (newValue: string) => {
    hasUserTypedRef.current = true;
    setHasSearched(false);
    setSearchError(null);
    onChange(newValue);
    if (newValue.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      setHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    // Only search if user explicitly typed into this input field
    if (!hasUserTypedRef.current) {
      return;
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      return;
    }

    let isCurrent = true;
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setSearchError(null);
      try {
        const results = await searchAddresses(trimmed, 5, controller.signal, city);
        if (!isCurrent) return;

        const isFocused = document.activeElement === inputRef.current;
        setSuggestions(results);
        setHasSearched(true);
        setIsOpen(isFocused && hasUserTypedRef.current);
        setHighlightedIndex(-1);
      } catch (err: unknown) {
        if (!isCurrent) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSuggestions([]);
        setHasSearched(true);
        const msg = err instanceof Error ? err.message : 'Не вдалося виконати пошук адреси';
        setSearchError(msg);
        const isFocused = document.activeElement === inputRef.current;
        setIsOpen(isFocused && hasUserTypedRef.current);
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, city]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (wrapperRef.current && wrapperRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleSelect = (suggestion: AddressSuggestionDto) => {
    hasUserTypedRef.current = false;
    onChange(suggestion.address, suggestion);
    setIsOpen(false);
    setSuggestions([]);
    setHasSearched(false);
    setSearchError(null);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    hasUserTypedRef.current = false;
    onChange('');
    setSuggestions([]);
    setHasSearched(false);
    setSearchError(null);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
      return;
    }

    if (isOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
    }

    if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      } else if (isOpen && suggestions.length > 0) {
        e.preventDefault();
        handleSelect(suggestions[0]);
      } else if (onEnterPress) {
        e.preventDefault();
        setIsOpen(false);
        onEnterPress();
      }
    }
  };

  const formatSuggestionText = (text: string) => {
    const commaIndex = text.indexOf(',');
    if (commaIndex > -1) {
      return {
        primary: text.substring(0, commaIndex).trim(),
        secondary: text.substring(commaIndex + 1).trim(),
      };
    }
    return { primary: text, secondary: '' };
  };

  const isDropdownVisible =
    isOpen && (suggestions.length > 0 || (!isLoading && hasSearched) || !!searchError);

  return (
    <div
      ref={wrapperRef}
      className={`autocomplete-wrapper ${isDropdownVisible ? 'autocomplete-open' : ''}`}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isDropdownVisible}
        aria-controls={listboxId}
        aria-activedescendant={
          highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
        }
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (hasUserTypedRef.current && (suggestions.length > 0 || hasSearched)) {
            setIsOpen(true);
          }
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
      />

      <div className="autocomplete-trailing-wrap">
        {isLoading && <span className="autocomplete-spinner" />}

        {!isLoading && !disabled && value.trim().length >= 3 && (
          hasCoordinates ? (
            <span
              className="autocomplete-coord-badge confirmed"
              title="Адресу підтверджено координатами (обрано з підказок або карти)"
              aria-label="Адресу підтверджено"
            >
              ✓
            </span>
          ) : (
            <span
              className="autocomplete-coord-badge unconfirmed"
              title="Адресу введено вручну. Бажано обрати варіант зі списку для точної прив'язки"
              aria-label="Не підтверджено"
            >
              Введено вручну
            </span>
          )
        )}

        {!isLoading && !disabled && value.trim().length > 0 && (
          <button
            type="button"
            className="autocomplete-clear-btn"
            onClick={handleClear}
            aria-label="Очистити адресу"
            title="Очистити поле"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {isDropdownVisible && (
        <ul
          id={listboxId}
          className="autocomplete-dropdown"
          role="listbox"
          aria-label="Підказки адрес"
          onMouseDown={(e) => e.preventDefault()}
        >
          {searchError && (
            <li className="autocomplete-status-item autocomplete-error" role="status">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{searchError}</span>
            </li>
          )}

          {!isLoading && !searchError && hasSearched && suggestions.length === 0 && (
            <li className="autocomplete-status-item autocomplete-empty" role="status">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <span>За цим запитом нічого не знайдено</span>
            </li>
          )}

          {!searchError && suggestions.map((item, idx) => {
            const fullText = item.displayName || item.address;
            const { primary, secondary } = formatSuggestionText(fullText);
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={`${item.address}-${idx}`}
                id={`${listboxId}-option-${idx}`}
                className={`autocomplete-item ${isHighlighted ? 'active' : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                role="option"
                aria-selected={isHighlighted}
              >
                <svg
                  className="autocomplete-icon"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <div className="autocomplete-item-content">
                  <span className="autocomplete-item-primary">{primary}</span>
                  {secondary && (
                    <span className="autocomplete-item-secondary">{secondary}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
