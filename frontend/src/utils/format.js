export const ESTADOS = ['PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CANCELADA'];
export const PRIORIDADES = ['BAJA', 'MEDIA', 'ALTA'];

export const TRANSICIONES = {
  PENDIENTE: ['EN_PROCESO', 'CANCELADA'],
  EN_PROCESO: ['RESUELTA', 'CANCELADA'],
  RESUELTA: [],
  CANCELADA: [],
};

export const ETIQUETAS_ESTADO = {
  PENDIENTE: 'Pendiente',
  EN_PROCESO: 'En proceso',
  RESUELTA: 'Resuelta',
  CANCELADA: 'Cancelada',
};

export const ETIQUETAS_PRIORIDAD = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
};

export const formatearFecha = (valor) => {
  if (!valor) return '—';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(valor));
};

export const resumir = (texto, max = 70) => {
  if (!texto) return '—';
  return texto.length > max ? `${texto.slice(0, max).trim()}…` : texto;
};

export const mensajeError = (error) => error?.mensaje || 'Ocurrió un error inesperado';
