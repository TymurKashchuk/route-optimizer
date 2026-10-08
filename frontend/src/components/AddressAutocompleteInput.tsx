import React, { useState, useEffect, useRef } from 'react';
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
}

export const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  city,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestionDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasUserTypedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleInputChange = (newValue: string) => {
    hasUserTypedRef.current = true;
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

    const timer = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      try {
        const results = await searchAddresses(trimmed, 5, controller.signal, city);
        const isFocused = document.activeElement === inputRef.current;
        setSuggestions(results);
        setIsOpen(isFocused && hasUserTypedRef.current && results.length > 0);
        setHighlightedIndex(-1);
      } catch {
        // Silently ignore aborts or network issues in autocomplete
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value, city]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: AddressSuggestionDto) => {
    hasUserTypedRef.current = false;
    onChange(suggestion.address, suggestion);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    hasUserTypedRef.current = false;
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
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

  return (
    <div ref={wrapperRef} className={`autocomplete-wrapper ${isOpen && suggestions.length > 0 ? 'autocomplete-open' : ''}`}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (hasUserTypedRef.current && suggestions.length > 0) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
      />
      {isLoading && <span className="autocomplete-spinner" />}
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
      {isOpen && suggestions.length > 0 && (
        <ul
          className="autocomplete-dropdown"
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.map((item, idx) => {
            const fullText = item.displayName || item.address;
            const { primary, secondary } = formatSuggestionText(fullText);
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={`${item.address}-${idx}`}
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
