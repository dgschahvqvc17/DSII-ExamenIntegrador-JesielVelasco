import api from './api';

const obtenerEstadisticas = async () => {
  const { data } = await api.get('/dashboard/estadisticas');
  return data.data;
};

export { obtenerEstadisticas };
