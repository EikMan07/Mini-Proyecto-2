'use strict';

const fs = require('fs');
const path = require('path');
const { generarEmbedding } = require('../services/embeddingService');
const { buscarFragmentosSimilares } = require('../utils/vectores');
const { generarConGemini } = require('../services/llmService');

const PROMPT_PATH = path.resolve(__dirname, '../prompts/policyAgent.md');
let promptCache = null;

function cargarPromptPoliticas() {
  if (!promptCache) {
    promptCache = fs.readFileSync(PROMPT_PATH, 'utf8');
  }
  return promptCache;
}

function construirCita(fragmento) {
  return {
    title: fragmento.documento_titulo,
    section: fragmento.seccion,
    version: fragmento.version,
    vigencia: fragmento.fecha_vigencia,
    responsable: fragmento.responsable,
    url: fragmento.enlace_drive,
    similitud: Number(fragmento.similitud.toFixed(4)),
  };
}

function deduplicarCitas(fragmentos) {
  const vistas = new Set();
  const citas = [];
  for (const f of fragmentos) {
    const clave = `${f.documento_titulo}::${f.seccion}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    citas.push(construirCita(f));
  }
  return citas;
}

/**
 * Agente 2: Especialista en Políticas Laborales y RAG.
 * Nunca consulta tablas operativas de colaboradores ni busca en internet.
 */
async function responderPolitica(pregunta) {
  const threshold = Number(process.env.RAG_SIMILARITY_THRESHOLD) || 0.52;
  const embeddingConsulta = await generarEmbedding(pregunta);
  const fragmentos = await buscarFragmentosSimilares(embeddingConsulta, 4, pregunta);
  const similitudMaxima = fragmentos.length > 0 ? Number(fragmentos[0].similitud) : 0;

  if (fragmentos.length === 0 || similitudMaxima < threshold) {
    return {
      answer:
        'No encontre una politica oficial vigente en el repositorio documental de TicoSoft S.A. que responda con certeza a esta consulta. ' +
        'Para evitar darte informacion incorrecta, te sugiero escalar esta pregunta al equipo de Recursos Humanos (ana.solis@ticosoft.cr).',
      citations: [],
      documentosCitados: [],
      escalated: true,
      similitudMaxima,
    };
  }

  const pisoSecundario = Math.max(threshold * 0.85, 0.48);
  const relevantes = fragmentos.filter((f, idx) => idx === 0 || f.similitud >= pisoSecundario);

  const contextoXml = relevantes
    .map(
      (f, idx) =>
        `<documento index="${idx + 1}" titulo="${f.documento_titulo}" version="${f.version}" vigencia="${f.fecha_vigencia}" responsable="${f.responsable}" seccion="${f.seccion}" url="${f.enlace_drive}" similitud="${f.similitud}">\n${f.contenido}\n</documento>`
    )
    .join('\n\n');

  const systemInstruction = cargarPromptPoliticas();
  const userPrompt = `<documentos>\n${contextoXml}\n</documentos>\n\nPregunta del colaborador: ${pregunta}\n\nResponde de forma directa y concisa en español (máximo 2 a 4 oraciones), resaltando con **negrita** los datos clave, cantidades y plazos legales presentes en <documentos> (por ejemplo **48 horas** o cantidad de días), e indicando el documento y sección de respaldo. No escribas rutas técnicas como local:// ni razonamiento interno. Si la respuesta exacta no esta respaldada por <documentos>, inicia con SIN_COBERTURA_OFICIAL: y sugiere escalar a RRHH.`;

  const answer = await generarConGemini({
    systemInstruction,
    userPrompt,
    temperature: 0.2,
    maxOutputTokens: 320,
  });

  const respuestaIndicaNoEncontrado = /^SIN_COBERTURA_OFICIAL\b/i.test(answer.trim());
  const textoLimpio = respuestaIndicaNoEncontrado
    ? answer.replace(/^SIN_COBERTURA_OFICIAL\s*:?\s*/i, '').trim()
    : answer;

  const citas = deduplicarCitas(relevantes);

  return {
    answer: textoLimpio,
    citations: respuestaIndicaNoEncontrado ? [] : citas,
    documentosCitados: respuestaIndicaNoEncontrado ? [] : citas,
    escalated: respuestaIndicaNoEncontrado,
    similitudMaxima,
  };
}

module.exports = {
  responderPolitica,
};
