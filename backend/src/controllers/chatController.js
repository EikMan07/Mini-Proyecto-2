'use strict';

const orchestrator = require('../agents/orchestrator');
const db = require('../models');

exports.preguntar = async (req, res, next) => {
  try {
    const pregunta = req.body.pregunta || req.body.question;
    const resultado = await orchestrator.procesarConsulta({
      pregunta,
      usuarioAutenticado: req.usuario,
    });

    return res.status(200).json({
      ...resultado,
      agentUsed: resultado.agente,
      latencyMs: resultado.latencia_ms,
      restricted: resultado.intencion === 'restringida',
      outOfScope: resultado.intencion === 'fuera_de_alcance',
    });
  } catch (error) {
    return next(error);
  }
};

exports.historial = async (req, res, next) => {
  try {
    const consultas = await db.ConsultaChat.findAll({
      where: { colaborador_id: req.usuario.id },
      order: [['fecha', 'DESC']],
      limit: 50,
    });

    return res.status(200).json({
      total: consultas.length,
      historial: consultas.map((c) => c.toJSON()),
    });
  } catch (error) {
    return next(error);
  }
};
