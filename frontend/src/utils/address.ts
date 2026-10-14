/**
 * Address formatting and label derivation helpers for RouteWise.
 */

const CITY_OR_COUNTRY_PREFIX =
  /^(україна|ukraine|м\.|місто|смт|с\.|село|київ|харків|одеса|дніпро|львів|житомир|вінниця|полтава|чернігів|черкаси|суми|рівне|луцьк|тернопіль|івано-франківськ|ужгород|хмельницький|чернівці|запоріжжя|миколаїв|херсон|кропивницький)$/i;

/**
 * Automatically derives a concise, human-readable label from an address or place name.
 * Extracts the primary establishment name or street name (e.g. "ТРЦ Retroville" or "вул. Хрещатик, 22").
 * Safely ignores city prefixes when a street is present, and rejects single-letter or invalid candidates.
 */
export function deriveStopLabel(address: string, fallback: string): string {
  const trimmed = address.trim();
  if (!trimmed || trimmed.length < 3) return fallback;

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return fallback;

  // If first part is just a city or country prefix, skip to subsequent street/venue part
  let candidateIndex = 0;
  if (
    parts.length > 1 &&
    (CITY_OR_COUNTRY_PREFIX.test(parts[0]) || /^(м\.|місто|смт|с\.|село)\s+/i.test(parts[0]))
  ) {
    candidateIndex = 1;
  }

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
  if (secondary && (/^\d+[a-zA-Zа-яА-ЯёЁіІїЇєЄ\-/]*$/.test(secondary) || !isNaN(Number(secondary)))) {
    return `${primary}, ${secondary}`;
  }

  return primary || fallback;
}
