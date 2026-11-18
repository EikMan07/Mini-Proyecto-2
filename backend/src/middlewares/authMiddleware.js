'use strict';

const jwt = require('jsonwebtoken');
const { getCookieName, setCookieSesion } = require('../utils/cookies');

const EXPIRA = process.env.JWT_EXPIRES_IN || '25m';

function firmarToken(colaborador) {
  const rol = colaborador.rol || colaborador.perfil_acceso || 'colaborador';
  return jwt.sign(
    {
      id: colaborador.id,
      email: colaborador.email,
      nombre: colaborador.nombre,
      rol,
      departamento_id: colaborador.departamento_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: EXPIRA, algorithm: 'HS256' }
  );
}

function authMiddleware(req, res, next) {
  const nombreCookie = getCookieName();
  let token = req.cookies?.[nombreCookie];
  let origenCookie = Boolean(token);

  if (!token) {
    const cabecera = req.headers.authorization || '';
    const [tipo, tokenHeader] = cabecera.split(' ');
    if (tipo === 'Bearer' && tokenHeader) {
      token = tokenHeader;
      origenCookie = false;
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'No has iniciado sesión o la sesión ha expirado.',
      codigo: 'TOKEN_AUSENTE',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.usuario = {
      id: payload.id,
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol || 'colaborador',
      departamento_id: payload.departamento_id,
    };

    if (origenCookie) {
      const nuevoToken = firmarToken(payload);
      setCookieSesion(res, nuevoToken);
    }

    return next();
  } catch (error) {
    const expirado = error.name === 'TokenExpiredError';
    return res.status(401).json({
      error: expirado
        ? 'Tu sesión expiró por inactividad. Inicia sesión de nuevo.'
        : 'Token de sesión inválido o adulterado.',
      codigo: expirado ? 'TOKEN_EXPIRADO' : 'TOKEN_INVALIDO',
    });
  }
}

function soloRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: 'Acceso denegado: no tienes permisos suficientes para esta acción.',
        codigo: 'FORBIDDEN',
      });
    }
    return next();
  };
}

module.exports = authMiddleware;
module.exports.firmarToken = firmarToken;
module.exports.soloRol = soloRol;
