'use strict';

const { Op } = require('sequelize');
const db = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');

const HORA_BASE_ENTRADA_MIN = 8 * 60 + 5; // 08:05
const HORA_BASE_SALIDA_MIN = 17 * 60; // 17:00

function parsearHoraAMinutos(horaStr) {
  if (!horaStr) return null;
  const match = String(horaStr).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function formatearHoraCorta(horaStr) {
  if (!horaStr) return null;
  const match = String(horaStr).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(horaStr);
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function esLlegadaTarde(horaEntrada) {
  const min = parsearHoraAMinutos(horaEntrada);
  return min !== null && min > HORA_BASE_ENTRADA_MIN;
}

function esSalidaTemprana(horaSalida) {
  const min = parsearHoraAMinutos(horaSalida);
  return min !== null && min < HORA_BASE_SALIDA_MIN;
}

function calcularHorasExtraDia(horaSalida) {
  const min = parsearHoraAMinutos(horaSalida);
  if (min === null || min <= HORA_BASE_SALIDA_MIN) return 0;
  return Number(((min - HORA_BASE_SALIDA_MIN) / 60).toFixed(1));
}

function evaluarNumeroSeguro(valor) {
  return valor !== undefined && valor !== null ? Number(valor) : 0;
}

function agregarMetricasPorColaborador(asistencias, incapacidades) {
  const metricasAsist = new Map();
  for (const a of asistencias) {
    const colabId = a.colaborador_id;
    let entry = metricasAsist.get(colabId);
    if (!entry) {
      entry = {
        ultima_hora_entrada: formatearHoraCorta(a.hora_entrada),
        ultima_hora_salida: formatearHoraCorta(a.hora_salida),
        horas_extra_total: 0,
        dias_llegada_tarde: 0,
        dias_salida_temprana: 0,
      };
      metricasAsist.set(colabId, entry);
    } else {
      if (!entry.ultima_hora_entrada && a.hora_entrada) {
        entry.ultima_hora_entrada = formatearHoraCorta(a.hora_entrada);
      }
      if (!entry.ultima_hora_salida && a.hora_salida) {
        entry.ultima_hora_salida = formatearHoraCorta(a.hora_salida);
      }
    }

    if (esLlegadaTarde(a.hora_entrada)) entry.dias_llegada_tarde += 1;
    if (esSalidaTemprana(a.hora_salida)) entry.dias_salida_temprana += 1;
    entry.horas_extra_total = Number(
      (entry.horas_extra_total + calcularHorasExtraDia(a.hora_salida)).toFixed(1)
    );
  }

  const metricasInc = new Map();
  for (const inc of incapacidades) {
    const colabId = inc.colaborador_id;
    const acumulado = metricasInc.get(colabId) ?? 0;
    metricasInc.set(colabId, acumulado + evaluarNumeroSeguro(inc.dias));
  }

  return { metricasAsist, metricasInc };
}

function mapearTrabajadorResumen(colaboradorJson, saldo2026, asistInfo, diasIncapacidad) {
  const disponibles = evaluarNumeroSeguro(saldo2026?.dias_disponibles);
  const tomados = evaluarNumeroSeguro(saldo2026?.dias_tomados);

  return {
    id: colaboradorJson.id,
    codigo_empleado: colaboradorJson.codigo_empleado,
    cedula: colaboradorJson.cedula || null,
    nombre: colaboradorJson.nombre,
    apellidos: colaboradorJson.apellidos || null,
    email: colaboradorJson.email,
    telefono: colaboradorJson.telefono || null,
    fecha_nacimiento: colaboradorJson.fecha_nacimiento || null,
    provincia: colaboradorJson.provincia || null,
    canton: colaboradorJson.canton || null,
    distrito: colaboradorJson.distrito || null,
    direccion_exacta: colaboradorJson.direccion_exacta || null,
    departamento: colaboradorJson.departamento?.nombre || 'Sin departamento',
    departamento_id: colaboradorJson.departamento_id,
    puesto: colaboradorJson.puesto,
    fecha_ingreso: colaboradorJson.fecha_ingreso,
    estado: colaboradorJson.estado,
    rol: colaboradorJson.rol || colaboradorJson.perfil_acceso || 'colaborador',
    ultima_hora_entrada: asistInfo?.ultima_hora_entrada || null,
    ultima_hora_salida: asistInfo?.ultima_hora_salida || null,
    dias_incapacidad: evaluarNumeroSeguro(diasIncapacidad),
    dias_libres_tomados: tomados,
    dias_libres_acumulados: disponibles,
    horas_extra_total: evaluarNumeroSeguro(asistInfo?.horas_extra_total),
    dias_llegada_tarde: evaluarNumeroSeguro(asistInfo?.dias_llegada_tarde),
    dias_salida_temprana: evaluarNumeroSeguro(asistInfo?.dias_salida_temprana),
  };
}

async function listarTrabajadores({
  search = '',
  departamento = '',
  estado = '',
  page = 1,
  limit = 25,
} = {}) {
  const paginaSegura = Math.max(1, Number(page) || 1);
  const limiteSeguro = Math.min(100, Math.max(1, Number(limit) || 25));

  const where = {};
  const busquedaLimpia = String(search || '').trim();
  if (busquedaLimpia) {
    const patron = `%${busquedaLimpia}%`;
    where[Op.or] = [
      { nombre: { [Op.iLike]: patron } },
      { apellidos: { [Op.iLike]: patron } },
      { cedula: { [Op.iLike]: patron } },
      { email: { [Op.iLike]: patron } },
      { telefono: { [Op.iLike]: patron } },
      { provincia: { [Op.iLike]: patron } },
      { canton: { [Op.iLike]: patron } },
      { codigo_empleado: { [Op.iLike]: patron } },
      { puesto: { [Op.iLike]: patron } },
    ];
  }

  const estadoLimpio = String(estado || '').trim();
  if (estadoLimpio && estadoLimpio !== 'todos') {
    where.estado = estadoLimpio;
  }

  const deptoInclude = {
    model: db.Departamento,
    as: 'departamento',
    attributes: ['id', 'codigo', 'nombre'],
  };
  const deptoLimpio = String(departamento || '').trim();
  if (deptoLimpio && deptoLimpio !== 'todos') {
    if (/^\d+$/.test(deptoLimpio)) {
      where.departamento_id = Number(deptoLimpio);
    } else {
      deptoInclude.where = {
        [Op.or]: [
          { nombre: { [Op.iLike]: deptoLimpio } },
          { codigo: { [Op.iLike]: deptoLimpio } },
        ],
      };
      deptoInclude.required = true;
    }
  }

  const [
    departamentosLista,
    todosSaldos,
    todasAsistencias,
    todasIncapacidades,
    { count, rows },
  ] = await Promise.all([
    db.Departamento.findAll({
      attributes: ['id', 'codigo', 'nombre'],
      order: [['nombre', 'ASC']],
    }),
    db.SaldoVacaciones.findAll({
      where: { periodo: '2026' },
      attributes: ['colaborador_id', 'dias_disponibles', 'dias_tomados'],
    }),
    db.Asistencia.findAll({
      attributes: ['colaborador_id', 'fecha', 'hora_entrada', 'hora_salida'],
      order: [['fecha', 'DESC'], ['id', 'DESC']],
    }),
    db.Incapacidad.findAll({
      attributes: ['colaborador_id', 'dias'],
    }),
    db.Colaborador.findAndCountAll({
      where,
      include: [
        deptoInclude,
        {
          model: db.SaldoVacaciones,
          as: 'saldosVacaciones',
          where: { periodo: '2026' },
          required: false,
          attributes: ['dias_disponibles', 'dias_tomados'],
        },
      ],
      order: [['id', 'ASC']],
      limit: limiteSeguro,
      offset: (paginaSegura - 1) * limiteSeguro,
      distinct: true,
    }),
  ]);

  const { metricasAsist, metricasInc } = agregarMetricasPorColaborador(
    todasAsistencias,
    todasIncapacidades
  );

  const totalTrabajadores = await db.Colaborador.count();
  let conRiesgoPasivo20 = 0;
  for (const s of todosSaldos) {
    if (evaluarNumeroSeguro(s.dias_disponibles) > 20) conRiesgoPasivo20 += 1;
  }
  let totalIncapacidades = 0;
  for (const d of metricasInc.values()) {
    totalIncapacidades += d;
  }
  let totalLlegadasTarde = 0;
  let totalSalidasTempranas = 0;
  let totalHorasExtra = 0;
  for (const m of metricasAsist.values()) {
    totalLlegadasTarde += m.dias_llegada_tarde;
    totalSalidasTempranas += m.dias_salida_temprana;
    totalHorasExtra += m.horas_extra_total;
  }

  const trabajadores = rows.map((row) => {
    const json = row.toJSON();
    const saldo2026 = Array.isArray(json.saldosVacaciones) ? json.saldosVacaciones[0] : null;
    const asistInfo = metricasAsist.get(json.id);
    const diasInc = metricasInc.get(json.id) ?? 0;
    return mapearTrabajadorResumen(json, saldo2026, asistInfo, diasInc);
  });

  const totalPages = Math.max(1, Math.ceil(count / limiteSeguro));

  return {
    total: count,
    page: paginaSegura,
    limit: limiteSeguro,
    totalPages,
    departamentos: departamentosLista.map((d) => d.toJSON()),
    resumenGlobal: {
      totalTrabajadores,
      conRiesgoPasivo20,
      totalIncapacidades,
      totalLlegadasTarde,
      totalSalidasTempranas,
      totalHorasExtra: Number(totalHorasExtra.toFixed(1)),
    },
    trabajadores,
  };
}

async function obtenerDetalleTrabajador(idRaw) {
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('El identificador del trabajador debe ser un entero positivo.');
  }

  const colaborador = await db.Colaborador.findByPk(id, {
    include: [
      { model: db.Departamento, as: 'departamento', attributes: ['id', 'codigo', 'nombre'] },
      {
        model: db.SaldoVacaciones,
        as: 'saldosVacaciones',
        where: { periodo: '2026' },
        required: false,
      },
    ],
  });

  if (!colaborador) {
    throw new NotFoundError('Trabajador');
  }

  const [asistencias, incapacidades, solicitudes] = await Promise.all([
    db.Asistencia.findAll({
      where: { colaborador_id: id },
      order: [['fecha', 'DESC'], ['id', 'DESC']],
      limit: 30,
    }),
    db.Incapacidad.findAll({
      where: { colaborador_id: id },
      order: [['fecha_inicio', 'DESC']],
      limit: 20,
    }),
    db.Solicitud.findAll({
      where: { colaborador_id: id },
      order: [['creada_en', 'DESC']],
      limit: 20,
    }),
  ]);

  const json = colaborador.toJSON();
  const saldo2026 = Array.isArray(json.saldosVacaciones) ? json.saldosVacaciones[0] : null;
  const { metricasAsist, metricasInc } = agregarMetricasPorColaborador(
    asistencias,
    incapacidades
  );
  const ficha = mapearTrabajadorResumen(
    json,
    saldo2026,
    metricasAsist.get(id),
    metricasInc.get(id) ?? 0
  );

  const historialAsistencias = asistencias.map((a) => {
    const item = a.toJSON();
    return {
      id: item.id,
      fecha: item.fecha,
      hora_entrada: formatearHoraCorta(item.hora_entrada),
      hora_salida: formatearHoraCorta(item.hora_salida),
      modalidad: item.modalidad,
      estado: item.estado,
      observacion: item.observacion || null,
      llego_tarde: esLlegadaTarde(item.hora_entrada),
      salio_temprano: esSalidaTemprana(item.hora_salida),
      horas_extra: calcularHorasExtraDia(item.hora_salida),
    };
  });

  return {
    trabajador: ficha,
    resumen: {
      dias_incapacidad: ficha.dias_incapacidad,
      dias_libres_tomados: ficha.dias_libres_tomados,
      dias_libres_acumulados: ficha.dias_libres_acumulados,
      horas_extra_total: ficha.horas_extra_total,
      dias_llegada_tarde: ficha.dias_llegada_tarde,
      dias_salida_temprana: ficha.dias_salida_temprana,
    },
    asistencias: historialAsistencias,
    incapacidades: incapacidades.map((inc) => inc.toJSON()),
    solicitudes: solicitudes.map((s) => s.toJSON()),
  };
}

module.exports = {
  listarTrabajadores,
  obtenerDetalleTrabajador,
};
