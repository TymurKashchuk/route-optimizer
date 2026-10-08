import type { RoutePointDto, RoutePreviewDto } from '../types/route';

/**
 * Formats a route point for Google Maps URL.
 * Prioritizes exact coordinates (latitude,longitude) to avoid re-geocoding ambiguities,
 * falling back to the text address if coordinates are unavailable.
 */
function formatPoint(point: RoutePointDto): string {
  if (
    typeof point.latitude === 'number' &&
    typeof point.longitude === 'number' &&
    !isNaN(point.latitude) &&
    !isNaN(point.longitude) &&
    (point.latitude !== 0 || point.longitude !== 0)
  ) {
    return `${point.latitude},${point.longitude}`;
  }
  return point.address || point.label;
}

/**
 * Builds a universal Google Maps navigation URL from the optimized route preview.
 * 
 * - If waypoints <= 9: uses Google Maps Universal URLs format:
 *   https://www.google.com/maps/dir/?api=1&origin=...&destination=...&waypoints=...
 * - If waypoints > 9: uses Google Maps path format which supports 10+ waypoints:
 *   https://www.google.com/maps/dir/point1/point2/.../pointN
 */
export function buildGoogleMapsDirectionsUrl(preview?: RoutePreviewDto): string | null {
  if (!preview || !preview.startPoint) {
    return null;
  }

  const originStr = formatPoint(preview.startPoint);
  if (!originStr) return null;

  let destinationStr = '';
  let intermediateStops: RoutePointDto[] = [];

  if (preview.destinationPoint && (preview.destinationPoint.address || preview.destinationPoint.latitude)) {
    destinationStr = formatPoint(preview.destinationPoint);
    intermediateStops = preview.orderedStops;
  } else if (preview.orderedStops.length > 0) {
    const lastStop = preview.orderedStops[preview.orderedStops.length - 1];
    destinationStr = formatPoint(lastStop);
    intermediateStops = preview.orderedStops.slice(0, -1);
  } else {
    // Single location fallback
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(originStr)}`;
  }

  // Handle long routes (> 9 waypoints) via path format
  if (intermediateStops.length > 9) {
    const allPoints = [originStr, ...intermediateStops.map(formatPoint), destinationStr];
    const encodedSegments = allPoints.map((pt) => encodeURIComponent(pt)).join('/');
    return `https://www.google.com/maps/dir/${encodedSegments}`;
  }

  // Standard Universal URL format
  const params = new URLSearchParams();
  params.set('api', '1');
  params.set('origin', originStr);
  params.set('destination', destinationStr);

  if (intermediateStops.length > 0) {
    const waypointsVal = intermediateStops.map(formatPoint).join('|');
    params.set('waypoints', waypointsVal);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Copies arbitrary text to clipboard with fallback for non-secure contexts.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    textArea.remove();
    return success;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
