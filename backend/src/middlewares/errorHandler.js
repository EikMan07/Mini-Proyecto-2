'use strict';

const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.code,
      message: err.message,
      ...(err.detalles ? { detalles: err.detalles } : {}),
    });
  }

  if (err?.name === 'ZodError') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Datos de entrada inválidos',
      detalles: err.issues?.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      })),
    });
  }

  if (err?.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Error de validación en los datos',
      detalles: err.errors?.map((e) => ({
        campo: e.path,
        mensaje: e.message,
      })),
    });
  }

  if (err?.name === 'SequelizeUniqueConstraintError' || err?.code === '23505') {
    return res.status(409).json({
      error: 'DUPLICADO',
      message: 'El registro ya existe en el sistema.',
    });
  }

  if (err?.name === 'SequelizeForeignKeyConstraintError' || err?.code === '23503') {
    return res.status(400).json({
      error: 'REFERENCIA_INVALIDA',
      message: 'El registro referenciado no existe.',
    });
  }

  if (err?.name === 'MulterError') {
    const mensaje =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño máximo permitido de 5 MB.'
        : 'No se pudo procesar el archivo adjunto.';
    return res.status(400).json({
      error: 'UPLOAD_ERROR',
      message: mensaje,
    });
  }

  console.error('[Error 500 Inesperado]:', err);

  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Ocurrió un inconveniente interno en el servidor.',
  });
}

module.exports = errorHandler;
