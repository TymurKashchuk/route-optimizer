/**
 * Address formatting and label derivation helpers for RouteWise.
 */

const COUNTRY_OR_POSTAL = /^(україна|ukraine|\d{5})$/i;
const OBLAST_OR_RAION = /^(.*область|.*обл\.?|.*район|.*р-н)$/i;
const CITY_PATTERN =
  /^(м\..*|місто\s+.*|смт\s+.*|с\..*|село\s+.*|селище\s+.*|київ|харків|одеса|дніпро|львів|житомир|вінниця|полтава|чернігів|черкаси|суми|рівне|луцьк|тернопіль|івано-франківськ|ужгород|хмельницький|чернівці|запоріжжя|миколаїв|херсон|кропивницький)$/i;

const BUILDING_NUM_PATTERN = /^(?:буд\.?|будинок|б\.?|№)?\s*\d+[a-zA-Zа-яА-ЯёЁіІїЇєЄ\-/]*$/i;

function isAdministrativePart(part: string): boolean {
  return COUNTRY_OR_POSTAL.test(part) || OBLAST_OR_RAION.test(part) || CITY_PATTERN.test(part);
}

function findBestCandidateIndex(parts: string[]): number {
  for (let i = 0; i < parts.length; i++) {
    if (!isAdministrativePart(parts[i])) {
      return i;
    }
  }
  for (let i = 0; i < parts.length; i++) {
    if (CITY_PATTERN.test(parts[i])) {
      return i;
    }
  }
  for (let i = 0; i < parts.length; i++) {
    if (OBLAST_OR_RAION.test(parts[i])) {
      return i;
    }
  }
  return 0;
}

/**
 * Automatically derives a concise, human-readable label from an address or place name.
 * Extracts the primary establishment name or street name (e.g. "ТРЦ Retroville" or "вул. Хрещатик, 22").
 * Safely skips country/region/city prefixes when a specific street or venue is present.
 */
export function deriveStopLabel(address: string, fallback: string): string {
  const trimmed = address.trim();
  if (!trimmed || trimmed.length < 3) return fallback;

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return fallback;

  const candidateIndex = findBestCandidateIndex(parts);
  const primary = parts[candidateIndex] || '';
  const secondary = parts[candidateIndex + 1] || '';

  // Reject candidates that are too short (like single-letter "Т" or "м.")
  if (primary.length < 3) {
    if (secondary && secondary.length >= 3) {
      return secondary;
    }
    return fallback;
  }

  // If candidate is a street and next part is a building number (e.g. ["вул. Хрещатик", "22"])
  if (secondary && BUILDING_NUM_PATTERN.test(secondary)) {
    return `${primary}, ${secondary}`;
  }

  return primary || fallback;
}

/**
 * Determines whether the current label was default or auto-derived from the previous address.
 */
export function isDefaultOrDerivedLabel(
  currentLabel: string | undefined,
  currentAddress: string | undefined,
  fallback: string
): boolean {
  if (!currentLabel || currentLabel.trim().length < 3) {
    return true;
  }
  const trimmed = currentLabel.trim();
  if (
    trimmed === fallback ||
    trimmed.startsWith('Зупинка') ||
    trimmed.startsWith('Stop') ||
    trimmed === 'Старт' ||
    trimmed === 'Start' ||
    trimmed === 'Фініш' ||
    trimmed === 'Finish'
  ) {
    return true;
  }
  if (currentAddress && trimmed === deriveStopLabel(currentAddress, fallback)) {
    return true;
  }
  return false;
}

/**
 * Resolves the updated stop label when address changes or autocomplete suggestion is selected.
 * Preserves user-customized labels while updating auto-derived or default labels.
 */
export function resolveUpdatedLabel(
  currentLabel: string | undefined,
  currentAddress: string | undefined,
  newAddress: string,
  fallback: string,
  suggestionDisplayName?: string
): string {
  if (!newAddress.trim()) {
    return fallback;
  }

  const isGps = currentLabel === 'Моє місцезнаходження';
  const shouldUpdate =
    isDefaultOrDerivedLabel(currentLabel, currentAddress, fallback) ||
    (isGps && Boolean(suggestionDisplayName));

  if (shouldUpdate) {
    const sourceText = suggestionDisplayName || newAddress;
    return deriveStopLabel(sourceText, fallback);
  }

  return currentLabel || fallback;
}
