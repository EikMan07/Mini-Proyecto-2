'use strict';

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const { Op } = require('sequelize');
const { DriveSyncState } = require('../models');
const { AppError } = require('../utils/errors');

const DRIVE_SCOPE = ['https://www.googleapis.com/auth/drive.readonly'];

function validarConfiguracionDrive() {
  const folderId = (process.env.GOOGLE_DRIVE_FOLDER_ID || '').trim();
  if (!folderId || folderId === 'PENDIENTE_CONFIGURAR_POR_EIKER') {
    throw new AppError(
      400,
      'Falta configurar GOOGLE_DRIVE_FOLDER_ID en backend/.env para sincronizar con Google Drive.',
      'DRIVE_CONFIG_INCOMPLETA'
    );
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(folderId)) {
    throw new AppError(
      400,
      'GOOGLE_DRIVE_FOLDER_ID contiene caracteres inválidos.',
      'DRIVE_FOLDER_ID_INVALIDO'
    );
  }

  const credEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS || './credenciales/miniproyecto-515114-b12d28da88e8.json';
  const credPath = path.isAbsolute(credEnv)
    ? credEnv
    : path.resolve(__dirname, '../../', credEnv);

  if (!fs.existsSync(credPath)) {
    throw new AppError(
      400,
      `No se encontró el archivo de credenciales de servicio en ${credPath}. Coloca el JSON de cuenta de servicio en backend/credenciales/ para usar Google Drive API.`,
      'DRIVE_CREDENCIALES_FALTANTES'
    );
  }

  return { folderId, credPath };
}

function crearClienteDrive() {
  const { folderId, credPath } = validarConfiguracionDrive();
  const auth = new google.auth.GoogleAuth({
    keyFile: credPath,
    scopes: DRIVE_SCOPE,
  });
  const drive = google.drive({ version: 'v3', auth });
  return { drive, folderId };
}

function detectarFormatoPorArchivo(mimeType, nombreArchivo = '') {
  const lower = String(nombreArchivo).toLowerCase();
  if (mimeType === 'application/vnd.google-apps.document') return 'gdoc';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'gsheet';
  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) return 'pdf';
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    return 'docx';
  }
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    lower.endsWith('.xlsx')
  ) {
    return 'xlsx';
  }
  if (lower.endsWith('.md') || mimeType === 'text/markdown') return 'md';
  return 'md';
}

async function extraerTextoDeBuffer(buffer, mimeType, nombreArchivo = '') {
  const formato = detectarFormatoPorArchivo(mimeType, nombreArchivo);

  if (formato === 'pdf') {
    // Copia a Uint8Array con byteOffset 0 para evitar bugs de slab en pdf-parse/pdf.js
    const uint8 = new Uint8Array(buffer.length);
    uint8.set(buffer);
    const data = await pdfParse(uint8);
    return { texto: data.text || '', formato };
  }

  if (formato === 'docx') {
    const res = await mammoth.extractRawText({ buffer });
    return { texto: res.value || '', formato };
  }

  if (formato === 'xlsx') {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const bloques = [];
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      const lineas = rows
        .map((r) => r.map((celda) => String(celda).trim()).filter(Boolean).join(' | '))
        .filter(Boolean);
      if (lineas.length > 0) {
        bloques.push(`## HOJA: ${sheetName}\n${lineas.join('\n')}`);
      }
    }
    return { texto: bloques.join('\n\n'), formato };
  }

  return { texto: buffer.toString('utf8'), formato };
}

/**
 * Obtiene los cambios incrementales en Google Drive usando `changes.list` y `page_token` persistente.
 */
