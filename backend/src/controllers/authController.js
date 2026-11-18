'use strict';

const authService = require('../services/authService');
const { firmarToken } = require('../middlewares/authMiddleware');
const { setCookieSesion, clearCookieSesion } = require('../utils/cookies');
const { generarTokenCsrf } = require('../middlewares/csrf');

exports.registro = async (req, res, next) => {
  try {
    const colaborador = await authService.registrarColaborador(req.body);
    const colaboradorFormateado = colaborador.toJSON();
    const firma = firmarToken(colaboradorFormateado);

    setCookieSesion(res, firma);
    const csrfToken = generarTokenCsrf(colaboradorFormateado.id);

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: colaboradorFormateado,
      csrfToken,
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const colaborador = await authService.autenticarColaborador(email, password);
    const colaboradorFormateado = colaborador.toJSON();
    const firma = firmarToken(colaboradorFormateado);

    setCookieSesion(res, firma);
    const csrfToken = generarTokenCsrf(colaboradorFormateado.id);

    return res.status(200).json({
      mensaje: 'Inicio de sesion exitoso',
      usuario: colaboradorFormateado,
      csrfToken,
    });
  } catch (error) {
    return next(error);
  }
};

exports.yo = async (req, res, next) => {
  try {
    const colaborador = await authService.obtenerColaboradorPorId(req.usuario.id);
    if (!colaborador) {
      clearCookieSesion(res);
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Usuario no encontrado' });
    }

    const colaboradorFormateado = colaborador.toJSON();
    const csrfToken = generarTokenCsrf(colaboradorFormateado.id);

    return res.status(200).json({
      usuario: colaboradorFormateado,
      csrfToken,
    });
  } catch (error) {
    if (error.status === 404) {
      clearCookieSesion(res);
    }
    return next(error);
  }
};

exports.logout = (req, res) => {
  clearCookieSesion(res);
  return res.status(200).json({
    mensaje: 'Sesion cerrada exitosamente',
  });
};

exports.usuariosDemo = async (req, res, next) => {
  try {
    const usuarios = await authService.obtenerUsuariosDemo();
    return res.status(200).json({
      password_prueba: 'DemoRRHH2026!',
      usuarios,
    });
  } catch (error) {
    return next(error);
  }
};
