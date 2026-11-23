const ApiError = require('./ApiError');

/**
 * Traduce errores de Supabase/PostgreSQL a errores HTTP controlados.
 * Nunca expone trazas internas al cliente.
 */
const verificarError = (error, contexto = 'la operación') => {
  if (!error) return;

  const codigo = String(error.code || '');
  const mensaje = String(error.message || '');

  // 23505 = unique_violation, 23503 = foreign_key_violation,
  // 23514 = check_violation, 22P02 = invalid_text_representation
  if (codigo === '23505') {
    throw new ApiError(409, 'El código o registro ya existe', 'Conflicto de duplicidad');
  }
  if (codigo === '23503') {
    throw new ApiError(404, 'El equipo seleccionado no existe', 'Referencia inválida');
  }
  if (codigo === '23514' || codigo === '22P02') {
    throw new ApiError(400, 'Los datos enviados no cumplen las restricciones de la base de datos');
  }

  throw new ApiError(500, `No se pudo completar ${contexto}`, mensaje);
};

module.exports = { verificarError };
