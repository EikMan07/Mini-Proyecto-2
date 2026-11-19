'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workerDirectoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const { soloRol } = require('../middlewares/authMiddleware');
const validar = require('../middlewares/validar');
const { idParamSchema } = require('../schemas/portalSchemas');

router.get('/', authMiddleware, soloRol('rrhh'), ctrl.listar);
router.get(
  '/:id',
  authMiddleware,
  soloRol('rrhh'),
  validar(idParamSchema, 'params'),
  ctrl.detalle
);

module.exports = router;
