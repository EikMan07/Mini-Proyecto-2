'use strict';

/**
 * Calcula la similitud coseno exacta entre dos vectores numéricos (ej. embeddings de 768 dimensiones).
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Similitud en el rango [-1, 1], o 0 si alguno es inválido o nulo.
 */
function similitudCoseno(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let productoPunto = 0;
  let normaA = 0;
  let normaB = 0;

  for (let i = 0; i < vecA.length; i += 1) {
    const a = Number(vecA[i]) || 0;
    const b = Number(vecB[i]) || 0;
    productoPunto += a * b;
    normaA += a * a;
    normaB += b * b;
  }

  const denominador = Math.sqrt(normaA) * Math.sqrt(normaB);
  if (denominador === 0) return 0;

  return productoPunto / denominador;
}

/**
 * Busca los fragmentos más similares en `fragmentos_documento` usando similitud coseno en Node.js.
 * @param {number[]} embeddingConsulta
 * @param {number} limite
 * @returns {Promise<Array>}
 */
async function buscarFragmentosSimilares(embeddingConsulta, limite = 5) {
  if (!Array.isArray(embeddingConsulta) || embeddingConsulta.length === 0) {
    return [];
  }

  const { FragmentoDocumento } = require('../models');
  const fragmentos = await FragmentoDocumento.findAll({
    attributes: [
      'id',
      'drive_file_id',
      'documento_titulo',
      'formato',
      'version',
      'fecha_vigencia',
      'responsable',
      'seccion',
      'enlace_drive',
      'indice_fragmento',
      'contenido',
      'tokens_estimados',
      'embedding_json',
    ],
  });

  const resultados = fragmentos
    .map((frag) => {
      const json = frag.toJSON();
      const similitud = similitudCoseno(embeddingConsulta, json.embedding_json);
      return {
        ...json,
        similitud: Number(similitud.toFixed(6)),
      };
    })
    .sort((a, b) => b.similitud - a.similitud)
    .slice(0, limite);

  return resultados;
}

module.exports = {
  similitudCoseno,
  buscarFragmentosSimilares,
};
