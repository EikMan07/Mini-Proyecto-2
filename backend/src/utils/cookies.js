'use strict';

const DURACION_SESION_MS = 25 * 60 * 1000; // 25 minutos

function getCookieName() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) return '__Host-sid';
  return process.env.COOKIE_NAME || 'sid';
}

function getCookieOptions(maxAgeMs = DURACION_SESION_MS) {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  const secure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : isProd;

  const opciones = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };

  if (typeof maxAgeMs === 'number' && maxAgeMs > 0) {
    opciones.maxAge = maxAgeMs;
  }

  return opciones;
}

function validarConfiguracionCookies() {
  const isProd = process.env.NODE_ENV === 'production';
  const nombre = getCookieName();
  const opciones = getCookieOptions();

  if (isProd && !opciones.secure) {
    throw new Error('[Seguridad Crítica] En NODE_ENV=production la cookie de sesión exige Secure=true.');
  }

  if (opciones.sameSite === 'none' && !opciones.secure) {
    throw new Error('[Seguridad Crítica] SameSite=None exige obligatoriamente Secure=true (RFC 6265bis).');
  }

  if (nombre.startsWith('__Host-') && !opciones.secure) {
    throw new Error('[Seguridad Crítica] El prefijo __Host- exige obligatoriamente Secure=true (WSTG-SESS-02).');
  }

  if (nombre.startsWith('__Secure-') && !opciones.secure) {
    throw new Error('[Seguridad Crítica] El prefijo __Secure- exige obligatoriamente Secure=true.');
  }
}

function setCookieSesion(res, token) {
  const nombre = getCookieName();
  const opciones = getCookieOptions();
  res.cookie(nombre, token, opciones);
}

function clearCookieSesion(res) {
  const nombre = getCookieName();
  const opciones = getCookieOptions(0);
  delete opciones.maxAge;
  res.clearCookie(nombre, opciones);
}

module.exports = {
  DURACION_SESION_MS,
  getCookieName,
  getCookieOptions,
  validarConfiguracionCookies,
  setCookieSesion,
  clearCookieSesion,
};
