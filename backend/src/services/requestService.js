'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const { ConflictError, NotFoundError, ValidationError } = require('../utils/errors');
const { ETIQUETAS_ESTADO, ETIQUETAS_TIPO } = require('./employeeService');
const { accrueWeeklyDays } = require('./vacationBalanceService');

function obtenerHoyCostaRica() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(new Date());
}

function calcularDiasInclusivos(fechaInicioStr, fechaFinStr) {
  const ini = new Date(`${fechaInicioStr}T00:00:00Z`);
  const fin = new Date(`${fechaFinStr}T00:00:00Z`);
  return Math.floor((fin.getTime() - ini.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return '';
  const d = new Date(`${String(fechaStr).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(fechaStr);
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function enriquecerSolicitud(json) {
  return {
    ...json,
    type: ETIQUETAS_TIPO[json.tipo] || json.tipo,
    startDate: json.fecha_inicio,
    endDate: json.fecha_fin,
    dates: `${formatearFechaCorta(json.fecha_inicio)} → ${formatearFechaCorta(json.fecha_fin)}`,
    days: json.dias_solicitados,
    reason: json.motivo || '',
    motivo_rechazo: json.motivo_rechazo || null,
    rejectionReason: json.motivo_rechazo || null,
    status: ETIQUETAS_ESTADO[json.estado] || json.estado,
    createdAt: 'Ahora',
    person: json.colaborador?.nombre,
    department: json.colaborador?.departamento?.nombre,
  };
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

  return filas.map((f) => enriquecerSolicitud(f.toJSON()));
}

async function crearSolicitud(colaboradorId, datos) {
  const hoyCR = obtenerHoyCostaRica();
  if (datos.fecha_inicio < hoyCR || datos.fecha_fin < hoyCR) {
    throw new ValidationError('No puedes escoger fechas que ya hayan pasado.');
  }

  const traslape = await db.Solicitud.findOne({
    where: {
      colaborador_id: colaboradorId,
      estado: { [Op.in]: ['pendiente', 'aprobada'] },
      fecha_inicio: { [Op.lte]: datos.fecha_fin },
      fecha_fin: { [Op.gte]: datos.fecha_inicio },
    },
  });

  if (traslape) {
    throw new ConflictError(
      `Ya tienes una solicitud ${traslape.estado} que ocupa fechas del ${traslape.fecha_inicio} al ${traslape.fecha_fin}.`
    );
  }

  const diasSolicitados = calcularDiasInclusivos(datos.fecha_inicio, datos.fecha_fin);

  const created = await db.sequelize.transaction(async (transaction) => {
    if (datos.tipo === 'vacaciones') {
      const saldo = await db.SaldoVacaciones.findOne({
        where: { colaborador_id: colaboradorId, periodo: '2026' },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (saldo) await accrueWeeklyDays(saldo, transaction);
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
    }, { transaction });

    return solicitud.toJSON();
  });

  return enriquecerSolicitud(created);
}

async function resolverSolicitud(solicitudId, aprobadorId, datos) {
  return db.sequelize.transaction(async (transaction) => {
    const solicitud = await db.Solicitud.findByPk(solicitudId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!solicitud) {
      throw new NotFoundError('Solicitud');
    }

    if (solicitud.estado !== 'pendiente') {
      throw new ConflictError(`La solicitud ya fue resuelta previamente con estado '${solicitud.estado}'.`);
    }

    const motivoRechazo =
      datos.estado === 'rechazada' ? String(datos.motivo_rechazo || '').trim() : null;
    if (datos.estado === 'rechazada' && (!motivoRechazo || motivoRechazo.length < 5)) {
      throw new ValidationError('Debes indicar el motivo del rechazo de la solicitud.');
    }

    if (datos.estado === 'aprobada' && solicitud.tipo === 'vacaciones') {
      const saldo = await db.SaldoVacaciones.findOne({
        where: { colaborador_id: solicitud.colaborador_id, periodo: '2026' },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (saldo) await accrueWeeklyDays(saldo, transaction);

      if (!saldo || saldo.dias_disponibles < solicitud.dias_solicitados) {
        throw new ValidationError('El colaborador ya no cuenta con dias de vacaciones suficientes.');
      }

      await saldo.update({
        dias_tomados: saldo.dias_tomados + solicitud.dias_solicitados,
        dias_disponibles: saldo.dias_disponibles - solicitud.dias_solicitados,
      }, { transaction });
    }

    await solicitud.update(
      {
        estado: datos.estado,
        aprobador_id: aprobadorId,
        motivo_rechazo: datos.estado === 'aprobada' ? null : motivoRechazo,
      },
      { transaction }
    );

    return enriquecerSolicitud(solicitud.toJSON());
  });
}

module.exports = {
  listarSolicitudes,
  crearSolicitud,
  resolverSolicitud,
};
