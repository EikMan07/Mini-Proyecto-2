'use strict';

const db = require('../models');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');

function calcularDiasInclusivos(fechaInicioStr, fechaFinStr) {
  const ini = new Date(`${fechaInicioStr}T00:00:00Z`);
  const fin = new Date(`${fechaFinStr}T00:00:00Z`);
  return Math.floor((fin.getTime() - ini.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

async function listarSolicitudes(usuarioAutenticado, { estado } = {}) {
  const where = {};
  if (usuarioAutenticado.rol !== 'rrhh') {
    where.colaborador_id = usuarioAutenticado.id;
  }
  if (estado) {
    where.estado = estado;
  }

  const filas = await db.Solicitud.findAll({
    where,
    include: [
      {
        model: db.Colaborador,
        as: 'colaborador',
        attributes: ['id', 'codigo_empleado', 'nombre', 'email', 'puesto'],
        include: [
          { model: db.Departamento, as: 'departamento', attributes: ['id', 'codigo', 'nombre'] },
        ],
      },
      {
        model: db.Colaborador,
        as: 'aprobador',
        attributes: ['id', 'nombre', 'email'],
      },
    ],
    order: [['creada_en', 'DESC']],
    limit: 100,
  });

  return filas.map((f) => f.toJSON());
}

async function crearSolicitud(colaboradorId, datos) {
  const diasSolicitados = calcularDiasInclusivos(datos.fecha_inicio, datos.fecha_fin);

  if (datos.tipo === 'vacaciones') {
    const saldo = await db.SaldoVacaciones.findOne({
      where: { colaborador_id: colaboradorId, periodo: '2026' },
    });
    if (!saldo || saldo.dias_disponibles < diasSolicitados) {
      throw new ValidationError(
        `Saldo insuficiente de vacaciones para 2026 (disponibles: ${saldo ? saldo.dias_disponibles : 0}, solicitados: ${diasSolicitados}).`
      );
    }
  }

  const solicitud = await db.Solicitud.create({
    colaborador_id: colaboradorId,
    tipo: datos.tipo,
    fecha_inicio: datos.fecha_inicio,
    fecha_fin: datos.fecha_fin,
    dias_solicitados: diasSolicitados,
    motivo: datos.motivo || null,
    estado: 'pendiente',
    aprobador_id: null,
    creada_en: new Date(),
  });

  return solicitud.toJSON();
}

async function resolverSolicitud(solicitudId, aprobadorId, datos) {
  return db.sequelize.transaction(async (transaction) => {
    const solicitud = await db.Solicitud.findByPk(solicitudId, { transaction });
    if (!solicitud) {
      throw new NotFoundError('Solicitud');
    }

    if (solicitud.estado !== 'pendiente') {
      throw new ConflictError(`La solicitud ya fue resuelta previamente con estado '${solicitud.estado}'.`);
    }

    if (datos.estado === 'aprobada' && solicitud.tipo === 'vacaciones') {
      const saldo = await db.SaldoVacaciones.findOne({
        where: { colaborador_id: solicitud.colaborador_id, periodo: '2026' },
        transaction,
      });

      if (!saldo || saldo.dias_disponibles < solicitud.dias_solicitados) {
        throw new ValidationError('El colaborador ya no cuenta con dias de vacaciones suficientes.');
      }

      await saldo.update(
        {
          dias_tomados: saldo.dias_tomados + solicitud.dias_solicitados,
          dias_disponibles: saldo.dias_disponibles - solicitud.dias_solicitados,
        },
        { transaction }
      );
    }

    await solicitud.update(
      {
        estado: datos.estado,
        aprobador_id: aprobadorId,
      },
      { transaction }
    );

    return solicitud.toJSON();
  });
}

module.exports = {
  listarSolicitudes,
  crearSolicitud,
  resolverSolicitud,
};
