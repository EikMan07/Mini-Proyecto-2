'use strict';

const dns = require('dns');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppError } = require('../utils/errors');

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignorar si la versión de Node no soporta cambiar el orden DNS
}

const DEFAULT_CHAT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
];

const PATRON_META_INGLES = /Agent Role:|Input Data:|User Question:|Constraints:/i;

// Cachea en memoria el modelo y thinkingConfig operativos tras el primer fallback para evitar 404/400 repetidos
let configOperativaCache = null;

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
 * Extrae únicamente las partes visibles de respuesta, excluyendo cualquier parte `thought: true`.
 */
function extraerTextoVisible(result) {
  const parts = result?.response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts) && parts.length > 0) {
    const visible = parts
      .filter((part) => typeof part?.text === 'string' && !part.thought)
      .map((part) => part.text)
      .join('')
      .trim();
    return visible;
  }

  const fallbackText = result?.response?.text?.();
  return typeof fallbackText === 'string' ? fallbackText.trim() : '';
}

function contieneMetaTextoIngles(texto = '') {
  return PATRON_META_INGLES.test(String(texto || ''));
}

async function ejecutarModelo(genAI, {
  modelName,
  systemInstruction,
  userPrompt,
  temperature,
  jsonMode,
  maxOutputTokens,
  timeoutMs,
  thinkingConfig,
}) {
  const generationConfig = {
    temperature,
    ...(maxOutputTokens ? { maxOutputTokens } : {}),
    ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    ...(thinkingConfig ? { thinkingConfig } : {}),
  };

  const model = genAI.getGenerativeModel(
    {
      model: modelName,
      ...(systemInstruction ? { systemInstruction } : {}),
      generationConfig,
    },
    { timeout: timeoutMs }
  );

  const result = await model.generateContent(userPrompt);
  return extraerTextoVisible(result);
}

/**
 * Invoca Gemini filtrando estrictamente partes `thought`, bloqueando fugas de meta-texto
 * en inglés y tolerando modelos que no soporten `thinkingBudget: 0`.
 */
async function generarConGemini({
  systemInstruction,
  userPrompt,
  temperature = 0.2,
  jsonMode = false,
  maxOutputTokens = 280,
  timeoutMs = 20000,
}) {
  const apiKey = validarApiKey();
  const configurado = process.env.GEMINI_CHAT_MODEL || DEFAULT_CHAT_MODEL;
  const candidatos = Array.from(
    new Set(
      configOperativaCache
        ? [configOperativaCache.modelName, configurado, ...FALLBACK_MODELS]
        : [configurado, ...FALLBACK_MODELS]
    )
  );

  const genAI = new GoogleGenerativeAI(apiKey);
  let ultimoError = null;

  for (let idx = 0; idx < candidatos.length; idx += 1) {
    const modelName = candidatos[idx];
    const intentosBase = [{ thinkingBudget: 0 }, { thinkingLevel: 'MINIMAL' }, null];
    const intentosThinking =
      configOperativaCache?.modelName === modelName
        ? [
            configOperativaCache.thinkingConfig,
            ...intentosBase.filter(
              (cfg) => JSON.stringify(cfg) !== JSON.stringify(configOperativaCache.thinkingConfig)
            ),
          ]
        : intentosBase;

    for (let tIdx = 0; tIdx < intentosThinking.length; tIdx += 1) {
      const thinkingConfig = intentosThinking[tIdx];
      try {
        const text = await ejecutarModelo(genAI, {
          modelName,
          systemInstruction,
          userPrompt,
          temperature,
          jsonMode,
          maxOutputTokens,
          timeoutMs,
          thinkingConfig,
        });

        if (!text || contieneMetaTextoIngles(text)) {
          throw new AppError(
            502,
            `Respuesta descartada por formato interno no visible (${modelName}).`,
            'GEMINI_META_LEAK'
          );
        }

        configOperativaCache = { modelName, thinkingConfig };
        return text;
      } catch (error) {
        ultimoError = error;
        const msg = String(error?.message || '');

        const errorThinking =
          thinkingConfig !== null &&
          msg.includes('400') &&
          tIdx < intentosThinking.length - 1;
        if (errorThinking) {
          continue;
        }

        if ((msg.includes('503') || msg.includes('UNAVAILABLE')) && tIdx < intentosThinking.length - 1) {
          await esperar(250);
          continue;
        }

        const recuperable =
          error?.code === 'GEMINI_META_LEAK' ||
          msg.includes('404') ||
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('400') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.toLowerCase().includes('abort') ||
          msg.toLowerCase().includes('timeout');

        if (recuperable && idx < candidatos.length - 1) {
          await esperar(100);
          break;
        }

        if (idx === candidatos.length - 1) {
          throw new AppError(
            502,
            `Error al consultar Gemini (${modelName}): ${msg}`,
            'GEMINI_CHAT_ERROR'
          );
        }
        break;
      }
    }
  }

  throw ultimoError;
}

module.exports = {
  generarConGemini,
  extraerTextoVisible,
  contieneMetaTextoIngles,
};
