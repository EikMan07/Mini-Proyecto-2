'use strict';

const fs = require('fs');
const path = require('path');
const db = require('../models');
const policyAgent = require('./policyAgent');
const dataAgent = require('./dataAgent');
const validatorAgent = require('./validatorAgent');
const { generarConGemini } = require('../services/llmService');

const PROMPT_PATH = path.resolve(__dirname, '../prompts/orchestrator.md');
let promptCache = null;

function cargarPromptOrquestador() {
  if (!promptCache) {
    promptCache = fs.readFileSync(PROMPT_PATH, 'utf8');
  }
  return promptCache;
}

/**
 * Guardrail determinista previo para frenar fugas de datos de terceros.
 */
function detectarConsultaRestringida(pregunta, usuarioAutenticado) {
  if (usuarioAutenticado.rol === 'rrhh') {
    return null;
  }

  const original = String(pregunta || '');
  const texto = original.toLowerCase();
  const primerNombre = String(usuarioAutenticado.nombre || '')
    .trim()
    .split(/\s+/)[0]
    ?.toLowerCase();

  const patronesDirectos = [
    /\bgerente\s+general\b/i,
    /\bjuan\s*rojas\b/i,
    /\bjuan\b/i,
    /\botro\s+colaborador\b|\botra\s+persona\b|\bmi\s+companer[oa]\b|\bun\s+companer[oa]\b|\bcolega\b/i,
    /\bcuanto\s+gana\s+(?!yo\b)(el\s+|la\s+|un\s+|una\s+|mi\s+jefe|mi\s+gerente|[a-záéíóúñ]{3,})/i,
    /\b(salario|sueldo)\s+(de|del)\s+(?!ley\b|base\b|navidad\b|vacaciones\b|incapacidad\b|costa\s+rica\b|mi\b|mis\b)([a-záéíóúñ]{3,})/i,
  ];

  for (const re of patronesDirectos) {
    const match = texto.match(re);
    if (match) {
      if (primerNombre && match[0].toLowerCase().includes(primerNombre)) {
        continue;
      }
      return {
        motivo: 'solicitud de datos personales o salariales de terceros',
        tema: texto.includes('salario') || texto.includes('sueldo') || texto.includes('gana') ? 'salarios' : 'privacidad',
      };
    }
  }

  const matchNombrePropio = original.match(
    /\b(?:vacaciones|incapacidad|incapacidades|solicitud|solicitudes|asistencia|datos)\s+(?:de|del|tiene)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})/
  );
  if (matchNombrePropio) {
    const nombreDetectado = matchNombrePropio[1].toLowerCase();
    const palabrasComunes = new Set(['costa', 'ticosoft', 'ley', 'trabajo', 'ccss', 'ins', 'rrhh']);
    if (!palabrasComunes.has(nombreDetectado) && nombreDetectado !== primerNombre) {
      return {
        motivo: 'solicitud de datos personales de otro colaborador',
        tema: 'privacidad',
      };
    }
  }

  return null;
}

/**
 * Clasificación rápida determinista para consultas inequívocas (evita un roundtrip extra al LLM
 * y mantiene la latencia muy por debajo de 8s). Las consultas ambiguas pasan a Gemini.
 */
