import { describe, it, expect } from 'vitest';
import {
  deriveStopLabel,
  isDefaultOrDerivedLabel,
  resolveUpdatedLabel,
} from '../address';

describe('address utils', () => {
  describe('deriveStopLabel', () => {
    it('returns fallback for empty or short addresses', () => {
      expect(deriveStopLabel('', 'Старт')).toBe('Старт');
      expect(deriveStopLabel('  ', 'Зупинка 1')).toBe('Зупинка 1');
      expect(deriveStopLabel('Ки', 'Фініш')).toBe('Фініш');
    });

    it('derives street and house number ignoring country and city prefixes', () => {
      expect(
        deriveStopLabel('Україна, м. Київ, вул. Хрещатик, 22', 'Старт')
      ).toBe('вул. Хрещатик, 22');
      expect(
        deriveStopLabel('Україна, м. Львів, площа Ринок, 1', 'Старт')
      ).toBe('площа Ринок, 1');
    });

    it('extracts establishment name when listed first', () => {
      expect(
        deriveStopLabel('ТРЦ Retroville, просп. Правди, 47, Київ', 'Старт')
      ).toBe('ТРЦ Retroville');
    });

    it('handles building number prefixes like буд.', () => {
      expect(
        deriveStopLabel('вулиця Хрещатик, буд. 22, Київ', 'Старт')
      ).toBe('вулиця Хрещатик, буд. 22');
    });

    it('falls back to city name if only city and country are given', () => {
      expect(deriveStopLabel('Київ, Україна', 'Старт')).toBe('Київ');
      expect(deriveStopLabel('Україна, Київ', 'Старт')).toBe('Київ');
    });
  });

  describe('isDefaultOrDerivedLabel', () => {
    it('identifies default labels as default', () => {
      expect(isDefaultOrDerivedLabel('Старт', '', 'Старт')).toBe(true);
      expect(isDefaultOrDerivedLabel('Фініш', '', 'Фініш')).toBe(true);
      expect(isDefaultOrDerivedLabel('Зупинка 1', '', 'Зупинка 1')).toBe(true);
      expect(isDefaultOrDerivedLabel('Stop 2', '', 'Stop 2')).toBe(true);
      expect(isDefaultOrDerivedLabel('', '', 'Старт')).toBe(true);
    });

    it('identifies labels matching derived address as auto-derived', () => {
      const derived = deriveStopLabel('вул. Хрещатик, 22', 'Зупинка 1');
      expect(
        isDefaultOrDerivedLabel(derived, 'вул. Хрещатик, 22', 'Зупинка 1')
      ).toBe(true);
    });

    it('identifies custom user labels as not default', () => {
      expect(
        isDefaultOrDerivedLabel('Головний офіс', 'вул. Хрещатик, 22', 'Зупинка 1')
      ).toBe(false);
      expect(
        isDefaultOrDerivedLabel('Моє місцезнаходження', 'вул. Хрещатик, 22', 'Старт')
      ).toBe(false);
    });
  });

  describe('resolveUpdatedLabel', () => {
    it('resets to fallback when new address is empty', () => {
      expect(resolveUpdatedLabel('вул. Хрещатик', 'вул. Хрещатик', '', 'Старт')).toBe('Старт');
    });

    it('updates auto-derived label as user types', () => {
      const label1 = resolveUpdatedLabel('Зупинка 1', '', 'Київ, Хрещатик, 22', 'Зупинка 1');
      expect(label1).toBe('Хрещатик, 22');
    });

    it('preserves user custom label when address changes', () => {
      const custom = 'Склад №3';
      const result = resolveUpdatedLabel(custom, 'вул. Промислова, 1', 'вул. Промислова, 5', 'Зупинка 1');
      expect(result).toBe('Склад №3');
    });

    it('updates GPS label when suggestion is chosen', () => {
      const result = resolveUpdatedLabel(
        'Моє місцезнаходження',
        'вул. Володимирська, 1',
        'вул. Хрещатик, 22',
        'Старт',
        'вул. Хрещатик, 22, Київ'
      );
      expect(result).toBe('вул. Хрещатик, 22');
    });
  });
});
