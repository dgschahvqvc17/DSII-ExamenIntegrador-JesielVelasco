const repository = require('../repositories/dashboardRepository');

const obtenerEstadisticas = async () => {
  const datos = await repository.obtenerDatos();

  return {
    ...datos,
    tasaResolucion: datos.totalActivas
      ? Math.round((datos.resueltas / datos.totalActivas) * 100)
      : 0,
    actualizadoEn: new Date().toISOString(),
  };
};

module.exports = { obtenerEstadisticas };
