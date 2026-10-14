/**
 * Address formatting and label derivation helpers for RouteWise.
 */

/**
 * Automatically derives a concise, human-readable label from an address or place name.
 * Extracts the primary establishment name or street name (e.g. "ТРЦ Retroville" or "вул. Хрещатик, 22").
 */
export function deriveStopLabel(address: string, fallback: string): string {
  const trimmed = address.trim();
  if (!trimmed) return fallback;

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return fallback;

  // If first part is a street and second is a building number (e.g. ["вул. Хрещатик", "22"])
  if (parts.length >= 2 && (/^\d+[a-zA-Zа-яА-ЯёЁіІїЇєЄ\-/]*$/.test(parts[1]) || !isNaN(Number(parts[1])))) {
    return `${parts[0]}, ${parts[1]}`;
  }

  return parts[0] || fallback;
}
