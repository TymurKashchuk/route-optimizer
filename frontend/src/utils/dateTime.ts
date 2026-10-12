/**
 * Date and time formatting utilities for RouteWise.
 */

/**
 * Returns today's date in YYYY-MM-DD format based on local time.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns tomorrow's date in YYYY-MM-DD format based on local time.
 */
export function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats an ISO datetime string into a 24-hour time string (HH:MM).
 * Enforces Ukrainian locale ('uk-UA') and 24-hour format so it displays
 * consistently regardless of the user's operating system language.
 */
export function formatTime(isoString: string): string {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Formats a duration in minutes into a human-readable string (e.g. "45 хв" or "2 год 15 хв").
 */
export function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) return `${rounded} хв`;
  const hours = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  return remaining > 0 ? `${hours} год ${remaining} хв` : `${hours} год`;
}

/**
 * Calculates stop stay/service duration in minutes between arrival and departure ISO timestamps.
 */
export function getServiceDuration(arrivalIso: string, departureIso: string): number {
  const arrival = new Date(arrivalIso).getTime();
  const departure = new Date(departureIso).getTime();
  if (isNaN(arrival) || isNaN(departure) || departure <= arrival) return 0;
  return Math.round((departure - arrival) / (1000 * 60));
}
