'use strict';

const { z } = require('zod');

const textoOpcional = (maxLen) =>
  z.string().trim().max(maxLen).optional().nullable();

const registroSchema = z
  .object({
    nombre: z.string().trim().min(2).max(120).optional(),
    firstName: z.string().trim().min(1).max(80).optional(),
    lastName: z.string().trim().min(1).max(80).optional(),
    email: z
      .string({ required_error: 'El correo electrónico es obligatorio' })
      .trim()
      .toLowerCase()
      .email('Debe ser un correo electrónico válido')
      .max(150),
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(100),
    confirmPassword: z.string().optional(),
    departamento_id: z.coerce.number().int().positive().optional(),
    department: textoOpcional(100),
    puesto: textoOpcional(120),
    position: textoOpcional(120),
    cedula: textoOpcional(20),
    phone: textoOpcional(30),
    birthDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'birthDate debe tener formato YYYY-MM-DD')
      .optional()
      .nullable(),
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate debe tener formato YYYY-MM-DD')
      .optional()
      .nullable(),
    province: textoOpcional(80),
    canton: textoOpcional(80),
    district: textoOpcional(80),
    address: textoOpcional(500),
    company: textoOpcional(120),
    terms: z.boolean().optional(),
    termsAcceptedAt: z.string().trim().max(64).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const nombreCompleto =
      data.nombre || [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
    if (!nombreCompleto || nombreCompleto.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El nombre debe tener al menos 2 caracteres',
        path: ['nombre'],
      });
    }
    if (data.confirmPassword !== undefined && data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Las contraseñas no coinciden',
        path: ['confirmPassword'],
      });
    }
  });

const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .toLowerCase()
    .email('Debe ser un correo electrónico válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
});

module.exports = {
  registroSchema,
  loginSchema,
};