function clasificarRapido(pregunta) {
  const t = String(pregunta || '').toLowerCase();

  // Mixta: saldo/datos propios combinados con regla o política
  if (
    /\b(tengo\s+disponibles|me\s+quedan|mi\s+saldo)\b/.test(t) &&
    /\b(politica|acumular|regla|segun\s+la\s+ley|puedo\s+pedir|maximo)\b/.test(t)
  ) {
    return { intencion: 'mixta', tema: 'vacaciones' };
  }

  // Dato agregado organizacional
  if (
    /\b(en\s+toda\s+la\s+empresa|cuantas\s+personas|cuantos\s+colaboradores|total\s+de\s+colaboradores|cuantas\s+solicitudes\s+pendientes\s+hay)\b/.test(
      t
    )
  ) {
    return { intencion: 'dato_agregado', tema: 'asistencia' };
  }

  // Dato personal inequívoco (#2 saldo restante, #18 estado solicitud, nómina, evaluación)
  if (
    /\b(me\s+quedan(\s+disponibles)?|mi\s+saldo(\s+de\s+vacaciones)?|estado\s+de\s+mi\s+solicitud|mi\s+solicitud\s+de\s+permiso|mi\s+proximo\s+pago|cuando\s+me\s+pagan|evaluacion\s+de\s+desempeno|mis\s+(propias\s+)?incapacidades|mis\s+asistencias)\b/.test(
      t
    )
  ) {
    const tema = t.includes('solicitud') || t.includes('permiso')
      ? 'permisos'
      : t.includes('pago')
        ? 'salarios'
        : 'vacaciones';
    return { intencion: 'dato_personal', tema };
  }

  // Política general inequívoca ("me corresponden al año", CCSS, aguinaldo, preaviso, cesantía, feriados, Ley 8968, beneficios)
  if (
    /\b(me\s+corresponden\s+al\s+a[nñ]o|minimo\s+legal|feriados?\s+de\s+ley|aguinaldo|preaviso|cesantia|periodo\s+de\s+prueba|derechos\s+arco|ley\s+8968|enfermedad\s+comun|boleta\s+de\s+incapacidad|onboarding|liquidacion|deducciones|cargas\s+sociales|banco\s+popular|ivm|maternidad|accidente\s+laboral|ins|teletrabajo|clinica\s+privada|refrendo|compensar\s+en\s+dinero|acumulo\s+mas\s+de\s+20|pasivo|bono\s+mensual|mascotas|guarderia|gimnasio|subsidio\s+de|anticipa[a-z]+\s+.*vacaciones|solicitar\s+vacaciones|deposita\s+el\s+salario)\b/.test(
      t
    ) &&
    !/\b(mi\s+saldo|me\s+quedan|tengo\s+disponibles|mi\s+solicitud|mis\s+incapacidades)\b/.test(t)
  ) {
    const tema = t.includes('incapac') || t.includes('ccss') || t.includes('ins') || t.includes('maternidad') || t.includes('clinica')
      ? 'incapacidades'
      : t.includes('aguinaldo')
        ? 'aguinaldo'
        : t.includes('deducciones') || t.includes('banco popular') || t.includes('salario')
          ? 'salarios'
          : t.includes('preaviso') || t.includes('cesantia') || t.includes('onboarding') || t.includes('liquidacion') || t.includes('prueba')
            ? 'liquidacion'
            : t.includes('arco') || t.includes('8968')
              ? 'privacidad'
              : t.includes('bono') || t.includes('guarderia') || t.includes('gimnasio')
                ? 'beneficios'
                : 'vacaciones';
    return { intencion: 'politica', tema };
  }

  // Fuera de alcance evidente
  if (/\b(partido\s+de\s+futbol|receta\s+de|gallo\s+pinto|casado\s+tipico|chiste|horoscopo|clima\s+en)\b/.test(t)) {
    return { intencion: 'fuera_de_alcance', tema: 'general' };
  }

  return null;
}

async function clasificarIntencion(pregunta, usuarioAutenticado) {
  const rapido = clasificarRapido(pregunta);
  if (rapido) {
    return rapido;
  }

  const systemInstruction = cargarPromptOrquestador();
  const userPrompt = `Rol del usuario autenticado: ${usuarioAutenticado.rol}\n<pregunta_usuario>${pregunta}</pregunta_usuario>`;

  try {
    const raw = await generarConGemini({
      systemInstruction,
      userPrompt,
      temperature: 0,
      jsonMode: true,
      maxOutputTokens: 110,
    });

    const parsed = JSON.parse(raw);
    const intencionesValidas = new Set([
      'politica',
      'dato_personal',
      'dato_agregado',
      'mixta',
      'restringida',
      'fuera_de_alcance',
    ]);

    return {
      intencion: intencionesValidas.has(parsed.intencion) ? parsed.intencion : 'politica',
      tema: parsed.tema || 'general',
    };
  } catch {
    return { intencion: 'politica', tema: 'general' };
  }
}

