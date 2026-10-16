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
 * Formats an ISO datetime string into a human-readable date line in Ukrainian (e.g. "пт, 16 жовтня").
 */
export function formatDayMonthUk(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('uk-UA', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
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

/**
 * Returns current local time rounded up to the nearest 5-minute interval (HH:MM).
 */
export function getCurrentRoundedTimeString(): string {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 5) * 5;
  now.setMinutes(roundedMinutes, 0, 0);
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Shifts a 24-hour time string (HH:MM) by a specified delta in minutes.
 * Handles 24-hour wraparound safely (e.g. 23:50 + 15 min = 00:05).
 */
export function adjustTimeString(timeStr: string, deltaMinutes: number): string {
  const parts = (timeStr || '09:00').split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  let totalMinutes = h * 60 + m + deltaMinutes;
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const newH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const newM = String(totalMinutes % 60).padStart(2, '0');
  return `${newH}:${newM}`;
}
