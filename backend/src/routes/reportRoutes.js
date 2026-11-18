'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const { soloRol } = require('../middlewares/authMiddleware');
const { verificarCsrf } = require('../middlewares/csrf');

router.use(authMiddleware, soloRol('rrhh'));

router.get('/daily', ctrl.obtenerDiario);
router.post('/run-now', verificarCsrf, ctrl.ejecutarAhora);
router.get('/tickets', ctrl.listarTickets);

module.exports = router;
