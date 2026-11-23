const service = require('../services/solicitudesService');
const asyncHandler = require('../utils/asyncHandler');
const { exito, creado } = require('../utils/response');

const listar = asyncHandler(async (req, res) => {
  const solicitudes = await service.listar(req.validado.query);
  exito(res, solicitudes);
});

const listarHistorialGeneral = asyncHandler(async (req, res) => {
  const solicitudes = await service.listarHistorialGeneral(
    req.validado.query,
  );
  exito(res, solicitudes);
});

const obtener = asyncHandler(async (req, res) => {
  const solicitud = await service.obtenerPorId(req.validado.params.id);
  exito(res, solicitud);
});

const crear = asyncHandler(async (req, res) => {
  const solicitud = await service.crear(req.validado.body);
  creado(res, solicitud, 'Solicitud registrada correctamente');
});

const actualizar = asyncHandler(async (req, res) => {
  const solicitud = await service.actualizar(
    req.validado.params.id,
    req.validado.body,
  );
  exito(res, solicitud, 'Solicitud actualizada correctamente');
});

const cambiarEstado = asyncHandler(async (req, res) => {
  const solicitud = await service.cambiarEstado(
    req.validado.params.id,
    req.validado.body.estado,
  );
  exito(res, solicitud, 'Estado actualizado correctamente');
});

const eliminar = asyncHandler(async (req, res) => {
  const resultado = await service.eliminarLogicamente(req.validado.params.id);
  exito(res, resultado, 'Solicitud eliminada lógicamente');
});

const historial = asyncHandler(async (req, res) => {
  const historialSolicitud = await service.obtenerHistorial(
    req.validado.params.id,
  );
  exito(res, historialSolicitud);
});

module.exports = {
  listar,
  listarHistorialGeneral,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
  historial,
};
