'use strict';

const analystAgent = require('../agents/analystAgent');
const db = require('../models');

exports.obtenerDiario = async (req, res, next) => {
  try {
    const fecha = req.query?.fecha ? String(req.query.fecha) : null;
    const resultado = await analystAgent.obtenerReporteDiario(fecha);
    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
};

exports.ejecutarAhora = async (req, res, next) => {
  try {
    const resultado = await analystAgent.generarReporteDiario();
    return res.status(200).json({
      mensaje: 'Reporte diario de RRHH generado exitosamente',
      ...resultado,
    });
  } catch (error) {
    return next(error);
  }
};

exports.listarTickets = async (req, res, next) => {
  try {
    const estado = req.query?.estado ? String(req.query.estado) : undefined;
    const where = estado ? { estado } : {};

    const tickets = await db.TicketEscalamiento.findAll({
      where,
      include: [
        {
          model: db.Colaborador,
          as: 'colaborador',
          attributes: ['id', 'codigo_empleado', 'nombre', 'email'],
          include: [{ model: db.Departamento, as: 'departamento', attributes: ['nombre'] }],
        },
        {
          model: db.ConsultaChat,
          as: 'consultaChat',
          attributes: ['id', 'tema', 'similitud_maxima', 'fecha'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    return res.status(200).json({
      total: tickets.length,
      tickets: tickets.map((t) => t.toJSON()),
    });
  } catch (error) {
    return next(error);
  }
};
