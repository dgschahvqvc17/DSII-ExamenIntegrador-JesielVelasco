/**
 * Modelo de dominio de una solicitud de mantenimiento.
 * Define los valores permitidos y las reglas de transición de estado.
 */

const PRIORIDADES = Object.freeze(['BAJA', 'MEDIA', 'ALTA']);
const ESTADOS = Object.freeze([
  'PENDIENTE',
  'EN_PROCESO',
  'RESUELTA',
  'CANCELADA',
]);

const TRANSICIONES_PERMITIDAS = Object.freeze({
  PENDIENTE: ['EN_PROCESO', 'CANCELADA'],
  EN_PROCESO: ['RESUELTA', 'CANCELADA'],
  RESUELTA: [],
  CANCELADA: [],
});

const CAMPOS_EDITABLES = Object.freeze([
  'equipo_id',
  'solicitante',
  'descripcion',
  'prioridad',
]);

const esTransicionPermitida = (estadoActual, estadoNuevo) =>
  (TRANSICIONES_PERMITIDAS[estadoActual] || []).includes(estadoNuevo);

module.exports = {
  PRIORIDADES,
  ESTADOS,
  TRANSICIONES_PERMITIDAS,
  CAMPOS_EDITABLES,
  esTransicionPermitida,
};
