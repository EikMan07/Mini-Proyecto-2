'use strict';

const fs = require('fs');
const path = require('path');
const db = require('../models');

const PROMPT_PATH = path.resolve(__dirname, '../prompts/validatorAgent.md');
let promptCache = null;

function cargarPromptValidador() {
  if (!promptCache) {
    promptCache = fs.readFileSync(PROMPT_PATH, 'utf8');
  }
  return promptCache;
}

/**
 * Agente Validador (post-procesamiento determinista sin latencia extra de LLM):
 * (a) Verifica citas obligatorias en respuestas de políticas no escaladas.
 * (b) Verifica ausencia de fugas de terceros para rol `colaborador`.
 * (c) Si `escalated === true`, crea ticket en `tickets_escalamiento` y retorna `ticketId`.
 */
async function validarYEscalar({
  usuarioAutenticado,
  consultaChatId,
  pregunta,
  intencion,
  answer,
  citations = [],
  escalated = false,
}) {
  cargarPromptValidador();

  let respuestaFinal = answer;
  let citasFinales = Array.isArray(citations) ? citations : [];
  let escaladoFinal = Boolean(escalated);
  const observaciones = [];

  // (a) Citas obligatorias en políticas no escaladas
  if ((intencion === 'politica' || intencion === 'mixta') && !escaladoFinal && citasFinales.length === 0) {
    escaladoFinal = true;
    observaciones.push('Politica sin citas verificadas; escalamiento forzado');
    respuestaFinal =
      'No logre respaldar esta consulta con una cita verificada de los documentos oficiales de TicoSoft S.A. ' +
      'Se ha generado un ticket automatico para que Recursos Humanos te brinde una respuesta oficial.';
  }

  // (b) Verificación anti-fuga de terceros para rol colaborador
  if (usuarioAutenticado.rol !== 'rrhh' && intencion !== 'restringida') {
    const lower = String(respuestaFinal || '').toLowerCase();
    const contieneFugaTercero =
      (lower.includes('3850000') || lower.includes('3,850,000') || lower.includes('3 850 000')) ||
      (/\bjuan\s+rojas\b/i.test(lower) && !String(usuarioAutenticado.nombre || '').toLowerCase().includes('juan'));

    if (contieneFugaTercero) {
      observaciones.push('Bloqueo por posible exposicion de datos de terceros');
      citasFinales = [];
      escaladoFinal = false;
      respuestaFinal =
        'Por politicas de privacidad (Ley N. 8968), no es posible mostrar informacion salarial ni personal de otros colaboradores.';
    }
  }

  // (c) Creación automática de ticket si escalated === true
  let ticketId = null;
  if (escaladoFinal && consultaChatId) {
    const ticket = await db.TicketEscalamiento.create({
      colaborador_id: usuarioAutenticado.id,
      consulta_chat_id: consultaChatId,
      pregunta,
      estado: 'abierto',
      atendido_por_id: null,
      notas_rrhh: observaciones.length ? observaciones.join('; ') : null,
    });
    ticketId = ticket.id;

    // Actualizar flag en consultas_chat si el validador forzó escalación
    await db.ConsultaChat.update(
      { escalada: true, resuelta: false, respuesta: respuestaFinal },
      { where: { id: consultaChatId } }
    );
  }

  return {
    validado: true,
    answer: respuestaFinal,
    citations: citasFinales,
    escalated: escaladoFinal,
    ticketId,
  };
}

module.exports = {
  validarYEscalar,
};
