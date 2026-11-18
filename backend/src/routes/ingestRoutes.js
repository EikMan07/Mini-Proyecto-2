'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ingestController');
const authMiddleware = require('../middlewares/authMiddleware');
const { soloRol } = require('../middlewares/authMiddleware');
const { verificarCsrf } = require('../middlewares/csrf');

router.get('/status', authMiddleware, ctrl.status);
router.post('/sync', authMiddleware, soloRol('rrhh'), verificarCsrf, ctrl.syncDrive);
router.post('/sync-local', authMiddleware, soloRol('rrhh'), verificarCsrf, ctrl.syncLocal);

module.exports = router;
