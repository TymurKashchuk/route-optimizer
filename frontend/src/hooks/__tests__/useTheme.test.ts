import { describe, it, expect, beforeEach } from 'vitest';
import { getInitialTheme } from '../useTheme';

describe('getInitialTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('prefers data-theme attribute on documentElement when valid', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    expect(getInitialTheme()).toBe('dark');

    document.documentElement.setAttribute('data-theme', 'light');
    expect(getInitialTheme()).toBe('light');
  });

  it('falls back to saved theme in localStorage', () => {
    localStorage.setItem('routewise_theme', 'dark');
    expect(getInitialTheme()).toBe('dark');
  });

  it('defaults to light when no attribute or saved preference exists', () => {
    expect(getInitialTheme()).toBe('light');
  });
});
