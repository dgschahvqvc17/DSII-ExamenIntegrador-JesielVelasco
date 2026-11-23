const ApiError = require('../utils/ApiError');

/**
 * Valida una parte de la petición (body, query o params) con un esquema Zod.
 * El resultado validado y normalizado se guarda en req.validado[origen].
 */
module.exports = (schema, origen = 'body') => (req, res, next) => {
  const resultado = schema.safeParse(req[origen]);

  if (!resultado.success) {
    const campos = resultado.error.flatten().fieldErrors;
    const mensaje = Object.entries(campos)
      .map(([campo, errores]) => `${campo}: ${errores.join(', ')}`)
      .join('; ');

    return next(new ApiError(400, 'Datos inválidos', { campos, mensaje }));
  }

  req.validado = req.validado || {};
  req.validado[origen] = resultado.data;
  next();
};
