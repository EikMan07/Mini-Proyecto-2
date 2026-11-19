'use strict';

const { z } = require('zod');

const MAPEO_TIPO_SOLICITUD = {
  vacaciones: 'vacaciones',
  Vacaciones: 'vacaciones',
  permiso_con_goce: 'permiso_con_goce',
  'Permiso personal': 'permiso_con_goce',
  permiso_sin_goce: 'permiso_sin_goce',
  licencia_duelo: 'licencia_duelo',
  licencia_paternidad: 'licencia_paternidad',
  estudio: 'estudio',
  'Permiso de estudio': 'estudio',
};

const MAPEO_ESTADO_SOLICITUD = {
  aprobada: 'aprobada',
  Aprobada: 'aprobada',
  approved: 'aprobada',
  rechazada: 'rechazada',
  Rechazada: 'rechazada',
  rejected: 'rechazada',
};

const MAPEO_ESTADO_DOCUMENTO = {
  pendiente: 'pendiente',
  Pendiente: 'pendiente',
  aprobado: 'aprobado',
  Aprobado: 'aprobado',
  rechazado: 'rechazado',
  Rechazado: 'rechazado',
};

const chatSchema = z
  .object({
    pregunta: z.string().trim().min(2).max(1000).optional(),
    question: z.string().trim().min(2).max(1000).optional(),
  })
  .transform((data) => ({
    pregunta: data.pregunta || data.question || '',
  }))
  .refine((data) => data.pregunta.length >= 2 && data.pregunta.length <= 1000, {
    message: 'La pregunta debe tener entre 2 y 1000 caracteres',
    path: ['pregunta'],
  });

const checkInSchema = z
  .object({
    modalidad: z.enum(['presencial', 'teletrabajo']).default('presencial'),
    estado: z.enum(['presente', 'ausente', 'justificada']).default('presente'),
    comprobante_url: z.string().trim().max(255).optional().nullable(),
    entidad_comprobante: z.enum(['CCSS', 'Clinica', 'INS']).optional().nullable(),
    observacion: z.string().trim().max(500).optional().nullable(),
  })
  .default({});

function obtenerHoyCostaRica() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Costa_Rica' }).format(new Date());
}

const crearSolicitudSchema = z
  .object({
    tipo: z.string().trim().optional(),
    type: z.string().trim().optional(),
    fecha_inicio: z.string().trim().optional(),
    startDate: z.string().trim().optional(),
    fecha_fin: z.string().trim().optional(),
    endDate: z.string().trim().optional(),
    motivo: z.string().trim().max(1000).optional().nullable(),
    reason: z.string().trim().max(1000).optional().nullable(),
    dates: z.string().trim().optional(),
    days: z.coerce.number().optional(),
  })
  .transform((data) => {
    const rawTipo = data.tipo || data.type || '';
    const tipo = MAPEO_TIPO_SOLICITUD[rawTipo] || MAPEO_TIPO_SOLICITUD[rawTipo.toLowerCase()];
    const fecha_inicio = data.fecha_inicio || data.startDate || '';
    const fecha_fin = data.fecha_fin || data.endDate || '';
    const motivo = data.motivo ?? data.reason ?? null;
    return {
      tipo,
      fecha_inicio,
      fecha_fin,
      motivo: motivo ? String(motivo).trim() : null,
    };
  })
  .superRefine((data, ctx) => {
    if (!data.tipo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El tipo de solicitud no es válido',
        path: ['tipo'],
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha_inicio)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fecha_inicio debe tener formato YYYY-MM-DD',
        path: ['fecha_inicio'],
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha_fin)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fecha_fin debe tener formato YYYY-MM-DD',
        path: ['fecha_fin'],
      });
    }
    if (data.fecha_inicio && data.fecha_fin && data.fecha_fin < data.fecha_inicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fecha_fin debe ser igual o posterior a fecha_inicio',
        path: ['fecha_fin'],
      });
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(data.fecha_inicio)) {
      const hoy = obtenerHoyCostaRica();
      if (data.fecha_inicio < hoy) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'No puedes seleccionar fechas que ya hayan pasado.',
          path: ['fecha_inicio'],
        });
      }
    }
  });

