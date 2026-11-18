'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../models');
const driveService = require('../services/driveService');
const { dividirEnChunks } = require('../utils/chunker');
const { generarEmbeddingsEnLote } = require('../services/embeddingService');
const { AppError } = require('../utils/errors');

const EXTENSIONES_SOPORTADAS = new Set(['.pdf', '.docx', '.xlsx', '.md', '.txt']);
const RUTA_LOCAL_DEFAULT = path.resolve(__dirname, '../../../documentos_drive');

function calcularHashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function listarArchivosLocalesRecursivo(dirBase) {
  if (!fs.existsSync(dirBase)) {
    throw new AppError(404, `La carpeta local ${dirBase} no existe.`, 'CARPETA_NO_ENCONTRADA');
  }

  const encontrados = [];
  const recorrer = (dirActual) => {
    const entradas = fs.readdirSync(dirActual, { withFileTypes: true });
    const nombresEnDir = new Set(entradas.filter((e) => e.isFile()).map((e) => e.name.toLowerCase()));

    for (const entrada of entradas) {
      const rutaCompleta = path.join(dirActual, entrada.name);
      if (entrada.isDirectory()) {
        recorrer(rutaCompleta);
        continue;
      }

      const ext = path.extname(entrada.name).toLowerCase();
      if (!EXTENSIONES_SOPORTADAS.has(ext)) continue;

      // Evita duplicar la copia .md si existe su equivalente .docx en la misma carpeta
      if (ext === '.md') {
        const stem = entrada.name.slice(0, -3).toLowerCase();
        if (nombresEnDir.has(`${stem}.docx`)) {
          continue;
        }
      }

      encontrados.push(rutaCompleta);
    }
  };

  recorrer(dirBase);
  return encontrados.sort();
}

async function indexarDocumentoEnBD({
  driveFileId,
  nombreArchivo,
  texto,
  formato,
  enlaceDrive,
  hashArchivo,
}) {
  const tituloBase = path.basename(nombreArchivo, path.extname(nombreArchivo)).replace(/_/g, ' ');
  const chunks = dividirEnChunks(texto, {
    defaults: { documento_titulo: tituloBase },
  });

  if (chunks.length === 0) {
    return 0;
  }

  const vectores = await generarEmbeddingsEnLote(chunks.map((c) => c.contenido));

  await db.sequelize.transaction(async (transaction) => {
    await db.FragmentoDocumento.destroy({
      where: { drive_file_id: driveFileId },
      transaction,
    });

    // Si estamos indexando desde Google Drive real, reemplaza cualquier copia local previa del mismo título
    if (!String(driveFileId).startsWith('local:')) {
      await db.FragmentoDocumento.destroy({
        where: {
          drive_file_id: { [db.Sequelize.Op.like]: 'local:%' },
          documento_titulo: chunks[0].metadata.documento_titulo,
        },
        transaction,
      });
    }

    const registros = chunks.map((chunk, idx) => ({
      drive_file_id: driveFileId,
      documento_titulo: chunk.metadata.documento_titulo,
      formato,
      version: chunk.metadata.version,
      fecha_vigencia: chunk.metadata.fecha_vigencia,
      responsable: chunk.metadata.responsable,
      seccion: chunk.seccion,
      enlace_drive: enlaceDrive,
      indice_fragmento: chunk.indice_fragmento,
      contenido: chunk.contenido,
      tokens_estimados: chunk.tokens_estimados,
      embedding_json: vectores[idx],
      hash_archivo: hashArchivo,
    }));

    await db.FragmentoDocumento.bulkCreate(registros, { transaction });
  });

  return chunks.length;
}

/**
 * Sincroniza políticas desde Google Drive API usando changes.list y embeddings de Gemini.
 */
async function sincronizarDesdeDrive() {
  const {
    drive,
    state,
    archivosActivos,
    agregadosOActualizados,
    eliminados,
    nuevoPageToken,
  } = await driveService.obtenerCambiosDrive();

  let fragmentosInsertados = 0;
  let archivosProcesados = 0;
  let archivosEliminados = 0;

  for (const fileId of eliminados) {
    await db.FragmentoDocumento.destroy({ where: { drive_file_id: fileId } });
    delete archivosActivos[fileId];
    archivosEliminados += 1;
  }

  const nombresDrive = new Set(
    agregadosOActualizados.map((f) => String(f.name || '').toLowerCase())
  );

  for (const file of agregadosOActualizados) {
    const nombreLower = String(file.name || '').toLowerCase();
    // Evita duplicar la copia .md si su equivalente .docx existe en la misma carpeta de Drive
    if (nombreLower.endsWith('.md') && nombresDrive.has(nombreLower.slice(0, -3) + '.docx')) {
      continue;
    }

    const hashActual = file.md5Checksum || file.modifiedTime || '';
    const previo = archivosActivos[file.id];
    if (previo && previo.hash === hashActual && hashActual !== '') {
      continue;
    }

    const { texto, formato } = await driveService.descargarYExtraerTexto(drive, file);
    const totalChunks = await indexarDocumentoEnBD({
      driveFileId: file.id,
      nombreArchivo: file.name,
      texto,
      formato,
      enlaceDrive: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      hashArchivo: hashActual,
    });

    archivosActivos[file.id] = {
      nombre: file.name,
      hash: hashActual,
      modifiedTime: file.modifiedTime || null,
      fragmentos: totalChunks,
    };
    fragmentosInsertados += totalChunks;
    archivosProcesados += 1;
  }

  await state.update({
    page_token: nuevoPageToken,
    ultima_sincronizacion: new Date(),
    archivos_activos: archivosActivos,
  });

  return {
    origen: 'google_drive',
    archivos_procesados: archivosProcesados,
    archivos_eliminados: archivosEliminados,
    fragmentos_indexados: fragmentosInsertados,
    page_token: nuevoPageToken,
  };
}

