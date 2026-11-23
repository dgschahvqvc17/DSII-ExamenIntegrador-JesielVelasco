const express = require('express');
const controller = require('../controllers/dashboardController');

const router = express.Router();

router.get('/estadisticas', controller.estadisticas);

module.exports = router;
