const service = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');
const { exito } = require('../utils/response');

const estadisticas = asyncHandler(async (req, res) => {
  exito(res, await service.obtenerEstadisticas());
});

module.exports = { estadisticas };
