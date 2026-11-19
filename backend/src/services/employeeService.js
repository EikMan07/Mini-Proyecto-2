'use strict';

const db = require('../models');
const { obtenerDatosPersonales } = require('../agents/dataAgent');
const { ValidationError } = require('../utils/errors');

const ETIQUETAS_TIPO = {
  vacaciones: 'Vacaciones',
  permiso_con_goce: 'Permiso personal',
  permiso_sin_goce: 'Permiso sin goce',
  licencia_duelo: 'Licencia de duelo',
  licencia_paternidad: 'Licencia de paternidad',
  estudio: 'Permiso de estudio',
};

const ETIQUETAS_ESTADO = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

function formatearHoraCorta(horaStr) {
  if (!horaStr) return null;
  const partes = String(horaStr).split(':');
  if (partes.length >= 2) {
    return `${partes[0]}:${partes[1]}`;
  }
  return String(horaStr);
}

function construirAttendanceToday(asistenciaHoy) {
  if (!asistenciaHoy) {
    return { status: 'pendiente', checkedAt: null, checkedOutAt: null };
  }
  const checkedAt = formatearHoraCorta(asistenciaHoy.hora_entrada);
  const checkedOutAt = formatearHoraCorta(asistenciaHoy.hora_salida);
  let status = 'pendiente';
  if (checkedOutAt) {
    status = 'cerrada';
  } else if (checkedAt || asistenciaHoy.estado === 'presente') {
    status = 'registrada';
  }
  return { status, checkedAt, checkedOutAt };
}

function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return '';
  const d = new Date(`${String(fechaStr).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(fechaStr);
  return d.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatearTiempoRelativo(fecha) {
  if (!fecha) return 'Reciente';
  const ms = Date.now() - new Date(fecha).getTime();
  const dias = Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Hace 1 día';
  return `Hace ${dias} días`;
}

async function obtenerResumenColaborador(colaboradorId) {
  const base = await obtenerDatosPersonales(colaboradorId);
  const hoyStr = new Date().toISOString().slice(0, 10);

  const asistenciaHoy = await db.Asistencia.findOne({
    where: { colaborador_id: colaboradorId, fecha: hoyStr },
  });

  const saldo = base.saldo_vacaciones_2026?.dias_disponibles;
  const vacationBalance = saldo !== undefined && saldo !== null ? Number(saldo) : 0;

  const requests = (base.solicitudes_recientes || []).map((s) => ({
    id: s.id,
    type: ETIQUETAS_TIPO[s.tipo] || s.tipo,
    dates: `${formatearFechaCorta(s.fecha_inicio)} → ${formatearFechaCorta(s.fecha_fin)}`,
    startDate: s.fecha_inicio,
    endDate: s.fecha_fin,
    days: s.dias_solicitados,
    reason: s.motivo || '',
    motivo_rechazo: s.motivo_rechazo || null,
    rejectionReason: s.motivo_rechazo || null,
    status: ETIQUETAS_ESTADO[s.estado] || s.estado,
    createdAt: formatearTiempoRelativo(s.creada_en),
  }));

  return {
    ...base,
    vacationBalance,
    attendanceToday: construirAttendanceToday(asistenciaHoy),
    requests,
  };
}

async function registrarAsistenciaHoy(colaboradorId, datos = {}) {
  const ahora = new Date();
  const hoyStr = ahora.toISOString().slice(0, 10);
  const horaActual = ahora.toTimeString().slice(0, 8);

  const existente = await db.Asistencia.findOne({
    where: {
      colaborador_id: colaboradorId,
      fecha: hoyStr,
    },
  });

  const estado = datos.estado || 'presente';
  const modalidad = datos.modalidad || 'presencial';

  const payload = {
    colaborador_id: colaboradorId,
    fecha: hoyStr,
    hora_entrada: existente?.hora_entrada || (estado === 'presente' ? horaActual : null),
    modalidad,
    estado,
    comprobante_url: datos.comprobante_url || null,
    entidad_comprobante: datos.entidad_comprobante || null,
    observacion: datos.observacion || null,
  };

  let registro;
  let creada = false;
  if (existente) {
    registro = await existente.update(payload);
  } else {
    registro = await db.Asistencia.create(payload);
    creada = true;
  }

  return {
    asistencia: registro.toJSON(),
    attendanceToday: construirAttendanceToday(registro),
    creada,
  };
}

async function registrarSalidaHoy(colaboradorId) {
  const ahora = new Date();
  const hoyStr = ahora.toISOString().slice(0, 10);
  const horaActual = ahora.toTimeString().slice(0, 8);

  const existente = await db.Asistencia.findOne({
    where: {
      colaborador_id: colaboradorId,
      fecha: hoyStr,
    },
  });

  if (!existente || !existente.hora_entrada) {
    throw new ValidationError('Debes marcar entrada hoy antes de registrar tu salida.');
  }

  const actualizada = await existente.update({
    hora_salida: horaActual,
  });

  return {
    asistencia: actualizada.toJSON(),
    attendanceToday: construirAttendanceToday(actualizada),
  };
}

module.exports = {
  obtenerResumenColaborador,
  registrarAsistenciaHoy,
  registrarSalidaHoy,
  construirAttendanceToday,
  ETIQUETAS_TIPO,
  ETIQUETAS_ESTADO,
};
