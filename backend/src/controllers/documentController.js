'use strict';

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const db = require('../models');
const { ForbiddenError, ValidationError } = require('../utils/errors');
const { subirComprobanteSchema } = require('../schemas/portalSchemas');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/comprobantes');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ETIQUETA_ESTADO_DOC = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

const ETIQUETA_TIPO_JUSTIFICACION = {
  incapacidad_ccss: 'Incapacidad CCSS',
  incapacidad_ins: 'Incapacidad INS',
  cita_medica: 'Cita médica o emergencias',
  duelo_familiar: 'Duelo por fallecimiento de familiar',
  citacion_judicial: 'Citación judicial o deber cívico',
  licencia_maternidad_paternidad: 'Licencia de maternidad o paternidad',
  fuerza_mayor: 'Fuerza mayor o calamidad doméstica',
};

function formatearDocumento(doc) {
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  const nombreColaborador =
    json.colaborador?.nombre || doc.colaborador?.nombre || 'Colaborador';
  const tipoJustificacion = json.tipo_justificacion || 'incapacidad_ccss';
  return {
    id: json.id,
    colaborador_id: json.colaborador_id,
    name: json.nombre_archivo,
    nombre_archivo: json.nombre_archivo,
    type: json.tipo_mime,
    size: json.tamano_bytes,
    person: nombreColaborador,
    status: ETIQUETA_ESTADO_DOC[json.estado] || 'Pendiente',
    estado: json.estado,
    tipo_justificacion: tipoJustificacion,
    tipo_justificacion_etiqueta:
      ETIQUETA_TIPO_JUSTIFICACION[tipoJustificacion] || 'Justificación de ausencia',
    fecha_inicio_ausencia: json.fecha_inicio_ausencia || null,
    fecha_fin_ausencia: json.fecha_fin_ausencia || null,
    observacion: json.observacion || null,
    observacion_rrhh: json.observacion_rrhh || null,
    uploadedAt: json.created_at || json.createdAt,
    url: `/api/documents/${json.id}/archivo`,
  };
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename(req, file, cb) {
    const base = path
      .basename(file.originalname || 'comprobante')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
    const usuarioId = req.usuario?.id || 'anon';
    cb(null, `${usuarioId}-${Date.now()}-${base}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const mime = String(file.mimetype || '').toLowerCase();
    if (mime.startsWith('image/') || mime === 'application/pdf') {
      return cb(null, true);
    }
    return cb(new ValidationError('Solo se permiten imágenes o documentos PDF de hasta 5 MB.'));
  },
});

exports.uploadMiddleware = upload.single('file');

exports.subir = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('Debes adjuntar un archivo en el campo file.');
    }

    const validacion = subirComprobanteSchema.safeParse(req.body || {});
    if (!validacion.success) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      const detalle = validacion.error.errors?.[0]?.message || 'Datos de justificación inválidos.';
      throw new ValidationError(detalle);
    }

    const {
      tipo_justificacion: tipoJustificacion,
      fecha_inicio_ausencia: fechaInicio,
      fecha_fin_ausencia: fechaFin,
      observacion,
    } = validacion.data;

    const rutaRelativa = path.posix.join('uploads/comprobantes', req.file.filename);
    const creado = await db.ComprobanteMedico.create({
      colaborador_id: req.usuario.id,
      nombre_archivo: req.file.originalname,
      tipo_mime: req.file.mimetype,
      tamano_bytes: req.file.size,
      ruta_archivo: rutaRelativa,
      estado: 'pendiente',
      tipo_justificacion: tipoJustificacion,
      fecha_inicio_ausencia: fechaInicio,
      fecha_fin_ausencia: fechaFin,
      observacion,
    });

    const completo = await db.ComprobanteMedico.findOne({
      where: { id: creado.id },
      include: [{ model: db.Colaborador, as: 'colaborador', attributes: ['id', 'nombre', 'email'] }],
    });

    const documento = formatearDocumento(completo || creado);
    return res.status(201).json({
      mensaje: 'Comprobante médico recibido exitosamente',
      ...documento,
      comprobante: documento,
    });
  } catch (error) {
    return next(error);
  }
};

exports.listar = async (req, res, next) => {
  try {
    const where = req.usuario.rol === 'rrhh' ? {} : { colaborador_id: req.usuario.id };
    const filas = await db.ComprobanteMedico.findAll({
      where,
      include: [
        { model: db.Colaborador, as: 'colaborador', attributes: ['id', 'nombre', 'email'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    const documents = filas.map(formatearDocumento);
    return res.status(200).json({
      total: documents.length,
      documents,
      comprobantes: documents,
    });
  } catch (error) {
    return next(error);
  }
};

exports.descargar = async (req, res, next) => {
  try {
    const doc = await db.ComprobanteMedico.findByPk(Number(req.params.id));
    if (!doc) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Comprobante no encontrado.' });
    }

    if (req.usuario.rol !== 'rrhh' && doc.colaborador_id !== req.usuario.id) {
      throw new ForbiddenError('No tienes permisos para acceder a este comprobante.');
    }

    const nombreSeguro = path.basename(doc.ruta_archivo);
    const absPath = path.resolve(UPLOADS_DIR, nombreSeguro);
    if (!absPath.startsWith(UPLOADS_DIR) || !fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'El archivo no existe en el servidor.' });
    }

    res.type(doc.tipo_mime);
    return res.sendFile(absPath);
  } catch (error) {
    return next(error);
  }
};

exports.actualizarEstado = async (req, res, next) => {
  try {
    const doc = await db.ComprobanteMedico.findByPk(Number(req.params.id), {
      include: [{ model: db.Colaborador, as: 'colaborador', attributes: ['id', 'nombre', 'email'] }],
    });
    if (!doc) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Comprobante no encontrado.' });
    }

    await doc.update({
      estado: req.body.estado,
      observacion_rrhh: req.body.observacion_rrhh ?? doc.observacion_rrhh,
      revisado_por: req.usuario.id,
    });

    const documento = formatearDocumento(doc);
    return res.status(200).json({
      mensaje: `Comprobante ${doc.estado} exitosamente`,
      ...documento,
      comprobante: documento,
    });
  } catch (error) {
    return next(error);
  }
};

exports.formatearDocumento = formatearDocumento;
