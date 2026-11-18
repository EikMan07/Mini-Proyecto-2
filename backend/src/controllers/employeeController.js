'use strict';

const employeeService = require('../services/employeeService');

exports.resumen = async (req, res, next) => {
  try {
    const resumen = await employeeService.obtenerResumenColaborador(req.usuario.id);
    return res.status(200).json(resumen);
  } catch (error) {
    return next(error);
  }
};

exports.checkIn = async (req, res, next) => {
  try {
    const { asistencia, creada } = await employeeService.registrarAsistenciaHoy(
      req.usuario.id,
      req.body
    );
    return res.status(creada ? 201 : 200).json({
      mensaje: creada ? 'Marca de asistencia registrada' : 'Marca de asistencia actualizada',
      asistencia,
    });
  } catch (error) {
    return next(error);
  }
};
