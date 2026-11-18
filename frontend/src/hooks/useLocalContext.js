import { useEffect, useMemo, useState } from 'react';
import { getBrowserTimeZone, requestBrowserPosition, reverseGeocode } from '../services/locationService';

const fallbackLocation = { label: 'Ubicación no disponible', timezone: getBrowserTimeZone(), permission: 'unknown' };

export default function useLocalContext() {
  const [now, setNow] = useState(() => new Date());
  const [location, setLocation] = useState(fallbackLocation);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    let isMounted = true;
    requestBrowserPosition().then(async (position) => {
      try {
        const data = await reverseGeocode({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        if (!isMounted) return;
        const label = [data.city || data.locality, data.principalSubdivision, data.countryName].filter(Boolean).join(', ');
        setLocation({ label: label || 'Ubicación detectada', timezone: data.timezone?.ianaTimeId || getBrowserTimeZone(), permission: 'granted' });
      } catch {
        if (isMounted) setLocation((current) => ({ ...current, permission: 'limited' }));
      }
    }).catch(() => {
      if (isMounted) setLocation((current) => ({ ...current, permission: 'denied' }));
    });
    return () => { isMounted = false; };
  }, []);

  const formatted = useMemo(() => {
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: location.timezone };
    return {
      time: new Intl.DateTimeFormat('es-CR', options).format(now),
      date: new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: location.timezone }).format(now),
    };
  }, [location.timezone, now]);

  return { ...formatted, location };
}

