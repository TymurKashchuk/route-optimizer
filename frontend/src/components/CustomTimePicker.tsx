import React, { useEffect, useRef, useState } from 'react';
import './CustomPicker.css';

interface CustomTimePickerProps {
  id?: string;
  value: string; // "HH:mm"
  onChange: (time: string) => void;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  id,
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoursListRef = useRef<HTMLDivElement>(null);
  const minutesListRef = useRef<HTMLDivElement>(null);

  const [currentHour, currentMinute] = (() => {
    if (!value || !value.includes(':')) return ['09', '00'];
    const parts = value.split(':');
    return [parts[0].padStart(2, '0'), parts[1].padStart(2, '0')];
  })();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Scroll selected hour into view
      const selectedHourEl = hoursListRef.current?.querySelector('.selected');
      selectedHourEl?.scrollIntoView({ block: 'nearest' });

      // Scroll selected minute into view
      const selectedMinEl = minutesListRef.current?.querySelector('.selected');
      selectedMinEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  const handleSelectHour = (h: string) => {
    onChange(`${h}:${currentMinute}`);
  };

  const handleSelectMinute = (m: string) => {
    onChange(`${currentHour}:${m}`);
  };

  return (
    <div className="custom-picker-container" ref={containerRef}>
      <button
        id={id}
        type="button"
        className="clean-field-input custom-picker-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="picker-value-text">{value || '09:00'}</span>
        <svg
          className="picker-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {isOpen && (
        <div className="custom-picker-dropdown custom-time-dropdown" role="dialog" aria-label="Вибір часу">
          <div className="time-picker-columns">
            {/* Hours Column */}
            <div className="time-picker-column">
              <div className="time-col-header">Год</div>
              <div className="time-scroll-list" ref={hoursListRef}>
                {HOURS.map((h) => {
                  const isSelected = h === currentHour;
                  return (
                    <button
                      key={h}
                      type="button"
                      className={`time-unit-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectHour(h)}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="time-picker-column">
              <div className="time-col-header">Хв</div>
              <div className="time-scroll-list" ref={minutesListRef}>
                {MINUTES.map((m) => {
                  const isSelected = m === currentMinute;
                  const isStep5 = parseInt(m, 10) % 5 === 0;
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`time-unit-btn ${isSelected ? 'selected' : ''} ${isStep5 ? 'step-5' : ''}`}
                      onClick={() => handleSelectMinute(m)}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="time-picker-footer">
            <button
              type="button"
              className="btn-picker-confirm"
              onClick={() => setIsOpen(false)}
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
