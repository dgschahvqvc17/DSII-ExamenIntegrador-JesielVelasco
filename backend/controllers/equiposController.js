const service = require('../services/equiposService');
const asyncHandler = require('../utils/asyncHandler');
const { exito } = require('../utils/response');

const listar = asyncHandler(async (req, res) => {
  const equipos = await service.listar({ q: req.validado.query.q });
  exito(res, equipos);
});

const obtener = asyncHandler(async (req, res) => {
  const equipo = await service.obtenerPorId(req.validado.params.id);
  exito(res, equipo);
});

const disponibles = asyncHandler(async (req, res) => {
  exito(res, await service.obtenerDisponibles());
});

module.exports = { listar, obtener, disponibles };
