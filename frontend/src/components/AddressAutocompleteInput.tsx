import React, { useState, useEffect, useRef } from 'react';
import { searchAddresses } from '../api/geocodingClient';
import type { AddressSuggestionDto } from '../types/route';

interface AddressAutocompleteInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestionDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
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
        const results = await searchAddresses(trimmed, 5, controller.signal);
        setSuggestions(results);
        setIsOpen(results.length > 0);
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
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: AddressSuggestionDto) => {
    onChange(suggestion.address);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="autocomplete-wrapper">
      <input
        id={id}
        type="text"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
      />
      {isLoading && <span className="autocomplete-spinner" />}
      {isOpen && suggestions.length > 0 && (
        <ul className="autocomplete-dropdown" role="listbox">
          {suggestions.map((item, idx) => (
            <li
              key={`${item.address}-${idx}`}
              className="autocomplete-item"
              onClick={() => handleSelect(item)}
              role="option"
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
              <span className="autocomplete-item-text">
                {item.displayName || item.address}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