async function registrarLogConsulta({
  colaboradorId,
  pregunta,
  respuesta,
  tema,
  intencion,
  agente,
  documentosCitados = [],
  similitudMaxima = null,
  resuelta = true,
  escalada = false,
  latenciaMs = 0,
}) {
  return db.ConsultaChat.create({
    colaborador_id: colaboradorId,
    pregunta,
    respuesta,
    tema: String(tema || 'general').slice(0, 80),
    intencion: String(intencion || 'politica').slice(0, 40),
    agente: String(agente || 'Orquestador').slice(0, 80),
    documentos_citados: documentosCitados,
    similitud_maxima:
      similitudMaxima !== null && similitudMaxima !== undefined
        ? Number(similitudMaxima).toFixed(4)
        : null,
    resuelta,
    escalada,
    latencia_ms: latenciaMs,
    fecha: new Date(),
  });
}

/**
 * Agente 1: Orquestador Multiagente + integración final con Agente Validador.
 */
async function procesarConsulta({ pregunta, usuarioAutenticado }) {
  const inicio = Date.now();

  // 1. Guardrail determinista previo por privacidad (preguntas #21, #22)
  const bloqueoPrevio = detectarConsultaRestringida(pregunta, usuarioAutenticado);
  if (bloqueoPrevio) {
    const respuesta =
      'Por politicas de privacidad y proteccion de datos personales (Ley N. 8968 y Aviso de Privacidad de TicoSoft S.A.), ' +
      'no puedo consultar ni divulgar salarios, saldos de vacaciones, incapacidades ni informacion personal de otros colaboradores o puestos directivos.';
    const latenciaMs = Date.now() - inicio;

    const registro = await registrarLogConsulta({
      colaboradorId: usuarioAutenticado.id,
      pregunta,
      respuesta,
      tema: bloqueoPrevio.tema,
      intencion: 'restringida',
      agente: 'Orquestador (Guardrail Privacidad)',
      resuelta: true,
      escalada: false,
      latenciaMs,
    });

    return {
      id_consulta: registro.id,
      pregunta,
      answer: respuesta,
      intencion: 'restringida',
      tema: bloqueoPrevio.tema,
      agente: 'Orquestador (Guardrail Privacidad)',
      citations: [],
      escalated: false,
      ticketId: null,
      similitud_maxima: null,
      latencia_ms: latenciaMs,
    };
  }

  // 2. Clasificación rápida o semántica con Gemini
  const clasificacion = await clasificarIntencion(pregunta, usuarioAutenticado);
  const { intencion, tema } = clasificacion;

  // 3. Bloqueo si el clasificador detectó consulta restringida o agregada sin rol rrhh
  if (intencion === 'restringida') {
    const respuesta =
      'Acceso denegado por privacidad: solo puedes consultar tu propia informacion laboral y las politicas generales de la empresa (Ley N. 8968).';
    const latenciaMs = Date.now() - inicio;
    const registro = await registrarLogConsulta({
      colaboradorId: usuarioAutenticado.id,
      pregunta,
      respuesta,
      tema,
      intencion: 'restringida',
      agente: 'Orquestador (Guardrail Privacidad)',
      resuelta: true,
      escalada: false,
      latenciaMs,
    });

    return {
      id_consulta: registro.id,
      pregunta,
      answer: respuesta,
      intencion: 'restringida',
      tema,
      agente: 'Orquestador (Guardrail Privacidad)',
      citations: [],
      escalated: false,
      ticketId: null,
      similitud_maxima: null,
      latencia_ms: latenciaMs,
    };
  }

  if (intencion === 'dato_agregado' && usuarioAutenticado.rol !== 'rrhh') {
    const respuesta =
      'Acceso restringido: las metricas globales y reportes agregados de la organizacion estan disponibles unicamente para el rol de Recursos Humanos (rrhh).';
    const latenciaMs = Date.now() - inicio;
    const registro = await registrarLogConsulta({
      colaboradorId: usuarioAutenticado.id,
      pregunta,
      respuesta,
      tema,
      intencion: 'restringida',
      agente: 'Orquestador (Control de Roles)',
      resuelta: true,
      escalada: false,
      latenciaMs,
    });

    return {
      id_consulta: registro.id,
      pregunta,
      answer: respuesta,
      intencion: 'restringida',
      tema,
      agente: 'Orquestador (Control de Roles)',
      citations: [],
      escalated: false,
      ticketId: null,
      similitud_maxima: null,
      latencia_ms: latenciaMs,
    };
  }

  // 4. Despacho según intención
  let answer = '';
  let agenteNombre = 'Orquestador';
  let citations = [];
  let documentosCitados = [];
  let similitudMaxima = null;
  let escalated = false;
  let resuelta = true;

  if (intencion === 'fuera_de_alcance') {
    agenteNombre = 'Orquestador (Fuera de Alcance)';
    answer =
      'Soy el asistente oficial de Recursos Humanos de TicoSoft S.A. Solo puedo ayudarte con politicas laborales de Costa Rica, reglamento interno y tus datos laborales (vacaciones, permisos, incapacidades, asistencias y fechas de pago).';
    resuelta = false;
  } else if (intencion === 'politica') {
    agenteNombre = 'Agente de Politicas RAG';
    const resPol = await policyAgent.responderPolitica(pregunta);
    answer = resPol.answer;
    citations = resPol.citations;
    documentosCitados = resPol.documentosCitados;
    similitudMaxima = resPol.similitudMaxima;
    escalated = resPol.escalated;
    resuelta = !resPol.escalated;
  } else if (intencion === 'dato_personal' || intencion === 'dato_agregado') {
    agenteNombre = intencion === 'dato_agregado' ? 'Agente de Datos (Agregado RRHH)' : 'Agente de Datos Personales';
    const resDat = await dataAgent.responderDatos(pregunta, usuarioAutenticado, {
      esAgregado: intencion === 'dato_agregado',
    });
    answer = resDat.answer;
  } else if (intencion === 'mixta') {
    agenteNombre = 'Orquestador Mixto (Datos + Politicas RAG)';
    const [resDat, resPol] = await Promise.all([
      dataAgent.responderDatos(pregunta, usuarioAutenticado, { esAgregado: false }),
      policyAgent.responderPolitica(`Reglas y politica aplicable para la consulta: ${pregunta}`),
    ]);

    answer = `**Tus datos registrados:**\n${resDat.answer}\n\n**Politica aplicable:**\n${resPol.answer}`;
    citations = resPol.citations;
    documentosCitados = resPol.documentosCitados;
    similitudMaxima = resPol.similitudMaxima;
    escalated = resPol.escalated;
  }

  const latenciaMs = Date.now() - inicio;

  const registro = await registrarLogConsulta({
    colaboradorId: usuarioAutenticado.id,
    pregunta,
    respuesta: answer,
    tema,
    intencion,
    agente: agenteNombre,
    documentosCitados,
    similitudMaxima,
    resuelta,
    escalada: escalated,
    latenciaMs,
  });

  // 5. Validación final y creación automática de ticket de escalamiento si aplica
  const validacion = await validatorAgent.validarYEscalar({
    usuarioAutenticado,
    consultaChatId: registro.id,
    pregunta,
    intencion,
    answer,
    citations,
    escalated,
  });

  return {
    id_consulta: registro.id,
    pregunta,
    answer: validacion.answer,
    intencion,
    tema,
    agente: agenteNombre,
    citations: validacion.citations,
    escalated: validacion.escalated,
    ticketId: validacion.ticketId,
    similitud_maxima: similitudMaxima,
    latencia_ms: latenciaMs,
  };
}

module.exports = {
  procesarConsulta,
};