/**
 * Sincroniza políticas desde la carpeta local documentos_drive/ para validar chunking y Gemini Embeddings.
 */
async function sincronizarCarpetaLocal(rutaCarpeta = RUTA_LOCAL_DEFAULT, { forzar = false } = {}) {
  const archivos = listarArchivosLocalesRecursivo(rutaCarpeta);
  const [state] = await db.DriveSyncState.findOrCreate({
    where: { folder_id: 'local:documentos_drive' },
    defaults: {
      folder_id: 'local:documentos_drive',
      page_token: null,
      ultima_sincronizacion: null,
      archivos_activos: {},
    },
  });

  const archivosActivos = { ...(state.archivos_activos || {}) };
  const idsPresentes = new Set();

  let archivosProcesados = 0;
  let archivosOmitidos = 0;
  let fragmentosIndexados = 0;
  const detalle = [];

  for (const rutaArchivo of archivos) {
    const rel = path.relative(rutaCarpeta, rutaArchivo).replace(/\\/g, '/');
    const driveFileId = `local:${rel}`;
    idsPresentes.add(driveFileId);

    const buffer = fs.readFileSync(rutaArchivo);
    const hash = calcularHashBuffer(buffer);
    const previo = archivosActivos[driveFileId];

    if (!forzar && previo && previo.hash === hash) {
      archivosOmitidos += 1;
      continue;
    }

    const { texto, formato } = await driveService.extraerTextoDeBuffer(
      buffer,
      '',
      path.basename(rutaArchivo)
    );

    const numChunks = await indexarDocumentoEnBD({
      driveFileId,
      nombreArchivo: path.basename(rutaArchivo),
      texto,
      formato,
      enlaceDrive: `local://documentos_drive/${rel}`,
      hashArchivo: hash,
    });

    archivosActivos[driveFileId] = {
      nombre: rel,
      formato,
      hash,
      fragmentos: numChunks,
    };

    archivosProcesados += 1;
    fragmentosIndexados += numChunks;
    detalle.push({ archivo: rel, formato, fragmentos: numChunks });
  }

  // Limpiar archivos locales que ya no existan en la carpeta
  let archivosEliminados = 0;
  for (const fileId of Object.keys(archivosActivos)) {
    if (!idsPresentes.has(fileId)) {
      await db.FragmentoDocumento.destroy({ where: { drive_file_id: fileId } });
      delete archivosActivos[fileId];
      archivosEliminados += 1;
    }
  }

  await state.update({
    ultima_sincronizacion: new Date(),
    archivos_activos: archivosActivos,
  });

  return {
    origen: 'local',
    carpeta: rutaCarpeta,
    archivos_procesados: archivosProcesados,
    archivos_omitidos_sin_cambios: archivosOmitidos,
    archivos_eliminados: archivosEliminados,
    fragmentos_indexados: fragmentosIndexados,
    detalle,
  };
}

async function obtenerEstadoIngesta() {
  const totalFragmentos = await db.FragmentoDocumento.count();
  const docsAgrupados = await db.FragmentoDocumento.findAll({
    attributes: [
      'drive_file_id',
      'documento_titulo',
      'formato',
      'version',
      'fecha_vigencia',
      'responsable',
      [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'cantidad_fragmentos'],
    ],
    group: [
      'drive_file_id',
      'documento_titulo',
      'formato',
      'version',
      'fecha_vigencia',
      'responsable',
    ],
    order: [['documento_titulo', 'ASC']],
  });

  const estadosSync = await db.DriveSyncState.findAll({
    order: [['ultima_sincronizacion', 'DESC']],
  });

  const ultimaSync = estadosSync.find((s) => s.ultima_sincronizacion)?.ultima_sincronizacion || null;

  return {
    total_documentos: docsAgrupados.length,
    total_fragmentos: totalFragmentos,
    ultima_sincronizacion: ultimaSync,
    estados_sincronizacion: estadosSync.map((s) => ({
      folder_id: s.folder_id,
      tiene_page_token: Boolean(s.page_token),
      ultima_sincronizacion: s.ultima_sincronizacion,
    })),
    documentos: docsAgrupados,
  };
}

module.exports = {
  sincronizarDesdeDrive,
  sincronizarCarpetaLocal,
  obtenerEstadoIngesta,
};
