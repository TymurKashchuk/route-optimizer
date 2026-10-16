import React, { useEffect, useMemo, useRef, useState } from 'react';

interface CustomDatePickerProps {
  id?: string;
  value: string; // "YYYY-MM-DD"
  minDate?: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  disabled?: boolean;
}

const UK_MONTH_NAMES = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];

const UK_DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  id,
  value,
  minDate,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeView, setActiveView] = useState<{ year: number; month: number } | null>(null);

  const [initialNow] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const baseYearMonth = useMemo(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) return { year: y, month: m };
      }
    }
    return initialNow;
  }, [value, initialNow]);

  const viewYear = activeView?.year ?? baseYearMonth.year;
  const viewMonth = activeView?.month ?? baseYearMonth.month;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveView(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setActiveView({ year: viewYear - 1, month: 11 });
    } else {
      setActiveView({ year: viewYear, month: viewMonth - 1 });
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setActiveView({ year: viewYear + 1, month: 0 });
    } else {
      setActiveView({ year: viewYear, month: viewMonth + 1 });
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
    setIsOpen(false);
    setActiveView(null);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
    setActiveView(null);
  };

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  // Adjust so Monday is 0 and Sunday is 6
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const formattedDisplay = (() => {
    if (!value) return '';
    const [y, m, d] = value.split('-');
    return `${d}.${m}.${y}`;
  })();

  const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : null;

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
        <span className="picker-value-text">{formattedDisplay || 'Оберіть дату'}</span>
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
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {isOpen && (
        <div className="custom-picker-dropdown custom-date-dropdown" role="dialog" aria-label="Вибір дати">
          <div className="date-picker-header">
            <button
              type="button"
              className="btn-date-nav"
              onClick={handlePrevMonth}
              title="Попередній місяць"
            >
              ‹
            </button>
            <span className="date-picker-month-label">
              {UK_MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              className="btn-date-nav"
              onClick={handleNextMonth}
              title="Наступний місяць"
            >
              ›
            </button>
          </div>

          <div className="date-picker-weekdays">
            {UK_DAY_NAMES.map((name) => (
              <span key={name} className="date-picker-weekday">
                {name}
              </span>
            ))}
          </div>

          <div className="date-picker-grid">
            {Array.from({ length: startOffset }).map((_, i) => (
              <span key={`empty-${i}`} className="date-picker-cell empty" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateToCheck = new Date(viewYear, viewMonth, day);
              const isPast = minDateObj ? dateToCheck < minDateObj : false;

              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(day).padStart(2, '0');
              const currentIso = `${viewYear}-${mm}-${dd}`;
              const isSelected = currentIso === value;

              return (
                <button
                  key={day}
                  type="button"
                  className={`date-picker-cell day-btn ${isSelected ? 'selected' : ''}`}
                  disabled={isPast}
                  onClick={() => handleSelectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="date-picker-footer">
            <button type="button" className="btn-today-link" onClick={handleSelectToday}>
              Сьогодні
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
