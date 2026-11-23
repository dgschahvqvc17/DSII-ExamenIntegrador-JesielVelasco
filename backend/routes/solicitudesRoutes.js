const express = require('express');
const controller = require('../controllers/solicitudesController');
const validate = require('../middlewares/validate');
const { idSchema } = require('../validators/comun.validator');
const {
  crearSolicitudSchema,
  actualizarSolicitudSchema,
  cambiarEstadoSchema,
  listarSolicitudesSchema,
} = require('../validators/solicitud.validator');

const router = express.Router();

// Rutas estáticas primero para que '/historial' no sea capturado por '/:id'.
router.get('/', validate(listarSolicitudesSchema, 'query'), controller.listar);
router.get(
  '/historial',
  validate(listarSolicitudesSchema, 'query'),
  controller.listarHistorialGeneral,
);
router.post('/', validate(crearSolicitudSchema, 'body'), controller.crear);

router.get('/:id/historial', validate(idSchema, 'params'), controller.historial);
router.patch(
  '/:id/estado',
  validate(idSchema, 'params'),
  validate(cambiarEstadoSchema, 'body'),
  controller.cambiarEstado,
);
router.get('/:id', validate(idSchema, 'params'), controller.obtener);
router.put(
  '/:id',
  validate(idSchema, 'params'),
  validate(actualizarSolicitudSchema, 'body'),
  controller.actualizar,
);
router.delete('/:id', validate(idSchema, 'params'), controller.eliminar);

module.exports = router;
