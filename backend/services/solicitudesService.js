const ApiError = require('../utils/ApiError');
const repository = require('../repositories/solicitudesRepository');
const equiposRepository = require('../repositories/equiposRepository');
const { esTransicionPermitida, TRANSICIONES_PERMITIDAS } = require('../models/solicitud.model');

const listar = (filtros) => repository.listar(filtros);

const obtenerPorId = async (id) => {
  const solicitud = await repository.buscarPorId(id);
  if (!solicitud) {
    throw new ApiError(404, 'No se encontró la solicitud solicitada');
  }
  return solicitud;
};

const validarEquipo = async (equipoId) => {
  const equipo = await equiposRepository.buscarPorId(equipoId);
  if (!equipo) {
    throw new ApiError(404, 'El equipo seleccionado no existe en el catálogo');
  }
  return equipo;
};

const crear = async (datos) => {
  await validarEquipo(datos.equipo_id);

  // La función SQL usa un candado de fila por fecha: seguro ante concurrencia.
  const codigoSolicitud = await repository.generarCodigo();

  return repository.crear({
    codigo_solicitud: codigoSolicitud,
    equipo_id: datos.equipo_id,
    solicitante: datos.solicitante,
    descripcion: datos.descripcion,
    prioridad: datos.prioridad,
    estado: 'PENDIENTE',
    activo: true,
  });
};

const actualizar = async (id, datos) => {
  await obtenerPorId(id);
  await validarEquipo(datos.equipo_id);

  const actualizada = await repository.actualizar(id, {
    equipo_id: datos.equipo_id,
    solicitante: datos.solicitante,
    descripcion: datos.descripcion,
    prioridad: datos.prioridad,
  });

  if (!actualizada) {
    throw new ApiError(404, 'No se encontró la solicitud solicitada');
  }
  return actualizada;
};

const cambiarEstado = async (id, estadoNuevo) => {
  const solicitud = await obtenerPorId(id);

  if (!esTransicionPermitida(solicitud.estado, estadoNuevo)) {
    const permitidos = TRANSICIONES_PERMITIDAS[solicitud.estado] || [];
    const detalle = permitidos.length
      ? `Desde ${solicitud.estado} solo se permite: ${permitidos.join(', ')}`
      : `La solicitud ya está en un estado final (${solicitud.estado})`;
    throw new ApiError(409, 'Transición de estado no permitida', detalle);
  }

  const actualizada = await repository.cambiarEstado(id, estadoNuevo);
  if (!actualizada) {
    throw new ApiError(404, 'No se encontró la solicitud solicitada');
  }
  return actualizada;
};

const eliminarLogicamente = async (id) => {
  const eliminada = await repository.desactivar(id);
  if (!eliminada) {
    throw new ApiError(404, 'No se encontró la solicitud activa solicitada');
  }
  return {
    id: eliminada.id,
    codigo_solicitud: eliminada.codigo_solicitud,
    activo: false,
  };
};

const obtenerHistorial = async (id) => {
  const solicitud = await repository.buscarPorId(id, { incluirInactivas: true });
  if (!solicitud) {
    throw new ApiError(404, 'No se encontró la solicitud solicitada');
  }

  const transiciones = await repository.obtenerHistorial(id);
  return {
    solicitud: {
      id: solicitud.id,
      codigo_solicitud: solicitud.codigo_solicitud,
      estado_actual: solicitud.estado,
      activo: solicitud.activo,
    },
    transiciones,
  };
};

const listarHistorialGeneral = (filtros = {}) =>
  repository.listar({ ...filtros, incluirInactivas: true });

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  cambiarEstado,
  eliminarLogicamente,
  obtenerHistorial,
  listarHistorialGeneral,
};
