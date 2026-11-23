/**
 * Envuelve controladores asíncronos y reenvía cualquier error al middleware
 * centralizado de errores. Evita try/catch repetido en cada controlador.
 */
module.exports = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
