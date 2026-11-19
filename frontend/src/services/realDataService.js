import { api } from './api';

const IDENTITY_API_URL = import.meta.env.VITE_IDENTITY_API_URL || 'https://apis.gometa.org/cedulas';
const HOLIDAYS_URL = 'https://date.nager.at/api/v4/Holidays';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

async function getJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('No fue posible completar la consulta.');
  return response.json();
}

export function normalizeCedula(value) {
  return value.replace(/\D/g, '');
}

export async function verifyCostaRicaId(value) {
  const cedula = normalizeCedula(value);
  if (cedula.length !== 9) throw new Error('La cédula debe tener 9 dígitos.');
  const data = await getJson(`${IDENTITY_API_URL}/${cedula}`);
  const match = Array.isArray(data) ? data[0] : data;
  if (!match) throw new Error('No encontramos esa cédula en el padrón consultado.');
  return { cedula, name: match.name || match.nombre || '', raw: match };
}

export async function searchCostaRicaPlace(query) {
  const params = new URLSearchParams({ name: query, count: '5', language: 'es', format: 'json' });
  const data = await getJson(`${GEOCODING_URL}?${params.toString()}`);
  return (data.results || []).filter((place) => place.country_code === 'cr');
}

export async function getCostaRicaHolidays(year = new Date().getFullYear()) {
  return getJson(`${HOLIDAYS_URL}/CR/${year}`);
}

export async function registerWorker(payload) {
  return api.register(payload);
}

export const officialLaborDocuments = [
  {
    title: 'Código de Trabajo de Costa Rica',
    description: 'Derechos, obligaciones, jornadas, vacaciones, salarios y terminación laboral.',
    url: 'https://www.mtss.go.cr/elministerio/marco-legal/documentos/codigo_trabajo_cr.pdf',
    source: 'MTSS · PDF oficial',
  },
  {
    title: 'Temas laborales y preguntas frecuentes',
    description: 'Guía oficial sobre vacaciones, feriados, jornada, aguinaldo y derechos laborales.',
    url: 'https://www.mtss.go.cr/temas-laborales/index.html',
    source: 'MTSS · Información laboral',
  },
  {
    title: 'Perfil de la persona trabajadora',
    description: 'Portal oficial con derechos, deberes, trámites y documentos para trabajadores.',
    url: 'https://www.mtss.go.cr/perfiles/trabajador.html',
    source: 'MTSS · Portal ciudadano',
  },
  {
    title: 'Catálogo de trámites laborales',
    description: 'Servicios de asesoría, cálculo de derechos y orientación para conflictos laborales.',
    url: 'https://www.mtss.go.cr/tramites-servicios/catalogo-tramites/',
    source: 'MTSS · Servicios',
  },
];
