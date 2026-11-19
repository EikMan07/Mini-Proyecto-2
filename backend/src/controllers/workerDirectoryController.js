'use strict';

const workerDirectoryService = require('../services/workerDirectoryService');

exports.listar = async (req, res, next) => {
  try {
    const { search, departamento, estado, page, limit } = req.query || {};
    const resultado = await workerDirectoryService.listarTrabajadores({
      search,
      departamento,
      estado,
      page,
      limit,
    });
    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
};

exports.detalle = async (req, res, next) => {
  try {
    const resultado = await workerDirectoryService.obtenerDetalleTrabajador(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
};
