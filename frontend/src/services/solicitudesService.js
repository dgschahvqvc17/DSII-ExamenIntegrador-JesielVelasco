import api from './api';

const extraer = (respuesta) => respuesta.data.data;

const listar = async (filtros = {}) => {
  const params = {};
  if (filtros.q) params.q = filtros.q;
  if (filtros.prioridad) params.prioridad = filtros.prioridad;
  if (filtros.estado) params.estado = filtros.estado;
  if (filtros.incluirInactivas) params.incluirInactivas = 'true';
  const { data } = await api.get('/solicitudes', { params });
  return data.data;
};

const listarHistorial = async (filtros = {}) => {
  const params = {};
  if (filtros.q) params.q = filtros.q;
  if (filtros.prioridad) params.prioridad = filtros.prioridad;
  if (filtros.estado) params.estado = filtros.estado;
  const { data } = await api.get('/solicitudes/historial', { params });
  return data.data;
};

const obtener = async (id) => extraer(await api.get(`/solicitudes/${id}`));

const crear = async (datos) => extraer(await api.post('/solicitudes', datos));

const actualizar = async (id, datos) =>
  extraer(await api.put(`/solicitudes/${id}`, datos));

const cambiarEstado = async (id, estado) =>
  extraer(await api.patch(`/solicitudes/${id}/estado`, { estado }));

const eliminar = async (id) => extraer(await api.delete(`/solicitudes/${id}`));

const historial = async (id) =>
  extraer(await api.get(`/solicitudes/${id}/historial`));

export {
  listar,
  listarHistorial,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
  historial,
};
