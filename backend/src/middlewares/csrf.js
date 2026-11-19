'use strict';

const crypto = require('crypto');

const METODOS_MUTABLES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const VIGENCIA_CSRF_MS = 25 * 60 * 1000;

function esModoApiSinCookie(req) {
  if (process.env.CSRF_STRICT === 'false') {
    return true;
  }
  const auth = req.headers.authorization || '';
  return auth.startsWith('Bearer ');
}

function obtenerOrigenesPermitidos() {
  return new Set(
    [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ].filter(Boolean)
  );
}

function verificarOrigen(req, res, next) {
  if (!METODOS_MUTABLES.has(req.method)) {
    return next();
  }

  if (esModoApiSinCookie(req)) {
    return next();
  }

  const origenesPermitidos = obtenerOrigenesPermitidos();
  if (origenesPermitidos.size === 0) {
    return next();
  }

  const origen = req.headers.origin;
  const referer = req.headers.referer;

  if (origen) {
    if (!origenesPermitidos.has(origen)) {
      return res.status(403).json({
        error: 'Petición bloqueada por seguridad de origen.',
        codigo: 'ORIGEN_NO_PERMITIDO',
      });
    }
    return next();
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (!origenesPermitidos.has(refererUrl.origin)) {
        return res.status(403).json({
          error: 'Petición bloqueada por seguridad de origen (referer).',
          codigo: 'ORIGEN_NO_PERMITIDO',
        });
      }
      return next();
    } catch {
      return res.status(403).json({
        error: 'Cabecera Referer malformada.',
        codigo: 'ORIGEN_NO_PERMITIDO',
      });
    }
  }

  // Permite pruebas locales desde Postman/CLI en desarrollo cuando no viene Origin ni Referer ni cookie
  if (process.env.NODE_ENV !== 'production' && !req.headers.cookie) {
    return next();
  }

  return res.status(403).json({
    error: 'Falta cabecera de origen requerida para métodos mutables.',
    codigo: 'ORIGEN_AUSENTE',
  });
}

function generarTokenCsrf(usuarioId) {
  const secreto = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  if (!secreto) {
    throw new Error('[Seguridad] Se requiere CSRF_SECRET o JWT_SECRET para generar tokens CSRF.');
  }

  const timestamp = Date.now().toString();
  const datos = `${usuarioId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', secreto).update(datos).digest('hex');
  return `${timestamp}.${hmac}`;
}

function verificarCsrf(req, res, next) {
  if (!METODOS_MUTABLES.has(req.method)) {
    return next();
  }

  if (
    req.path === '/login' ||
    req.path === '/registro' ||
    req.path === '/auth/login' ||
    req.path === '/auth/registro'
  ) {
    return next();
  }

  if (esModoApiSinCookie(req)) {
    return next();
  }

  const tokenRecibido = req.headers['x-csrf-token'];
  if (!tokenRecibido || typeof tokenRecibido !== 'string') {
    return res.status(403).json({
      error: 'Falta el token anti-CSRF en la cabecera X-CSRF-Token.',
      codigo: 'CSRF_TOKEN_AUSENTE',
    });
  }

  const partes = tokenRecibido.split('.');
  if (partes.length !== 2) {
    return res.status(403).json({
      error: 'Formato de token anti-CSRF inválido.',
      codigo: 'CSRF_TOKEN_INVALIDO',
    });
  }

  const [timestampStr, hmacRecibido] = partes;
  const timestamp = parseInt(timestampStr, 10);

  if (Number.isNaN(timestamp) || Date.now() - timestamp > VIGENCIA_CSRF_MS || timestamp > Date.now() + 60000) {
    return res.status(403).json({
      error: 'El token anti-CSRF ha expirado. Recarga la página o reanuda sesión.',
      codigo: 'CSRF_TOKEN_EXPIRADO',
    });
  }

  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    return res.status(401).json({
      error: 'No se puede verificar CSRF sin una sesión autenticada válida.',
      codigo: 'TOKEN_AUSENTE',
    });
  }

  const secreto = process.env.CSRF_SECRET || process.env.JWT_SECRET;
  const datos = `${usuarioId}:${timestampStr}`;
  const hmacEsperado = crypto.createHmac('sha256', secreto).update(datos).digest('hex');

  const bufRecibido = Buffer.from(hmacRecibido);
  const bufEsperado = Buffer.from(hmacEsperado);

  if (bufRecibido.length !== bufEsperado.length || !crypto.timingSafeEqual(bufRecibido, bufEsperado)) {
    return res.status(403).json({
      error: 'Token anti-CSRF inválido o adulterado.',
      codigo: 'CSRF_TOKEN_INVALIDO',
    });
  }

  return next();
}

module.exports = {
  verificarOrigen,
  generarTokenCsrf,
  verificarCsrf,
};
