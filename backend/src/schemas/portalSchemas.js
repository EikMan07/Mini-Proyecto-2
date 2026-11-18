'use strict';

const { z } = require('zod');

const chatSchema = z.object({
  pregunta: z
    .string({ required_error: 'La pregunta es obligatoria' })
    .trim()
    .min(2, 'La pregunta debe tener al menos 2 caracteres')
    .max(1000, 'La pregunta no debe exceder 1000 caracteres'),
});

const checkInSchema = z.object({
  modalidad: z.enum(['presencial', 'teletrabajo']).default('presencial'),
  estado: z.enum(['presente', 'ausente', 'justificada']).default('presente'),
  comprobante_url: z.string().trim().max(255).optional().nullable(),
  entidad_comprobante: z.enum(['CCSS', 'Clinica', 'INS']).optional().nullable(),
  observacion: z.string().trim().max(500).optional().nullable(),
});

const crearSolicitudSchema = z
  .object({
    tipo: z.enum([
      'vacaciones',
      'permiso_con_goce',
      'permiso_sin_goce',
      'licencia_duelo',
      'licencia_paternidad',
      'estudio',
    ]),
    fecha_inicio: z
      .string({ required_error: 'La fecha de inicio es obligatoria' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_inicio debe tener formato YYYY-MM-DD'),
    fecha_fin: z
      .string({ required_error: 'La fecha de fin es obligatoria' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha_fin debe tener formato YYYY-MM-DD'),
    motivo: z.string().trim().max(1000).optional().nullable(),
  })
  .refine((data) => data.fecha_fin >= data.fecha_inicio, {
    message: 'fecha_fin debe ser igual o posterior a fecha_inicio',
    path: ['fecha_fin'],
  });

const resolverSolicitudSchema = z.object({
  estado: z.enum(['aprobada', 'rechazada']),
  observacion: z.string().trim().max(500).optional(),
});

const idParamSchema = z.object({
  id: z.coerce.number().int().positive('El id debe ser un entero positivo'),
});

module.exports = {
  chatSchema,
  checkInSchema,
  crearSolicitudSchema,
  resolverSolicitudSchema,
  idParamSchema,
};
