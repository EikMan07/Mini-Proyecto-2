'use strict';

const CHARS_POR_TOKEN = 4;
const DEFAULT_MAX_TOKENS = 900; // Dentro del rango objetivo 500-1000 tokens
const DEFAULT_OVERLAP_TOKENS = 100;

function estimarTokens(texto) {
  if (!texto) return 0;
  return Math.max(1, Math.ceil(texto.length / CHARS_POR_TOKEN));
}

function normalizarFechaVigencia(valor) {
  if (!valor) return new Date().toISOString().slice(0, 10);
  const limpio = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpio)) {
    return limpio;
  }
  const matchDMY = limpio.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (matchDMY) {
    return `${matchDMY[3]}-${matchDMY[2]}-${matchDMY[1]}`;
  }
  const parsed = new Date(limpio);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Extrae metadatos del encabezado del texto (soporta texto plano, Markdown y filas CSV/XLSX).
 * @param {string} texto
 * @param {object} defaults
 */
function extraerMetadatos(texto, defaults = {}) {
  const primerasLineas = String(texto || '')
    .split(/\r?\n/)
    .slice(0, 35)
    .join('\n');

  const buscarCampo = (patrones) => {
    for (const patron of patrones) {
      const m = primerasLineas.match(patron);
      if (m && m[1]) {
        return m[1].replace(/^[\s,"'|;\t]+|[\s,"'|;\t]+$/g, '').trim();
      }
    }
    return '';
  };

  const titulo =
    buscarCampo([
      /^\s*t[ií]tulo\s*[:|\t,;]+\s*(.+)$/im,
    ]) ||
    defaults.documento_titulo ||
    'Documento de Politica RRHH';

  const version =
    buscarCampo([
      /^\s*versi[oó]n\s*[:|\t,;]+\s*(.+)$/im,
    ]) ||
    defaults.version ||
    'v1.0';

  const fechaCruda = buscarCampo([
    /^\s*fecha\s+de\s+vigencia\s*[:|\t,;]+\s*(.+)$/im,
    /^\s*vigencia\s*[:|\t,;]+\s*(.+)$/im,
  ]);

  const responsable =
    buscarCampo([
      /^\s*responsable\s*[:|\t,;]+\s*(.+)$/im,
    ]) ||
    defaults.responsable ||
    'Recursos Humanos TicoSoft';

  return {
    documento_titulo: titulo.slice(0, 200),
    version: version.slice(0, 30),
    fecha_vigencia: normalizarFechaVigencia(fechaCruda || defaults.fecha_vigencia),
    responsable: responsable.slice(0, 120),
  };
}

function esEncabezadoSeccion(linea) {
  const trimmed = linea.trim();
  if (!trimmed) return false;
  if (/^#{1,3}\s+\S+/.test(trimmed)) return true;
  if (/^HOJA:\s+\S+/i.test(trimmed)) return true;
  if (/^\d+(?:\.\d+)?\.\s+[A-ZÁÉÍÓÚÑ0-9]/.test(trimmed) && trimmed.length <= 120) return true;
  return false;
}

function dividirTextoConSolapamiento(texto, maxChars, overlapChars) {
  const limpio = texto.trim();
  if (limpio.length <= maxChars) {
    return [limpio];
  }

  const partes = [];
  let inicio = 0;

  while (inicio < limpio.length) {
    let fin = Math.min(inicio + maxChars, limpio.length);

    if (fin < limpio.length) {
      // Buscar corte natural en salto de línea o fin de oración dentro del último 30% del bloque
      const ventanaMin = inicio + Math.floor(maxChars * 0.65);
      const ultimoSalto = limpio.lastIndexOf('\n', fin);
      const ultimoPunto = limpio.lastIndexOf('. ', fin);

      if (ultimoSalto >= ventanaMin) {
        fin = ultimoSalto + 1;
      } else if (ultimoPunto >= ventanaMin) {
        fin = ultimoPunto + 2;
      } else {
        const ultimoEspacio = limpio.lastIndexOf(' ', fin);
        if (ultimoEspacio >= ventanaMin) {
          fin = ultimoEspacio + 1;
        }
      }
    }

    const fragmento = limpio.slice(inicio, fin).trim();
    if (fragmento) {
      partes.push(fragmento);
    }

    if (fin >= limpio.length) break;
    const siguienteInicio = Math.max(fin - overlapChars, inicio + 1);
    inicio = siguienteInicio;
  }

  return partes;
}

/**
 * Divide un documento en fragmentos estructurados de 500-1000 tokens estimados
 * con solapamiento de ~100 tokens y preservación de sección y metadatos.
 *
 * @param {string} texto
 * @param {object} opciones
 */
function dividirEnChunks(texto, opciones = {}) {
  const maxTokens = opciones.maxTokens || DEFAULT_MAX_TOKENS;
  const overlapTokens = opciones.overlapTokens || DEFAULT_OVERLAP_TOKENS;
  const maxChars = maxTokens * CHARS_POR_TOKEN;
  const overlapChars = overlapTokens * CHARS_POR_TOKEN;

  const textoNormalizado = String(texto || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!textoNormalizado) {
    return [];
  }

  const metadata = extraerMetadatos(textoNormalizado, opciones.defaults || {});
  const lineas = textoNormalizado.split('\n');

  const secciones = [];
  let seccionActual = 'General / Encabezado';
  let buffer = [];

  for (const linea of lineas) {
    if (esEncabezadoSeccion(linea)) {
      const contenidoPrevio = buffer.join('\n').trim();
      if (contenidoPrevio) {
        secciones.push({ seccion: seccionActual, contenido: contenidoPrevio });
      }
      seccionActual = linea.trim().replace(/^#+\s*/, '').slice(0, 200);
      buffer = [linea];
    } else {
      buffer.push(linea);
    }
  }

  const ultimoContenido = buffer.join('\n').trim();
  if (ultimoContenido) {
    secciones.push({ seccion: seccionActual, contenido: ultimoContenido });
  }

  // Fusionar secciones muy cortas consecutivas solo si juntas caben dentro de ~750 tokens y son del encabezado
  const seccionesAgrupadas = [];
  for (const sec of secciones) {
    const prev = seccionesAgrupadas[seccionesAgrupadas.length - 1];
    const esEncabezadoInicial = prev && prev.seccion === 'General / Encabezado';
    if (
      esEncabezadoInicial &&
      estimarTokens(prev.contenido) + estimarTokens(sec.contenido) <= 750
    ) {
      prev.seccion = sec.seccion;
      prev.contenido = `${prev.contenido}\n\n${sec.contenido}`.trim();
    } else {
      seccionesAgrupadas.push({ ...sec });
    }
  }

  const chunks = [];
  let indice = 0;

  for (const sec of seccionesAgrupadas) {
    const subPartes = dividirTextoConSolapamiento(sec.contenido, maxChars, overlapChars);
    for (const parte of subPartes) {
      const contenidoFinal = `[Documento: ${metadata.documento_titulo} | Seccion: ${sec.seccion}]\n${parte}`;
      chunks.push({
        seccion: sec.seccion,
        indice_fragmento: indice,
        contenido: contenidoFinal,
        tokens_estimados: estimarTokens(contenidoFinal),
        metadata,
      });
      indice += 1;
    }
  }

  return chunks;
}

module.exports = {
  estimarTokens,
  extraerMetadatos,
  dividirEnChunks,
};
