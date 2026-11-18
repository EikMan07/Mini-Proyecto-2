'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppError } = require('../utils/errors');

const DEFAULT_CHAT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
];

// Cachea en memoria el modelo operativo tras el primer fallback para evitar 404 repetidos
let modeloOperativoCache = null;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validarApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PENDIENTE_CONFIGURAR_POR_EIKER') {
    throw new AppError(
      500,
      'GEMINI_API_KEY no está configurada en backend/.env.',
      'GEMINI_CONFIG_ERROR'
    );
  }
  return apiKey;
}

/**
 * Invoca Gemini para generación de texto o JSON estructurado con caché de modelo activo,
 * thinking minimal en modelos 3.x, timeout agresivo con reintento rápido (<8s) y fallback.
 */
async function generarConGemini({
  systemInstruction,
  userPrompt,
  temperature = 0.1,
  jsonMode = false,
  maxOutputTokens = 320,
  timeoutMs = 7500,
}) {
  const apiKey = validarApiKey();
  const configurado = process.env.GEMINI_CHAT_MODEL || DEFAULT_CHAT_MODEL;
  const candidatos = modeloOperativoCache
    ? [modeloOperativoCache, ...FALLBACK_MODELS]
    : [configurado, ...FALLBACK_MODELS];

  const genAI = new GoogleGenerativeAI(apiKey);
  let ultimoError = null;

  for (let idx = 0; idx < candidatos.length; idx += 1) {
    const modelName = candidatos[idx];
    const generationConfig = {
      temperature,
      ...(maxOutputTokens ? { maxOutputTokens } : {}),
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      ...(modelName === 'gemini-3.5-flash-lite'
        ? { thinkingConfig: { thinkingLevel: 'MINIMAL' } }
        : {}),
    };

    try {
      const model = genAI.getGenerativeModel(
        {
          model: modelName,
          ...(systemInstruction ? { systemInstruction } : {}),
          generationConfig,
        },
        { timeout: timeoutMs }
      );

      const result = await model.generateContent(userPrompt);
      const text = result?.response?.text?.() || '';
      modeloOperativoCache = modelName;
      return text.trim();
    } catch (error) {
      ultimoError = error;
      const msg = String(error?.message || '');
      const recuperable =
        msg.includes('404') ||
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.toLowerCase().includes('abort') ||
        msg.toLowerCase().includes('timeout');

      if (recuperable && idx < candidatos.length - 1) {
        await esperar(100);
        continue;
      }

      throw new AppError(
        502,
        `Error al consultar Gemini (${modelName}): ${msg}`,
        'GEMINI_CHAT_ERROR'
      );
    }
  }

  throw ultimoError;
}

module.exports = {
  generarConGemini,
};
