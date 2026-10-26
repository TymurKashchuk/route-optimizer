import { useState } from 'react';
import { reverseGeocode } from '../api/geocodingClient';
import type { AddressInput } from '../types/route';

export function useGeolocation() {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestCurrentLocation = (onSuccess: (location: AddressInput) => void) => {
    if (!navigator.geolocation) {
      setLocationError('Геолокація не підтримується вашим браузером.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const result = await reverseGeocode(latitude, longitude);
          onSuccess({
            label: 'Моє місцезнаходження',
            address: result.address,
            latitude,
            longitude,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Не вдалося визначити адресу за координатами.';
          setLocationError(message);
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setIsLocating(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setLocationError('Доступ до геопозиції відхилено.');
            break;
          case geoError.POSITION_UNAVAILABLE:
            setLocationError('Інформація про місцезнаходження недоступна.');
            break;
          case geoError.TIMEOUT:
            setLocationError('Час очікування геопозиції вичерпано.');
            break;
          default:
            setLocationError('Не вдалося отримати поточне місцезнаходження.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return {
    isLocating,
    locationError,
    setLocationError,
    requestCurrentLocation,
  };
}