async function obtenerCambiosDrive({ forzarCompleto = false } = {}) {
  const { drive, folderId } = crearClienteDrive();

  const estadosPreviosDistintos = await DriveSyncState.destroy({
    where: { folder_id: { [Op.ne]: folderId } },
  });

  const [state] = await DriveSyncState.findOrCreate({
    where: { folder_id: folderId },
    defaults: {
      folder_id: folderId,
      page_token: null,
      ultima_sincronizacion: null,
      archivos_activos: {},
    },
  });

  const requiereReinicio = Boolean(forzarCompleto || estadosPreviosDistintos > 0);
  if (requiereReinicio && state.page_token) {
    await state.update({ page_token: null, archivos_activos: {} });
  }

  const archivosActivos = requiereReinicio ? {} : { ...(state.archivos_activos || {}) };

  // Primera sincronización o reseteo completo: listar archivos actuales de la carpeta y capturar startPageToken
  if (!state.page_token) {
    const agregadosOActualizados = [];
    let nextPageToken = null;

    do {
      const resp = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields:
          'nextPageToken, files(id, name, mimeType, md5Checksum, modifiedTime, webViewLink, trashed, parents)',
        pageSize: 200,
        pageToken: nextPageToken || undefined,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const files = resp.data.files || [];
      for (const f of files) {
        if (f.mimeType !== 'application/vnd.google-apps.folder') {
          agregadosOActualizados.push(f);
        }
      }
      nextPageToken = resp.data.nextPageToken || null;
    } while (nextPageToken);

    const tokenResp = await drive.changes.getStartPageToken({
      supportsAllDrives: true,
    });

    return {
      drive,
      folderId,
      sincronizacionCompleta: true,
      state,
      archivosActivos,
      agregadosOActualizados,
      eliminados: [],
      nuevoPageToken: tokenResp.data.startPageToken,
    };
  }

  // Sincronización incremental vía drive.changes.list
  let pageToken = state.page_token;
  let nuevoPageToken = pageToken;
  const mapaActualizados = new Map();
  const eliminadosSet = new Set();

  do {
    const resp = await drive.changes.list({
      pageToken,
      fields:
        'nextPageToken, newStartPageToken, changes(fileId, removed, file(id, name, mimeType, trashed, parents, md5Checksum, modifiedTime, webViewLink))',
      includeRemoved: true,
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const changes = resp.data.changes || [];
    for (const ch of changes) {
      const fileId = ch.fileId;
      const file = ch.file;

      if (ch.removed || !file || file.trashed) {
        if (archivosActivos[fileId]) {
          eliminadosSet.add(fileId);
          mapaActualizados.delete(fileId);
        }
        continue;
      }

      if (file.mimeType === 'application/vnd.google-apps.folder') {
        continue;
      }

      const enCarpeta = Array.isArray(file.parents) && file.parents.includes(folderId);
      if (enCarpeta) {
        mapaActualizados.set(fileId, file);
        eliminadosSet.delete(fileId);
      } else if (archivosActivos[fileId]) {
        // Movido fuera de la carpeta monitoreada
        eliminadosSet.add(fileId);
        mapaActualizados.delete(fileId);
      }
    }

    if (resp.data.newStartPageToken) {
      nuevoPageToken = resp.data.newStartPageToken;
    }
    pageToken = resp.data.nextPageToken || null;
  } while (pageToken);

  return {
    drive,
    folderId,
    sincronizacionCompleta: false,
    state,
    archivosActivos,
    agregadosOActualizados: Array.from(mapaActualizados.values()),
    eliminados: Array.from(eliminadosSet),
    nuevoPageToken,
  };
}

/**
 * Descarga o exporta un archivo de Google Drive y extrae su texto plano estructurado.
 */
async function descargarYExtraerTexto(drive, file) {
  const mimeType = file.mimeType || '';

  if (mimeType === 'application/vnd.google-apps.document') {
    const res = await drive.files.export(
      { fileId: file.id, mimeType: 'text/plain' },
      { responseType: 'arraybuffer' }
    );
    const buffer = Buffer.from(res.data);
    return { texto: buffer.toString('utf8'), formato: 'gdoc' };
  }

  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    const res = await drive.files.export(
      { fileId: file.id, mimeType: 'text/csv' },
      { responseType: 'arraybuffer' }
    );
    const buffer = Buffer.from(res.data);
    return { texto: buffer.toString('utf8'), formato: 'gsheet' };
  }

  const res = await drive.files.get(
    { fileId: file.id, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' }
  );
  const buffer = Buffer.from(res.data);
  return extraerTextoDeBuffer(buffer, mimeType, file.name);
}

module.exports = {
  validarConfiguracionDrive,
  detectarFormatoPorArchivo,
  extraerTextoDeBuffer,
  obtenerCambiosDrive,
  descargarYExtraerTexto,
};
