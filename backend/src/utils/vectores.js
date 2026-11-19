'use strict';

const STOPWORDS_ES = new Set([
  'para',
  'como',
  'esta',
  'este',
  'estos',
  'estas',
  'sobre',
  'cual',
  'cuales',
  'tiene',
  'tengo',
  'puedo',
  'puede',
  'debo',
  'debe',
  'hacer',
  'cuando',
  'donde',
  'quien',
  'porque',
  'dias',
  'trabajar',
  'trabajo',
  'empresa',
  'ticosoft',
  'costa',
  'rica',
  'politica',
  'politicas',
  'colaborador',
  'colaboradores',
  'empleado',
  'empleados',
]);

function normalizarTexto(texto = '') {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function extraerPalabrasClave(textoConsulta = '') {
  const normalizado = normalizarTexto(textoConsulta);
  const tokens = normalizado.match(/\b[a-z0-9]{4,}\b/g) || [];
  return Array.from(new Set(tokens.filter((t) => !STOPWORDS_ES.has(t))));
}

function calcularBonoLexico(palabrasClave, fragmento) {
  if (!palabrasClave.length) return 0;

  const cuerpo = normalizarTexto(
    `${fragmento.documento_titulo || ''} ${fragmento.seccion || ''} ${fragmento.contenido || ''}`
  );

  let coincidencias = 0;
  for (const palabra of palabrasClave) {
    if (cuerpo.includes(palabra)) {
      coincidencias += 1;
    }
  }

  if (coincidencias === 0) return 0;
  return Math.min(0.08, Number((coincidencias * 0.04).toFixed(4)));
}

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
 * Busca los fragmentos más similares en `fragmentos_documento` combinando
 * similitud coseno semántica y coincidencia léxica normalizada sin tildes.
 * @param {number[]} embeddingConsulta
 * @param {number} limite
 * @param {string} textoConsulta
 * @returns {Promise<Array>}
 */
async function buscarFragmentosSimilares(embeddingConsulta, limite = 4, textoConsulta = '') {
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

  const palabrasClave = extraerPalabrasClave(textoConsulta);

  const resultados = fragmentos
    .map((frag) => {
      const json = frag.toJSON();
      const similitudSemantica = similitudCoseno(embeddingConsulta, json.embedding_json);
      const bonoLexico = calcularBonoLexico(palabrasClave, json);
      const similitudTotal = Math.min(1, similitudSemantica + bonoLexico);

      return {
        ...json,
        similitud_coseno: Number(similitudSemantica.toFixed(6)),
        bono_lexico: bonoLexico,
        similitud: Number(similitudTotal.toFixed(6)),
      };
    })
    .sort((a, b) => b.similitud - a.similitud)
    .slice(0, limite);

  return resultados;
}

module.exports = {
  similitudCoseno,
  buscarFragmentosSimilares,
  normalizarTexto,
};
