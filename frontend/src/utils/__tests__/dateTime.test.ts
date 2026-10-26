import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  adjustTimeString,
  getServiceDuration,
  getTodayDateString,
  getTomorrowDateString,
  isDateTimeInPast,
} from '../dateTime';

describe('dateTime utils', () => {
  it('formats dates in YYYY-MM-DD format', () => {
    const today = getTodayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const tomorrow = getTomorrowDateString();
    expect(tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(tomorrow >= today).toBe(true);
  });

  describe('formatDuration', () => {
    it('formats minutes under an hour', () => {
      expect(formatDuration(45)).toBe('45 хв');
      expect(formatDuration(5)).toBe('5 хв');
    });

    it('formats exact hours', () => {
      expect(formatDuration(60)).toBe('1 год');
      expect(formatDuration(120)).toBe('2 год');
    });

    it('formats hours and minutes', () => {
      expect(formatDuration(90)).toBe('1 год 30 хв');
      expect(formatDuration(125)).toBe('2 год 5 хв');
    });
  });

  describe('adjustTimeString', () => {
    it('shifts time forward and backward', () => {
      expect(adjustTimeString('09:00', 15)).toBe('09:15');
      expect(adjustTimeString('09:15', -15)).toBe('09:00');
    });

    it('wraps around 24 hours safely', () => {
      expect(adjustTimeString('23:50', 20)).toBe('00:10');
      expect(adjustTimeString('00:05', -15)).toBe('23:50');
    });
  });

  describe('getServiceDuration', () => {
    it('calculates duration in minutes between ISO strings', () => {
      const arr = '2026-10-26T10:00:00Z';
      const dep = '2026-10-26T10:25:00Z';
      expect(getServiceDuration(arr, dep)).toBe(25);
    });

    it('returns 0 if departure is before or equal to arrival', () => {
      const t = '2026-10-26T10:00:00Z';
      expect(getServiceDuration(t, t)).toBe(0);
    });
  });

  describe('isDateTimeInPast', () => {
    it('returns true for past dates', () => {
      expect(isDateTimeInPast('2020-01-01', '12:00')).toBe(true);
    });

    it('returns false for future dates', () => {
      expect(isDateTimeInPast('2099-01-01', '12:00')).toBe(false);
    });
  });
});
