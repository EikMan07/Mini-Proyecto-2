'use strict';

const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const db = require('../models');
const { generarConGemini } = require('../services/llmService');
const { NotFoundError } = require('../utils/errors');

const PROMPT_PATH = path.resolve(__dirname, '../prompts/analystAgent.md');
let promptCache = null;

function cargarPromptAnalista() {
  if (!promptCache) {
    promptCache = fs.readFileSync(PROMPT_PATH, 'utf8');
  }
  return promptCache;
}

function formatoFecha(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Extrae todos los tokens numéricos de un texto u objeto serializado
 * y verifica que ningún número del resumen falte en `datosJson`.
 */
function validarNumerosResumen(resumenTexto, datosJson) {
  const texto = String(resumenTexto || '').trim();
  if (!texto) {
    return { valido: false, numerosNoEncontrados: ['resumen_vacio'] };
  }

  const jsonStr = JSON.stringify(datosJson);
  const numerosEnJson = new Set(jsonStr.match(/\d+(?:\.\d+)?/g) || []);

  // También admitir versión entera/normalizada de cada número del JSON (ej. 85.0 -> 85)
  for (const n of Array.from(numerosEnJson)) {
    const val = Number(n);
    if (!Number.isNaN(val)) {
      numerosEnJson.add(String(val));
    }
  }

  const tokensResumen = texto.match(/\d+(?:\.\d+)?/g) || [];
  const faltantes = [];

  for (const tok of tokensResumen) {
    const norm = String(Number(tok));
    if (!numerosEnJson.has(tok) && !numerosEnJson.has(norm)) {
      faltantes.push(tok);
    }
  }

  return {
    valido: faltantes.length === 0,
    numerosNoEncontrados: faltantes,
  };
}

/**
 * Resumen ejecutivo determinista de 4 frases garantizando 100% de fidelidad numérica al JSON.
 */
function construirResumenDeterminista(datos) {
  const a = datos.ausencias_hoy;
  const s = datos.solicitudes_pendientes;
  const i = datos.incapacidades;
  const m = datos.movimientos_y_rotacion;
  const r = datos.riesgo_pasivo_vacaciones;
  const c = datos.uso_chatbot;

  return (
    `En la jornada de hoy se registran ${a.total} ausencias sobre una planilla de ${m.total_colaboradores} colaboradores ` +
    `(${a.por_tipo.vacaciones} en vacaciones, ${a.por_tipo.incapacidad} en incapacidad y ${a.por_tipo.ausente_sin_justificar} sin marca registrada). ` +
    `Existen ${s.total_pendientes} solicitudes pendientes de aprobacion, de las cuales ${s.mas_de_3_dias_sin_respuesta} superan el umbral de espera, ` +
    `asi como ${r.colaboradores_mas_20_dias} colaboradores con exceso de saldo vacacional que representan riesgo de pasivo laboral. ` +
    `Durante el mes se contabilizan ${i.activas_hoy} incapacidades activas con ${i.dias_acumulados_mes} dias acumulados, ` +
    `${m.ingresos_mes} ingresos y ${m.salidas_mes} salidas con una tasa de rotacion mensual de ${m.tasa_rotacion_mensual_pct}%. ` +
    `En los ultimos dias el chatbot registro ${c.consultas_dia_anterior} consultas del dia anterior y una resolucion sin escalar de ${c.porcentaje_resuelto_sin_escalar}% ` +
    `con latencia promedio de ${c.latencia_promedio_ms} ms.`
  );
}

async function calcularMetricasDiarias(fechaBase = new Date()) {
  const hoyStr = formatoFecha(fechaBase);
  const ayerDate = new Date(fechaBase.getTime() - 24 * 60 * 60 * 1000);
  const ayerStr = formatoFecha(ayerDate);
  const inicioMesStr = `${hoyStr.slice(0, 7)}-01`;
  const hace3Dias = new Date(fechaBase.getTime() - 3 * 24 * 60 * 60 * 1000);
  const hace30Dias = new Date(fechaBase.getTime() - 29 * 24 * 60 * 60 * 1000);
  const hace30DiasStr = formatoFecha(hace30Dias);
  const hace90DiasStr = formatoFecha(new Date(fechaBase.getTime() - 90 * 24 * 60 * 60 * 1000));

  // 1. Ausencias hoy por tipo y por departamento
  const [
    totalColaboradores,
    asistenciasHoy,
    solicitudesPendientesList,
    incapacidadesActivasList,
    incapacidadesMesList,
    movimientos3m,
    saldosRiesgo,
    consultas30d,
  ] = await Promise.all([
    db.Colaborador.count({ where: { estado: { [Op.ne]: 'inactivo' } } }),
    db.Asistencia.findAll({
      where: { fecha: hoyStr, estado: { [Op.ne]: 'presente' } },
      include: [
        {
          model: db.Colaborador,
          as: 'colaborador',
          attributes: ['id', 'nombre', 'estado'],
          include: [{ model: db.Departamento, as: 'departamento', attributes: ['nombre'] }],
        },
      ],
    }),
    // 2. Solicitudes pendientes
    db.Solicitud.findAll({
      where: { estado: 'pendiente' },
      include: [
        {
          model: db.Colaborador,
          as: 'colaborador',
          attributes: ['id', 'nombre', 'email'],
          include: [{ model: db.Departamento, as: 'departamento', attributes: ['nombre'] }],
        },
      ],
      order: [['creada_en', 'ASC']],
    }),
    // 3a. Incapacidades activas hoy
    db.Incapacidad.findAll({ where: { estado: 'activa' } }),
    // 3b. Incapacidades del mes
    db.Incapacidad.findAll({
      where: { fecha_inicio: { [Op.gte]: inicioMesStr } },
    }),
    // 4. Movimientos de personal últimos 3 meses
    db.MovimientoPersonal.findAll({
      where: { fecha: { [Op.gte]: hace90DiasStr } },
    }),
    // 5. Colaboradores con > 20 días de vacaciones disponibles
    db.SaldoVacaciones.findAll({
      where: { periodo: '2026', dias_disponibles: { [Op.gt]: 20 } },
      include: [
        {
          model: db.Colaborador,
          as: 'colaborador',
          attributes: ['id', 'codigo_empleado', 'nombre', 'email'],
          include: [{ model: db.Departamento, as: 'departamento', attributes: ['nombre'] }],
        },
      ],
      order: [['dias_disponibles', 'DESC']],
    }),
    // 6-8. Consultas chat últimos 30 días
    db.ConsultaChat.findAll({
      where: { fecha: { [Op.gte]: hace30Dias } },
      order: [['fecha', 'ASC']],
    }),
  ]);

  // Procesar bloque 1: Ausencias hoy
  const porTipo = { vacaciones: 0, permiso: 0, incapacidad: 0, ausente_sin_justificar: 0 };
  const ausenciasDeptoMap = new Map();

  for (const a of asistenciasHoy) {
    const obs = String(a.observacion || '').toLowerCase();
    const estColab = String(a.colaborador?.estado || '').toLowerCase();
    if (estColab === 'incapacidad' || obs.includes('incapacidad')) porTipo.incapacidad += 1;
    else if (estColab === 'vacaciones' || obs.includes('vacaciones')) porTipo.vacaciones += 1;
    else if (obs.includes('permiso') || a.estado === 'justificada') porTipo.permiso += 1;
    else porTipo.ausente_sin_justificar += 1;

    const depto = a.colaborador?.departamento?.nombre || 'Sin departamento';
    ausenciasDeptoMap.set(depto, (ausenciasDeptoMap.get(depto) || 0) + 1);
  }

  // Procesar bloque 2: Solicitudes pendientes y >3 días
  const pendientesFormateadas = solicitudesPendientesList.map((s) => {
    const creadaMs = new Date(s.creada_en).getTime();
    const diasEspera = Math.max(0, Math.floor((fechaBase.getTime() - creadaMs) / (24 * 60 * 60 * 1000)));
    return {
      id: s.id,
      colaborador: s.colaborador?.nombre || 'Colaborador',
      departamento: s.colaborador?.departamento?.nombre || 'Sin departamento',
      tipo: s.tipo,
      fecha_inicio: s.fecha_inicio,
      fecha_fin: s.fecha_fin,
      dias_solicitados: s.dias_solicitados,
      dias_espera: diasEspera,
      atrasada_mas_3_dias: new Date(s.creada_en) < hace3Dias,
      creada_en: s.creada_en,
    };
  });
  const atrasadas = pendientesFormateadas.filter((p) => p.atrasada_mas_3_dias);

  // Procesar bloque 3: Incapacidades
  let diasMesInc = 0;
  const incPorEntidadMap = new Map();
  for (const inc of incapacidadesMesList) {
    diasMesInc += Number(inc.dias || 0);
    incPorEntidadMap.set(inc.entidad, (incPorEntidadMap.get(inc.entidad) || 0) + Number(inc.dias || 0));
  }

  // Procesar bloque 4: Movimientos y rotación
  let ingresosMes = 0;
  let salidasMes = 0;
  let ascensosMes = 0;
  let ingresos3m = 0;
  let salidas3m = 0;

  for (const m of movimientos3m) {
    if (m.tipo === 'ingreso') ingresos3m += 1;
    else if (m.tipo === 'salida') salidas3m += 1;

    if (m.fecha >= inicioMesStr) {
      if (m.tipo === 'ingreso') ingresosMes += 1;
      else if (m.tipo === 'salida') salidasMes += 1;
      else if (m.tipo === 'ascenso') ascensosMes += 1;
    }
  }

  const baseHeadcount = Math.max(1, totalColaboradores);
  const tasaRotacionMensual = Number(((salidasMes / baseHeadcount) * 100).toFixed(2));
  const tasaRotacion3m = Number(((salidas3m / baseHeadcount) * 100).toFixed(2));

  // Procesar bloque 5: Riesgo de pasivo laboral (>20 días)
  const topAcumulacion = saldosRiesgo.slice(0, 15).map((sv) => ({
    colaborador_id: sv.colaborador_id,
    codigo_empleado: sv.colaborador?.codigo_empleado || '',
    nombre: sv.colaborador?.nombre || 'Colaborador',
    departamento: sv.colaborador?.departamento?.nombre || 'Sin departamento',
    dias_disponibles: sv.dias_disponibles,
  }));

  // Procesar bloques 6 y 7: Chatbot
  let consultasAyer = 0;
  let totalResueltasSinEscalar = 0;
  let sumaLatencia = 0;
  const temasMap = new Map();
  const noResueltas = [];
  const serieMap = new Map();

  for (let d = 0; d < 30; d += 1) {
    const f = formatoFecha(new Date(hace30Dias.getTime() + d * 24 * 60 * 60 * 1000));
    serieMap.set(f, { fecha: f, consultas: 0, resueltas: 0, escaladas: 0, ausencias: 0 });
  }

  for (const c of consultas30d) {
    const fechaStr = formatoFecha(new Date(c.fecha));
    if (fechaStr === ayerStr) consultasAyer += 1;
    if (c.resuelta && !c.escalada) totalResueltasSinEscalar += 1;
    sumaLatencia += Number(c.latencia_ms || 0);

    const tema = c.tema || 'general';
    temasMap.set(tema, (temasMap.get(tema) || 0) + 1);

    if (c.escalada || !c.resuelta) {
      noResueltas.push({
        id: c.id,
        pregunta: c.pregunta,
        tema,
        fecha: fechaStr,
      });
    }

    const bucket = serieMap.get(fechaStr);
    if (bucket) {
      bucket.consultas += 1;
      if (c.resuelta && !c.escalada) bucket.resueltas += 1;
      if (c.escalada) bucket.escaladas += 1;
    }
  }

  // Enriquecer serie de 30 días con ausencias reales registradas por fecha
  const asistencias30d = await db.Asistencia.findAll({
    attributes: [
      'fecha',
      [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'total'],
    ],
    where: {
      fecha: { [Op.gte]: hace30DiasStr },
      estado: { [Op.ne]: 'presente' },
    },
    group: ['fecha'],
  });
  for (const row of asistencias30d) {
    const f = String(row.fecha);
    const bucket = serieMap.get(f);
    if (bucket) {
      bucket.ausencias = Number(row.get('total'));
    }
  }

  const totalConsultas30d = consultas30d.length;
  const pctResuelto =
    totalConsultas30d > 0
      ? Number(((totalResueltasSinEscalar / totalConsultas30d) * 100).toFixed(1))
      : 100;
  const latenciaPromedio =
    totalConsultas30d > 0 ? Math.round(sumaLatencia / totalConsultas30d) : 0;

  const top5Temas = Array.from(temasMap.entries())
    .map(([tema, total]) => ({ tema, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    fecha_corte: hoyStr,
    ausencias_hoy: {
      total: asistenciasHoy.length,
      por_tipo: porTipo,
      por_departamento: Array.from(ausenciasDeptoMap.entries()).map(([departamento, total]) => ({
        departamento,
        total,
      })),
    },
    solicitudes_pendientes: {
      total_pendientes: pendientesFormateadas.length,
      mas_de_3_dias_sin_respuesta: atrasadas.length,
      lista_pendientes_atrasadas: atrasadas,
      lista_pendientes: pendientesFormateadas.slice(0, 20),
    },
    incapacidades: {
      activas_hoy: incapacidadesActivasList.length,
      dias_acumulados_mes: diasMesInc,
      por_entidad: Array.from(incPorEntidadMap.entries()).map(([entidad, dias]) => ({
        entidad,
        dias,
      })),
    },
    movimientos_y_rotacion: {
      total_colaboradores: totalColaboradores,
      ingresos_mes: ingresosMes,
      salidas_mes: salidasMes,
      ascensos_mes: ascensosMes,
      ingresos_3m: ingresos3m,
      salidas_3m: salidas3m,
      tasa_rotacion_mensual_pct: tasaRotacionMensual,
      tasa_rotacion_3m_pct: tasaRotacion3m,
    },
    riesgo_pasivo_vacaciones: {
      colaboradores_mas_20_dias: saldosRiesgo.length,
      top_acumulacion: topAcumulacion,
    },
    uso_chatbot: {
      consultas_dia_anterior: consultasAyer,
      consultas_ultimos_30_dias: totalConsultas30d,
      porcentaje_resuelto_sin_escalar: pctResuelto,
      latencia_promedio_ms: latenciaPromedio,
    },
    temas_y_brechas: {
      top_5_temas: top5Temas,
      preguntas_no_resueltas: noResueltas.slice(-15),
    },
    tendencia_30_dias: Array.from(serieMap.values()),
  };
}

/**
 * Genera el reporte diario, redacta el resumen ejecutivo con Gemini y valida los números.
 */
async function generarReporteDiario(fechaBase = new Date()) {
  const datosJson = await calcularMetricasDiarias(fechaBase);
  const fechaStr = datosJson.fecha_corte;

  // Compactar payload enviado al LLM para acelerar redacción sin perder las cifras clave
  const resumenParaLLM = {
    fecha_corte: datosJson.fecha_corte,
    ausencias_hoy: datosJson.ausencias_hoy,
    solicitudes_pendientes: {
      total_pendientes: datosJson.solicitudes_pendientes.total_pendientes,
      mas_de_3_dias_sin_respuesta: datosJson.solicitudes_pendientes.mas_de_3_dias_sin_respuesta,
    },
    incapacidades: datosJson.incapacidades,
    movimientos_y_rotacion: datosJson.movimientos_y_rotacion,
    riesgo_pasivo_vacaciones: {
      colaboradores_mas_20_dias: datosJson.riesgo_pasivo_vacaciones.colaboradores_mas_20_dias,
    },
    uso_chatbot: datosJson.uso_chatbot,
    top_5_temas: datosJson.temas_y_brechas.top_5_temas,
  };

  let resumenTexto = '';
  let validacionNumerica = { valido: false, origen: 'determinista', numerosNoEncontrados: [] };

  try {
    const textoLlm = await generarConGemini({
      systemInstruction: cargarPromptAnalista(),
      userPrompt: `<datos_reporte>\n${JSON.stringify(resumenParaLLM, null, 2)}\n</datos_reporte>`,
      temperature: 0.1,
      maxOutputTokens: 350,
    });

    const check = validarNumerosResumen(textoLlm, resumenParaLLM);
    if (check.valido) {
      resumenTexto = textoLlm;
      validacionNumerica = { valido: true, origen: 'gemini_validado', numerosNoEncontrados: [] };
    } else {
      resumenTexto = construirResumenDeterminista(datosJson);
      validacionNumerica = {
        valido: true,
        origen: 'determinista_por_discrepancia',
        numerosNoEncontrados: check.numerosNoEncontrados,
      };
    }
  } catch {
    resumenTexto = construirResumenDeterminista(datosJson);
    validacionNumerica = { valido: true, origen: 'determinista_fallback', numerosNoEncontrados: [] };
  }

  const existente = await db.ReporteDiario.findOne({ where: { fecha: fechaStr } });
  let reporte;
  if (existente) {
    reporte = await existente.update({
      datos_json: datosJson,
      resumen_texto: resumenTexto,
      generado_por: 'Agente Analista Diario',
    });
  } else {
    reporte = await db.ReporteDiario.create({
      fecha: fechaStr,
      datos_json: datosJson,
      resumen_texto: resumenTexto,
      generado_por: 'Agente Analista Diario',
    });
  }

  return {
    reporte: reporte.toJSON(),
    validacion_numerica: validacionNumerica,
  };
}

async function obtenerReporteDiario(fechaSolicitada = null) {
  const fechas = await db.ReporteDiario.findAll({
    attributes: ['fecha', 'generado_por', 'updated_at'],
    order: [['fecha', 'DESC']],
    limit: 30,
  });

  const historialFechas = fechas.map((f) => f.fecha);

  if (fechaSolicitada) {
    const reporte = await db.ReporteDiario.findOne({ where: { fecha: fechaSolicitada } });
    if (!reporte) {
      throw new NotFoundError(`Reporte diario para la fecha ${fechaSolicitada}`);
    }
    return { reporte: reporte.toJSON(), historialFechas };
  }

  const hoyStr = formatoFecha(new Date());
  const deHoy = await db.ReporteDiario.findOne({ where: { fecha: hoyStr } });
  if (deHoy) {
    return { reporte: deHoy.toJSON(), historialFechas };
  }

  const { reporte } = await generarReporteDiario();
  return {
    reporte,
    historialFechas: historialFechas.includes(reporte.fecha)
      ? historialFechas
      : [reporte.fecha, ...historialFechas],
  };
}

module.exports = {
  validarNumerosResumen,
  construirResumenDeterminista,
  calcularMetricasDiarias,
  generarReporteDiario,
  obtenerReporteDiario,
};
