const { z } = require('zod');
const { PRIORIDADES, ESTADOS } = require('../models/solicitud.model');

const uuid = z.string().uuid('El identificador debe ser un UUID válido');

const texto = (min, max, nombre) =>
  z
    .string({ required_error: `${nombre} es obligatorio` })
    .trim()
    .min(min, `${nombre} debe tener al menos ${min} caracteres`)
    .max(max, `${nombre} no puede superar ${max} caracteres`);

const crearSolicitudSchema = z.object({
  equipo_id: uuid,
  solicitante: texto(3, 120, 'El solicitante'),
  descripcion: texto(10, 2000, 'La descripción'),
  prioridad: z.enum(PRIORIDADES, {
    message: 'Prioridad inválida. Use BAJA, MEDIA o ALTA',
  }),
});

const actualizarSolicitudSchema = crearSolicitudSchema;

const cambiarEstadoSchema = z.object({
  estado: z.enum(ESTADOS, {
    message: 'Estado inválido. Use PENDIENTE, EN_PROCESO, RESUELTA o CANCELADA',
  }),
});

const listarSolicitudesSchema = z.object({
  q: z.string().trim().max(120).optional(),
  prioridad: z.enum(PRIORIDADES).optional(),
  estado: z.enum(ESTADOS).optional(),
  incluirInactivas: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  limite: z.coerce.number().int().min(1).max(100).optional(),
});

module.exports = {
  crearSolicitudSchema,
  actualizarSolicitudSchema,
  cambiarEstadoSchema,
  listarSolicitudesSchema,
};
