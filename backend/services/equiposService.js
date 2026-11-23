const ApiError = require('../utils/ApiError');
const repository = require('../repositories/equiposRepository');

const listar = (filtros) => repository.listar(filtros);

const obtenerPorId = async (id) => {
  const equipo = await repository.buscarPorId(id);
  if (!equipo) {
    throw new ApiError(404, 'No se encontró el equipo solicitado');
  }
  return equipo;
};

/** Catálogo usado por el formulario de registro de solicitudes. */
const obtenerDisponibles = () => repository.listar();

module.exports = { listar, obtenerPorId, obtenerDisponibles };
