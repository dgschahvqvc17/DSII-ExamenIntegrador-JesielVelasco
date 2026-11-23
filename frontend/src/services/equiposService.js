import api from './api';

const listar = async (q = '') => {
  const { data } = await api.get('/equipos', { params: q ? { q } : {} });
  return data.data;
};

const obtener = async (id) => {
  const { data } = await api.get(`/equipos/${id}`);
  return data.data;
};

const disponibles = async () => {
  const { data } = await api.get('/equipos/disponibles');
  return data.data;
};

export { listar, obtener, disponibles };
