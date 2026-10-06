import type { OptimizeRouteRequest, OptimizeRouteResponse, RouteStop } from '../types/route';

interface ValidationRule {
  condition: boolean;
  message: string;
}

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  429: 'Перевищено ліміт запитів до картографічного сервісу. Зачекайте хвилину.',
  502: 'Неможливо зʼєднатися з сервером RouteWise. Переконайтеся, що бекенд запущено на http://localhost:5044.',
  503: 'Сервіс маршрутизації тимчасово недоступний. Спробуйте пізніше.',
  504: 'Сервер не відповідає (Gateway Timeout). Спробуйте ще раз.',
};

function getStopValidationRule(stop: RouteStop, index: number): ValidationRule[] {
  const num = index + 1;
  const isAddressInvalid = stop.address.trim().toLowerCase() === 'string';

  return [
    { condition: !stop.label.trim(), message: `Зупинка #${num}: вкажіть назву.` },
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
  const isTimeInvalid = isArriveBy
    ? !request.arrivalBy || isNaN(new Date(request.arrivalBy).getTime())
    : !request.departureTime || isNaN(new Date(request.departureTime).getTime());

  const globalRules: ValidationRule[] = [
    { condition: !request.start?.label?.trim(), message: 'Вкажіть мітку точки старту.' },
    { condition: !request.start?.address?.trim(), message: 'Вкажіть адресу початку маршруту (Точка А).' },
    { condition: isStartString, message: 'Адреса старту має бути реальною вулицею або закладом.' },
    { condition: !request.destination?.label?.trim(), message: 'Вкажіть мітку точки фінішу.' },
    { condition: !request.destination?.address?.trim(), message: 'Вкажіть адресу призначення (Точка B).' },
    { condition: isDestString, message: 'Адреса фінішу має бути реальною вулицею або закладом.' },
    {
      condition: isTimeInvalid,
      message: isArriveBy
        ? 'Вкажіть коректний бажаний час прибуття (дедлайн).'
        : 'Вкажіть коректний час виїзду.',
    },
    { condition: !request.stops, message: 'Список зупинок має бути заданий.' },
    { condition: !!request.stops && request.stops.length > 10, message: 'Максимум 10 зупинок для одного маршруту.' },
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
      return data.error;
    }
  } catch {
    // Non-JSON responses (e.g. proxy HTML pages on 502/504) fallback to status messages below
  }

  return HTTP_STATUS_MESSAGES[response.status] || `Route optimization failed (HTTP ${response.status}).`;
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
    throw new Error('Network error: Unable to connect to the server. Ensure backend is running on http://localhost:5044.');
  }

  if (response.ok) {
    return (await response.json()) as OptimizeRouteResponse;
  }

  const errorMessage = await parseErrorMessage(response);
  throw new Error(errorMessage);
}
