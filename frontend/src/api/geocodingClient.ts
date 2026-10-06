import type { AddressSuggestionDto } from '../types/route';

/**
 * Searches for address suggestions through the RouteWise backend API.
 */
export async function searchAddresses(
  query: string,
  limit: number = 5,
  signal?: AbortSignal
): Promise<AddressSuggestionDto[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/geocoding/search?query=${encodeURIComponent(trimmed)}&limit=${limit}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Search rate limit reached. Please wait a moment.');
      }
      throw new Error(`Address search failed (HTTP ${response.status}).`);
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
      throw new Error('No address found for current coordinates.');
    }
    if (response.status === 429) {
      throw new Error('Geocoding rate limit reached. Please wait a moment.');
    }
    throw new Error(`Reverse geocoding failed (HTTP ${response.status}).`);
  }

  return (await response.json()) as AddressSuggestionDto;
}
