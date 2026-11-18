'use strict';

const requestService = require('../services/requestService');

exports.listar = async (req, res, next) => {
  try {
    const estado = req.query?.estado ? String(req.query.estado) : undefined;
    const solicitudes = await requestService.listarSolicitudes(req.usuario, { estado });
    return res.status(200).json({
      total: solicitudes.length,
      solicitudes,
    });
  } catch (error) {
    return next(error);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const solicitud = await requestService.crearSolicitud(req.usuario.id, req.body);
    return res.status(201).json({
      mensaje: 'Solicitud registrada exitosamente',
      solicitud,
    });
  } catch (error) {
    return next(error);
  }
};

exports.resolver = async (req, res, next) => {
  try {
    const solicitudId = Number(req.params.id);
    const solicitud = await requestService.resolverSolicitud(
      solicitudId,
      req.usuario.id,
      req.body
    );
    return res.status(200).json({
      mensaje: `Solicitud ${solicitud.estado} exitosamente`,
      solicitud,
    });
  } catch (error) {
    return next(error);
  }
};
