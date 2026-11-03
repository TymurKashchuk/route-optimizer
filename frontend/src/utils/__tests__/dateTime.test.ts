import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  adjustTimeString,
  getServiceDuration,
  getTodayDateString,
  getTomorrowDateString,
  isDateTimeInPast,
  getCurrentRoundedDateTimeString,
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

  describe('getCurrentRoundedDateTimeString', () => {
    it('rounds up to the next 5 minutes on the same day', () => {
      expect(getCurrentRoundedDateTimeString(new Date(2026, 9, 6, 14, 2))).toBe('2026-10-06T14:05');
      expect(getCurrentRoundedDateTimeString(new Date(2026, 9, 6, 14, 5))).toBe('2026-10-06T14:05');
    });

    it('rolls over to the next day after 23:55 (date and time together)', () => {
      expect(getCurrentRoundedDateTimeString(new Date(2026, 9, 6, 23, 58))).toBe('2026-10-07T00:00');
    });

    it('rolls over month and year boundaries', () => {
      expect(getCurrentRoundedDateTimeString(new Date(2026, 11, 31, 23, 56))).toBe('2027-01-01T00:00');
    });
  });});
