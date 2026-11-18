'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { AppError, ValidationError } = require('../utils/errors');

const DEFAULT_MODEL = 'gemini-embedding-001';
const FALLBACK_MODEL = 'gemini-embedding-001';
const OUTPUT_DIMENSIONALITY = 768;
const MAX_REINTENTOS = 3;

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function obtenerModeloEmbedding(modelOverride = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PENDIENTE_CONFIGURAR_POR_EIKER') {
    throw new AppError(
      500,
      'GEMINI_API_KEY no está configurada en backend/.env.',
      'GEMINI_CONFIG_ERROR'
    );
  }

  const modelName = modelOverride || process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_MODEL;
  const genAI = new GoogleGenerativeAI(apiKey);
  return {
    model: genAI.getGenerativeModel({ model: modelName }),
    modelName,
  };
}

/**
 * Genera el vector de embedding (768 dimensiones) para un texto usando Gemini Embeddings.
 * @param {string} texto
 * @returns {Promise<number[]>}
 */
async function generarEmbedding(texto) {
  const limpio = String(texto || '').trim();
  if (!limpio) {
    throw new ValidationError('No se puede generar un embedding para texto vacío.');
  }

  let { model, modelName } = obtenerModeloEmbedding();
  let ultimoError = null;
  let usoFallback = false;

  for (let intento = 1; intento <= MAX_REINTENTOS; intento += 1) {
    try {
      const resultado = await model.embedContent({
        content: { parts: [{ text: limpio }] },
        outputDimensionality: OUTPUT_DIMENSIONALITY,
      });
      const vector = resultado?.embedding?.values;
      if (!Array.isArray(vector) || vector.length === 0) {
        throw new AppError(502, 'Gemini devolvió un vector de embedding vacío.', 'GEMINI_EMBEDDING_VACIO');
      }
      return vector;
    } catch (error) {
      ultimoError = error;
      const msg = String(error?.message || '');

      // Fallback automático si el modelo configurado en .env (ej. text-embedding-004) ya fue retirado
      if (!usoFallback && msg.includes('404') && modelName !== FALLBACK_MODEL) {
        usoFallback = true;
        ({ model, modelName } = obtenerModeloEmbedding(FALLBACK_MODEL));
        intento -= 1;
        continue;
      }

      const esTransitorio =
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('UNAVAILABLE');

      if (esTransitorio && intento < MAX_REINTENTOS) {
        await esperar(600 * intento);
        continue;
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        502,
        `Error generando embedding con Gemini (${modelName}): ${msg}`,
        'GEMINI_EMBEDDING_ERROR'
      );
    }
  }

  throw ultimoError;
}

/**
 * Genera embeddings en lote controlando el ritmo para evitar rate-limits.
 * @param {string[]} textos
 * @returns {Promise<number[][]>}
 */
async function generarEmbeddingsEnLote(textos) {
  if (!Array.isArray(textos) || textos.length === 0) {
    return [];
  }

  const vectores = [];
  for (const texto of textos) {
    const vec = await generarEmbedding(texto);
    vectores.push(vec);
  }
  return vectores;
}

module.exports = {
  generarEmbedding,
  generarEmbeddingsEnLote,
};
