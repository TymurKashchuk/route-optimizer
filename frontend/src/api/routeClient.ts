import type { OptimizeRouteRequest, OptimizeRouteResponse, RouteStop, TravelMode } from '../types/route';
import { getTodayDateString } from '../utils/dateTime';
import { deriveStopLabel } from '../utils/address';

interface ValidationRule {
  condition: boolean;
  message: string;
}

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  429: 'Перевищено ліміт запитів до картографічного сервісу. Зачекайте хвилину.',
  502: 'Неможливо зʼєднатися з сервером RouteWise. Переконайтеся, що бекенд-сервіс працює.',
  503: 'Сервіс маршрутизації тимчасово недоступний. Спробуйте пізніше.',
  504: 'Сервер не відповідає (Gateway Timeout). Спробуйте ще раз.',
};

function getStopValidationRule(stop: RouteStop, index: number): ValidationRule[] {
  const num = index + 1;
  const isAddressInvalid = stop.address.trim().toLowerCase() === 'string';

  return [
    { condition: !stop.address.trim(), message: `Зупинка #${num}: вкажіть адресу.` },
    { condition: isAddressInvalid, message: `Зупинка #${num}: адреса має бути реальною назвою або вулицею.` },
    { condition: stop.serviceMinutes < 0 || stop.serviceMinutes > 480, message: `Зупинка #${num}: час має бути від 0 до 480 хв.` },
  ];
}

/**
 * Validates route optimization parameters using declarative rules.
 */
export function validateRouteRequest(request: OptimizeRouteRequest): string | null {
  const isStartString = request.start?.address?.trim().toLowerCase() === 'string';
  const isDestString = request.destination?.address?.trim().toLowerCase() === 'string';
  const isArriveBy = request.planningMode === 'arrive-by';
  const targetDateStr = isArriveBy ? request.arrivalBy : request.departureTime;
  const isTimeInvalid = isArriveBy
    ? !request.arrivalBy || isNaN(new Date(request.arrivalBy).getTime())
    : !request.departureTime || isNaN(new Date(request.departureTime).getTime());

  const todayStr = getTodayDateString();
  const datePart = targetDateStr ? targetDateStr.split('T')[0] : '';
  const isPastDate = Boolean(datePart && datePart < todayStr);
  const targetTimestamp = targetDateStr ? new Date(targetDateStr).getTime() : NaN;
  const isPastDateTime = !isNaN(targetTimestamp) && targetTimestamp < Date.now() - 2 * 60 * 1000;

  const globalRules: ValidationRule[] = [
    { condition: !request.start?.address?.trim(), message: 'Вкажіть адресу початку маршруту (Точка А).' },
    { condition: isStartString, message: 'Адреса старту має бути реальною вулицею або закладом.' },
    { condition: !request.destination?.address?.trim(), message: 'Вкажіть адресу призначення (Точка B).' },
    { condition: isDestString, message: 'Адреса фінішу має бути реальною вулицею або закладом.' },
    {
      condition: isTimeInvalid,
      message: isArriveBy
        ? 'Вкажіть коректний бажаний час прибуття (дедлайн).'
        : 'Вкажіть коректний час виїзду.',
    },
    {
      condition: isPastDate,
      message: 'Дата поїздки не може бути в минулому.',
    },
    {
      condition: !isPastDate && isPastDateTime,
      message: isArriveBy
        ? 'Бажаний час прибуття вже минув. Оберіть час у майбутньому.'
        : 'Час виїзду не може бути в минулому. Оберіть час у майбутньому.',
    },
    { condition: !request.stops, message: 'Список зупинок має бути заданий.' },
    { condition: !!request.stops && request.stops.length > 10, message: 'Максимум 10 зупинок для одного маршруту.' },
    {
      condition: Boolean(request.travelMode && !(['driving', 'walking', 'cycling'] as TravelMode[]).includes(request.travelMode)),
      message: 'Некоректний спосіб пересування (доступні: авто, пішки, велосипед).',
    },
  ];

  const failedGlobalRule = globalRules.find((rule) => rule.condition);
  if (failedGlobalRule) return failedGlobalRule.message;

  for (let i = 0; i < request.stops.length; i++) {
    const failedStopRule = getStopValidationRule(request.stops[i], i).find((rule) => rule.condition);
    if (failedStopRule) return failedStopRule.message;
  }

  return null;
}

/**
 * Extracts error details from API response or maps to known status messages.
 */
async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (data?.errors && typeof data.errors === 'object') {
      const messages = Object.values(data.errors).flat() as string[];
      if (messages.length > 0) return messages.join(' ');
    }

    if (data?.error && typeof data.error === 'string') {
      if (
        data.error.includes('Access to OpenRouteService is forbidden') ||
        data.error.includes('Invalid or unauthorized OpenRouteService API key')
      ) {
        return 'Помилка доступу до сервісу маршрутизації OpenRouteService (недійсний або заблокований API-ключ). Виправте ключ або видаліть його для роботи в локальному тестовому режимі.';
      }
      return data.error;
    }
  } catch {
    // Non-JSON responses (e.g. proxy HTML pages on 502/504) fallback to status messages below
  }

  return HTTP_STATUS_MESSAGES[response.status] || `Не вдалося розрахувати маршрут (HTTP ${response.status}).`;
}

/**
 * Sends route optimization request to backend API.
 */
export async function optimizeRoute(
  request: OptimizeRouteRequest,
  signal?: AbortSignal
): Promise<OptimizeRouteResponse> {
  const validationError = validateRouteRequest(request);
  if (validationError) {
    throw new Error(validationError);
  }

  const isArriveBy = request.planningMode === 'arrive-by';
  const formattedRequest: OptimizeRouteRequest = {
    ...request,
    planningMode: request.planningMode || 'depart-at',
    travelMode: request.travelMode || 'driving',
    start: {
      ...request.start,
      label: (request.start?.label && request.start.label.trim().length >= 3)
        ? request.start.label.trim()
        : deriveStopLabel(request.start?.address || '', 'Старт'),
    },
    destination: {
      ...request.destination,
      label: (request.destination?.label && request.destination.label.trim().length >= 3)
        ? request.destination.label.trim()
        : deriveStopLabel(request.destination?.address || '', 'Фініш'),
    },
    stops: (request.stops || []).map((s, idx) => ({
      ...s,
      label: (s.label && s.label.trim().length >= 3)
        ? s.label.trim()
        : deriveStopLabel(s.address, `Зупинка ${idx + 1}`),
    })),
    departureTime: !isArriveBy && request.departureTime ? new Date(request.departureTime).toISOString() : undefined,
    arrivalBy: isArriveBy && request.arrivalBy ? new Date(request.arrivalBy).toISOString() : undefined,
  };

  let response: Response;
  try {
    response = await fetch('/api/routes/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedRequest),
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Помилка мережі: не вдалося зʼєднатися з сервером. Переконайтеся, що бекенд-сервіс працює.');
  }

  if (response.ok) {
    return (await response.json()) as OptimizeRouteResponse;
  }

  const errorMessage = await parseErrorMessage(response);
  throw new Error(errorMessage);
}
