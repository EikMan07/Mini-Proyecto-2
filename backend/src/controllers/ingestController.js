'use strict';

const ingestAgent = require('../agents/ingestAgent');

exports.syncDrive = async (req, res, next) => {
  try {
    const resultado = await ingestAgent.sincronizarDesdeDrive();
    return res.status(200).json({
      mensaje: 'Sincronizacion con Google Drive completada',
      resultado,
    });
  } catch (error) {
    return next(error);
  }
};

exports.syncLocal = async (req, res, next) => {
  try {
    const forzar = Boolean(req.body?.forzar);
    const resultado = await ingestAgent.sincronizarCarpetaLocal(undefined, { forzar });
    return res.status(200).json({
      mensaje: 'Ingesta local de documentos completada',
      resultado,
    });
  } catch (error) {
    return next(error);
  }
};

exports.status = async (req, res, next) => {
  try {
    const estado = await ingestAgent.obtenerEstadoIngesta();
    return res.status(200).json(estado);
  } catch (error) {
    return next(error);
  }
};
