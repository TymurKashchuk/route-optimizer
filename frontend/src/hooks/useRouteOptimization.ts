import { useCallback, useRef, useState } from 'react';
import { optimizeRoute } from '../api/routeClient';
import type {
  AddressInput,
  AlgorithmType,
  OptimizeRouteResponse,
  PlanningMode,
  RouteStop,
  TravelMode,
} from '../types/route';
import type { ToastType } from '../components/Toast';
import { deriveStopLabel, isDefaultOrDerivedLabel } from '../utils/address';

export interface UseRouteOptimizationOptions {
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
}

export interface OptimizeRouteParams {
  algorithm: AlgorithmType;
  planningMode: PlanningMode;
  travelMode: TravelMode;
  departureTime: string;
  arrivalBy: string;
  start: AddressInput;
  destination: AddressInput;
  stops: RouteStop[];
  signature: string;
}

export function useRouteOptimization({ showToast, clearToast }: UseRouteOptimizationOptions) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizeRouteResponse | null>(null);
  const [lastOptimizedSignature, setLastOptimizedSignature] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const resetResult = useCallback(() => {
    setResult(null);
    setLastOptimizedSignature(null);
  }, []);

  const optimize = useCallback(
    async ({
      algorithm,
      planningMode,
      travelMode,
      departureTime,
      arrivalBy,
      start,
      destination,
      stops,
      signature,
    }: OptimizeRouteParams) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      clearToast();

      try {
        const data = await optimizeRoute(
          {
            algorithm,
            planningMode,
            travelMode,
            departureTime: planningMode === 'depart-at' ? departureTime : undefined,
            arrivalBy: planningMode === 'arrive-by' ? arrivalBy : undefined,
            start: {
              ...start,
              label: isDefaultOrDerivedLabel(start.label, start.address, 'Старт')
                ? deriveStopLabel(start.address, 'Старт')
                : start.label.trim(),
            },
            destination: {
              ...destination,
              label: isDefaultOrDerivedLabel(destination.label, destination.address, 'Фініш')
                ? deriveStopLabel(destination.address, 'Фініш')
                : destination.label.trim(),
            },
            stops: stops.map((s, idx) => ({
              ...s,
              label: isDefaultOrDerivedLabel(s.label, s.address, `Зупинка ${idx + 1}`)
                ? deriveStopLabel(s.address, `Зупинка ${idx + 1}`)
                : s.label.trim(),
            })),
          },
          controller.signal
        );
        setResult(data);
        setLastOptimizedSignature(signature);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (err instanceof Error) {
          showToast(err.message, 'error');
        } else {
          showToast('Під час розрахунку маршруту сталася неочікувана помилка.', 'error');
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setIsLoading(false);
        }
      }
    },
    [clearToast, showToast]
  );

  return {
    isLoading,
    result,
    lastOptimizedSignature,
    optimize,
    resetResult,
  };
}
