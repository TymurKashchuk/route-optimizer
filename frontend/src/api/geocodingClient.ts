import type { AddressSuggestionDto } from '../types/route';

/**
 * Searches for address suggestions through the RouteWise backend API.
 */
export async function searchAddresses(
  query: string,
  limit: number = 5,
  signal?: AbortSignal,
  city?: string
): Promise<AddressSuggestionDto[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const cityParam = city?.trim() ? `&city=${encodeURIComponent(city.trim())}` : '';

  try {
    const response = await fetch(
      `/api/geocoding/search?query=${encodeURIComponent(trimmed)}&limit=${limit}${cityParam}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Перевищено ліміт запитів пошуку. Будь ласка, зачекайте хвилину.');
      }
      throw new Error(`Не вдалося виконати пошук адреси (HTTP ${response.status}).`);
    }

    return (await response.json()) as AddressSuggestionDto[];
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return [];
    }
    throw err;
  }
}

/**
 * Resolves a street address from GPS latitude and longitude via RouteWise backend.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<AddressSuggestionDto> {
  const response = await fetch(
    `/api/geocoding/reverse?latitude=${latitude}&longitude=${longitude}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Адресу за цими координатами не знайдено.');
    }
    if (response.status === 429) {
      throw new Error('Перевищено ліміт запитів геокодування. Будь ласка, зачекайте хвилину.');
    }
    throw new Error(`Не вдалося визначити адресу за координатами (HTTP ${response.status}).`);
  }

  return (await response.json()) as AddressSuggestionDto;
}
