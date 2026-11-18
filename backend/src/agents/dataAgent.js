'use strict';

const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const db = require('../models');
const { generarConGemini } = require('../services/llmService');
const { accrueWeeklyDays } = require('../services/vacationBalanceService');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

const PROMPT_PATH = path.resolve(__dirname, '../prompts/dataAgent.md');
let promptCache = null;

function cargarPromptDatos() {
  if (!promptCache) {
    promptCache = fs.readFileSync(PROMPT_PATH, 'utf8');
  }
  return promptCache;
}

function ajustarDiaHabil(fecha) {
  const d = new Date(fecha.getTime());
  const dia = d.getUTCDay();
  if (dia === 6) d.setUTCDate(d.getUTCDate() - 1); // Sábado -> viernes
  else if (dia === 0) d.setUTCDate(d.getUTCDate() - 2); // Domingo -> viernes
  return d;
}

function calcularProximoPagoQuincenal(referencia = new Date()) {
  const anio = referencia.getUTCFullYear();
  const mes = referencia.getUTCMonth();
  const hoyStr = referencia.toISOString().slice(0, 10);

  const candidatos = [
    ajustarDiaHabil(new Date(Date.UTC(anio, mes, 15))),
    ajustarDiaHabil(new Date(Date.UTC(anio, mes + 1, 0))),
    ajustarDiaHabil(new Date(Date.UTC(anio, mes + 1, 15))),
    ajustarDiaHabil(new Date(Date.UTC(anio, mes + 2, 0))),
  ];

  const proximo = candidatos.find((c) => c.toISOString().slice(0, 10) >= hoyStr) || candidatos[0];
  return proximo.toISOString().slice(0, 10);
}

async function obtenerDatosPersonales(colaboradorId) {
  const colaborador = await db.Colaborador.findByPk(colaboradorId, {
    include: [
      { model: db.Departamento, as: 'departamento', attributes: ['id', 'codigo', 'nombre'] },
    ],
  });

  if (!colaborador) {
    throw new NotFoundError('Colaborador');
  }

  const [saldosVacaciones, solicitudes, incapacidades, asistencias] = await Promise.all([
    db.SaldoVacaciones.findAll({
      where: { colaborador_id: colaboradorId, periodo: '2026' },
      order: [['periodo', 'DESC']],
    }),
    db.Solicitud.findAll({
      where: { colaborador_id: colaboradorId },
      order: [['creada_en', 'DESC']],
      limit: 10,
    }),
    db.Incapacidad.findAll({
      where: { colaborador_id: colaboradorId },
      order: [['fecha_inicio', 'DESC']],
      limit: 10,
    }),
    db.Asistencia.findAll({
      where: { colaborador_id: colaboradorId },
      order: [['fecha', 'DESC']],
      limit: 7,
    }),
  ]);

  const jsonColab = colaborador.toJSON();
  const saldoRegistro = saldosVacaciones[0];
  if (saldoRegistro) await accrueWeeklyDays(saldoRegistro);
  const saldo2026 = saldoRegistro ? saldoRegistro.toJSON() : null;

  return {
    colaborador: {
      id: jsonColab.id,
      codigo_empleado: jsonColab.codigo_empleado,
      nombre: jsonColab.nombre,
      email: jsonColab.email,
      puesto: jsonColab.puesto,
      departamento: jsonColab.departamento ? jsonColab.departamento.nombre : null,
      fecha_ingreso: jsonColab.fecha_ingreso,
      salario_base_crc: Number(jsonColab.salario_base),
      estado: jsonColab.estado,
      rol: jsonColab.rol,
    },
    vacationBalance: saldo2026 ? saldo2026.dias_disponibles : 0,
    saldo_vacaciones_2026: saldo2026
      ? {
          periodo: saldo2026.periodo,
          dias_asignados: saldo2026.dias_asignados,
          dias_tomados: saldo2026.dias_tomados,
          dias_disponibles: saldo2026.dias_disponibles,
        }
      : null,
    solicitudes_recientes: solicitudes.map((s) => ({
      id: s.id,
      tipo: s.tipo,
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      dias_solicitados: s.dias_solicitados,
      estado: s.estado,
      motivo: s.motivo,
      creada_en: s.creada_en,
    })),
    incapacidades: incapacidades.map((inc) => ({
      id: inc.id,
      tipo: inc.tipo,
      entidad: inc.entidad,
      fecha_inicio: inc.fecha_inicio,
      fecha_fin: inc.fecha_fin,
      dias: inc.dias,
      estado: inc.estado,
      numero_boleta: inc.numero_boleta,
    })),
    asistencias_recientes: asistencias.map((a) => ({
      fecha: a.fecha,
      estado: a.estado,
      modalidad: a.modalidad,
      hora_entrada: a.hora_entrada,
      observacion: a.observacion,
    })),
    nomina_y_calendario: {
      proximo_pago_quincenal: calcularProximoPagoQuincenal(),
      frecuencia_pago: 'Quincenal (dias 15 y ultimo dia habil de cada mes en Costa Rica)',
      ciclo_evaluacion_desempeno:
        'Ciclo Anual 2026: revision de medio periodo en junio y evaluacion anual oficial entre noviembre y diciembre.',
    },
  };
}

