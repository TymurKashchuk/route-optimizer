import type { AddressInput, AlgorithmType, PlanningMode, RouteStop, TravelMode } from '../types/route';

export const MAX_STOPS = 10;

export const DEFAULT_START: AddressInput = {
  label: 'Старт',
  address: '',
};

export const DEFAULT_DESTINATION: AddressInput = {
  label: 'Фініш',
  address: '',
};

export const DEFAULT_STOPS: RouteStop[] = [];

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export interface RouteSignatureParams {
  start: AddressInput;
  destination: AddressInput;
  stops: RouteStop[];
  planningMode: PlanningMode;
  travelMode: TravelMode;
  departureTime: string;
  arrivalBy: string;
  algorithm: AlgorithmType;
}

export function getRouteSignature(params: RouteSignatureParams): string {
  return JSON.stringify({
    s: { a: params.start.address.trim(), lat: params.start.latitude, lng: params.start.longitude },
    d: { a: params.destination.address.trim(), lat: params.destination.latitude, lng: params.destination.longitude },
    stops: params.stops.map((s) => ({
      a: s.address.trim(),
      lat: s.latitude,
      lng: s.longitude,
      m: s.serviceMinutes,
    })),
    pm: params.planningMode,
    tm: params.travelMode,
    t: params.planningMode === 'arrive-by' ? params.arrivalBy : params.departureTime,
    alg: params.algorithm,
  });
}

export function createExampleRoute(): {
  start: AddressInput;
  stops: RouteStop[];
  destination: AddressInput;
} {
  return {
    start: {
      label: 'Житомир, майдан Корольова',
      address: 'Житомир, майдан Корольова',
      latitude: 50.2547,
      longitude: 28.6587,
    },
    stops: [
      {
        id: `stop-${generateId()}`,
        label: 'Брусилів, АЗС',
        address: 'Брусилів, АЗС',
        serviceMinutes: 15,
        latitude: 50.2882,
        longitude: 29.5312,
      },
      {
        id: `stop-${generateId()}`,
        label: 'Фастів, вокзал',
        address: 'Фастів, вокзал',
        serviceMinutes: 20,
        latitude: 50.0789,
        longitude: 29.9168,
      },
    ],
    destination: {
      label: 'Київ, Хрещатик',
      address: 'Київ, Хрещатик',
      latitude: 50.4501,
      longitude: 30.5234,
    },
  };
}
