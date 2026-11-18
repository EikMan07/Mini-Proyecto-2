const REVERSE_GEOCODE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';

export async function reverseGeocode({ latitude, longitude }) {
  const params = new URLSearchParams({ latitude, longitude, localityLanguage: 'es' });
  const response = await fetch(`${REVERSE_GEOCODE_URL}?${params.toString()}`);
  if (!response.ok) throw new Error('No fue posible resolver la ubicación.');
  return response.json();
}

export function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function requestBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Este navegador no permite obtener la ubicación.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000,
    });
  });
}