async function obtenerDatosAgregadosRRHH() {
  const hoyStr = new Date().toISOString().slice(0, 10);
  const haceTresDias = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const [
    totalColaboradores,
    enVacacionesEstado,
    enIncapacidadEstado,
    incapacidadesActivas,
    solicitudesPendientes,
    solicitudesAtrasadas,
    riesgoPasivoVacaciones,
    asistenciasHoy,
    porDepartamento,
  ] = await Promise.all([
    db.Colaborador.count({ where: { estado: { [Op.ne]: 'inactivo' } } }),
    db.Colaborador.count({ where: { estado: 'vacaciones' } }),
    db.Colaborador.count({ where: { estado: 'incapacidad' } }),
    db.Incapacidad.count({ where: { estado: 'activa' } }),
    db.Solicitud.count({ where: { estado: 'pendiente' } }),
    db.Solicitud.count({
      where: {
        estado: 'pendiente',
        creada_en: { [Op.lt]: haceTresDias },
      },
    }),
    db.SaldoVacaciones.count({
      where: {
        periodo: '2026',
        dias_disponibles: { [Op.gt]: 20 },
      },
    }),
    db.Asistencia.findAll({
      attributes: [
        'estado',
        'modalidad',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'total'],
      ],
      where: { fecha: hoyStr },
      group: ['estado', 'modalidad'],
    }),
    db.Colaborador.findAll({
      attributes: [
        'departamento_id',
        [db.Sequelize.fn('COUNT', db.Sequelize.col('Colaborador.id')), 'total'],
      ],
      include: [{ model: db.Departamento, as: 'departamento', attributes: ['nombre'] }],
      group: ['departamento_id', 'departamento.id', 'departamento.nombre'],
    }),
  ]);

  return {
    fecha_corte: hoyStr,
    total_colaboradores_activos: totalColaboradores,
    colaboradores_en_vacaciones_hoy: enVacacionesEstado,
    colaboradores_incapacitados_hoy: Math.max(enIncapacidadEstado, incapacidadesActivas),
    incapacidades_activas: incapacidadesActivas,
    solicitudes_pendientes_totales: solicitudesPendientes,
    solicitudes_pendientes_mas_3_dias: solicitudesAtrasadas,
    colaboradores_con_mas_20_dias_vacaciones: riesgoPasivoVacaciones,
    resumen_asistencia_hoy: asistenciasHoy.map((r) => ({
      estado: r.estado,
      modalidad: r.modalidad,
      total: Number(r.get('total')),
    })),
    distribucion_por_departamento: porDepartamento.map((d) => ({
      departamento: d.departamento?.nombre || 'Sin departamento',
      total: Number(d.get('total')),
    })),
  };
}

/**
 * Agente 3: Especialista en Datos Operativos RRHH.
 * Filtra estrictamente por `colaborador_id` del usuario autenticado.
 * Consultas agregadas globales únicamente permitidas para rol `rrhh`.
 */
async function responderDatos(pregunta, usuarioAutenticado, { esAgregado = false } = {}) {
  if (esAgregado && usuarioAutenticado.rol !== 'rrhh') {
    throw new ForbiddenError('Los reportes agregados globales están reservados para el rol de RRHH.');
  }

  const datosConsultados = esAgregado
    ? await obtenerDatosAgregadosRRHH()
    : await obtenerDatosPersonales(usuarioAutenticado.id);

  const datosParaLLM = esAgregado
    ? datosConsultados
    : {
        colaborador: datosConsultados.colaborador,
        saldo_vacaciones_2026: datosConsultados.saldo_vacaciones_2026,
        solicitudes_recientes: datosConsultados.solicitudes_recientes.slice(0, 4),
        incapacidades: datosConsultados.incapacidades.slice(0, 4),
        nomina_y_calendario: datosConsultados.nomina_y_calendario,
      };

  const systemInstruction = cargarPromptDatos();
  const userPrompt = `<datos_verificados>\n${JSON.stringify(datosParaLLM)}\n</datos_verificados>\n\nPregunta del usuario: ${pregunta}\n\nResponde en 1 a 3 oraciones directas usando exclusivamente los datos anteriores.`;

  const answer = await generarConGemini({
    systemInstruction,
    userPrompt,
    temperature: 0.1,
    maxOutputTokens: 220,
  });

  return {
    answer,
    datosConsultados,
    esAgregado,
  };
}

module.exports = {
  calcularProximoPagoQuincenal,
  obtenerDatosPersonales,
  obtenerDatosAgregadosRRHH,
  responderDatos,
};
