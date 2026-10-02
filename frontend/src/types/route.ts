export type AlgorithmType = 'original' | 'nearest-neighbor' | 'two-opt';

export interface AddressInput {
  label: string;
  address: string;
}

export interface RouteStop {
  id: string;
  label: string;
  address: string;
  serviceMinutes: number;
}

export interface OptimizeRouteRequest {
  algorithm: AlgorithmType;
  departureTime: string;
  start: AddressInput;
  stops: RouteStop[];
}

export interface RouteMetricsDto {
  totalTravelMinutes: number;
  totalDistanceKm: number;
  totalServiceMinutes: number;
}

export interface RouteStepDto {
  from: string;
  to: string;
  travelMinutes: number;
}

export interface TimelineItemDto {
  label: string;
  arrivalTime: string;
  departureTime: string;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface RoutePointDto {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  order: number;
}

export interface RoutePreviewDto {
  startPoint: RoutePointDto;
  orderedStops: RoutePointDto[];
  geometryCoordinates: LocationPoint[];
}

export interface OptimizeRouteResponse {
  algorithm: string;
  original: RouteMetricsDto;
  optimized: RouteMetricsDto;
  savedMinutes: number;
  savedDistanceKm: number;
  improvementPercent: number;
  orderedStops: string[];
  explanationSteps: RouteStepDto[];
  timeline: TimelineItemDto[];
  routePreview?: RoutePreviewDto;
}

export interface AddressSuggestionDto {
  address: string;
  displayName: string;
  latitude: number;
  longitude: number;
  confidence?: number;
}
