const express = require('express');
const controller = require('../controllers/equiposController');
const validate = require('../middlewares/validate');
const { idSchema } = require('../validators/comun.validator');
const { listarEquiposSchema } = require('../validators/equipos.validator');

const router = express.Router();

router.get('/', validate(listarEquiposSchema, 'query'), controller.listar);
router.get('/disponibles', controller.disponibles);
router.get('/:id', validate(idSchema, 'params'), controller.obtener);

module.exports = router;