const resolverSolicitudSchema = z
  .object({
    estado: z.string().trim().optional(),
    status: z.string().trim().optional(),
    motivo_rechazo: z.string().trim().max(1000).optional().nullable(),
    rejectionReason: z.string().trim().max(1000).optional().nullable(),
    comentario_rrhh: z.string().trim().max(1000).optional().nullable(),
    observacion: z.string().trim().max(1000).optional().nullable(),
    reviewNote: z.string().trim().max(1000).optional().nullable(),
  })
  .transform((data) => {
    const rawEstado = data.estado || data.status || '';
    const motivoRaw =
      data.motivo_rechazo ??
      data.rejectionReason ??
      data.comentario_rrhh ??
      data.observacion ??
      data.reviewNote ??
      '';
    const motivoLimpio = String(motivoRaw || '').trim();
    return {
      estado: MAPEO_ESTADO_SOLICITUD[rawEstado] || MAPEO_ESTADO_SOLICITUD[rawEstado.toLowerCase()],
      motivo_rechazo: motivoLimpio || null,
      observacion: motivoLimpio || undefined,
    };
  })
  .superRefine((data, ctx) => {
    if (data.estado !== 'aprobada' && data.estado !== 'rechazada') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El estado debe ser 'aprobada' o 'rechazada'",
        path: ['estado'],
      });
      return;
    }

    if (data.estado === 'rechazada' && String(data.motivo_rechazo || '').trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes indicar el motivo del rechazo de la solicitud.',
        path: ['motivo_rechazo'],
      });
    }
  });

const resolverDocumentoSchema = z
  .object({
    estado: z.string().trim().optional(),
    status: z.string().trim().optional(),
    observacion_rrhh: z.string().trim().max(500).optional().nullable(),
    reviewNote: z.string().trim().max(500).optional().nullable(),
  })
  .transform((data) => {
    const rawEstado = data.estado || data.status || '';
    return {
      estado: MAPEO_ESTADO_DOCUMENTO[rawEstado] || MAPEO_ESTADO_DOCUMENTO[rawEstado.toLowerCase()],
      observacion_rrhh: data.observacion_rrhh ?? data.reviewNote ?? null,
    };
  })
  .refine((data) => ['pendiente', 'aprobado', 'rechazado'].includes(data.estado), {
    message: "El estado del comprobante debe ser 'pendiente', 'aprobado' o 'rechazado'",
    path: ['estado'],
  });

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('El id debe ser un entero positivo'),
});

const TIPOS_JUSTIFICACION = [
  'incapacidad_ccss',
  'incapacidad_ins',
  'cita_medica',
  'duelo_familiar',
  'citacion_judicial',
  'licencia_maternidad_paternidad',
  'fuerza_mayor',
];

const subirComprobanteSchema = z
  .object({
    tipo_justificacion: z.string().trim().optional(),
    fecha_inicio: z.string().trim().optional().nullable(),
    fecha_inicio_ausencia: z.string().trim().optional().nullable(),
    fecha_fin: z.string().trim().optional().nullable(),
    fecha_fin_ausencia: z.string().trim().optional().nullable(),
    observacion: z.string().trim().max(1000).optional().nullable(),
  })
  .transform((data) => {
    const tipo = data.tipo_justificacion || 'incapacidad_ccss';
    const fechaInicio = data.fecha_inicio_ausencia || data.fecha_inicio || null;
    const fechaFin = data.fecha_fin_ausencia || data.fecha_fin || fechaInicio || null;
    const obs = data.observacion ? String(data.observacion).trim() : null;
    return {
      tipo_justificacion: tipo,
      fecha_inicio_ausencia: fechaInicio || null,
      fecha_fin_ausencia: fechaFin || null,
      observacion: obs || null,
    };
  })
  .superRefine((data, ctx) => {
    if (!TIPOS_JUSTIFICACION.includes(data.tipo_justificacion)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El tipo de justificación laboral no es válido.',
        path: ['tipo_justificacion'],
      });
    }
    if (
      data.fecha_inicio_ausencia &&
      !/^\d{4}-\d{2}-\d{2}$/.test(data.fecha_inicio_ausencia)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fecha_inicio_ausencia debe tener formato YYYY-MM-DD',
        path: ['fecha_inicio_ausencia'],
      });
    }
    if (
      data.fecha_fin_ausencia &&
      !/^\d{4}-\d{2}-\d{2}$/.test(data.fecha_fin_ausencia)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fecha_fin_ausencia debe tener formato YYYY-MM-DD',
        path: ['fecha_fin_ausencia'],
      });
    }
    if (
      data.fecha_inicio_ausencia &&
      data.fecha_fin_ausencia &&
      data.fecha_fin_ausencia < data.fecha_inicio_ausencia
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha final debe ser igual o posterior a la fecha inicial.',
        path: ['fecha_fin_ausencia'],
      });
    }
  });

module.exports = {
  chatSchema,
  checkInSchema,
  crearSolicitudSchema,
  resolverSolicitudSchema,
  resolverDocumentoSchema,
  subirComprobanteSchema,
  TIPOS_JUSTIFICACION,
  idParamSchema,
};
