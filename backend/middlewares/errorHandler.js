const ApiError = require('../utils/ApiError');

/** Manejo centralizado: nunca devuelve trazas internas al cliente. */
module.exports = (error, req, res, next) => {
  let status = error.status || 500;
  let mensaje = 'Error interno del servidor';
  let details = null;

  if (error instanceof ApiError) {
    mensaje = error.message;
    details = error.details;
  } else if (error.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no contiene un JSON válido';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    mensaje = 'El archivo enviado es demasiado grande';
  }

  if (status >= 500) {
    console.error('[LabCare] Error no controlado:', error.message);
    details = null;
  }

  res.status(status).json({
    success: false,
    error: mensaje,
    ...(details && status < 500 ? { details } : {}),
  });
};
