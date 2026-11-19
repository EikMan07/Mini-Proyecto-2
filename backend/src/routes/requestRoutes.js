'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/requestController');
const authMiddleware = require('../middlewares/authMiddleware');
const { soloRol } = require('../middlewares/authMiddleware');
const { verificarCsrf } = require('../middlewares/csrf');
const validar = require('../middlewares/validar');
const {
  crearSolicitudSchema,
  resolverSolicitudSchema,
  idParamSchema,
} = require('../schemas/portalSchemas');

router.get('/', authMiddleware, ctrl.listar);
router.post('/', authMiddleware, verificarCsrf, validar(crearSolicitudSchema), ctrl.crear);
router.patch(
  '/:id',
  authMiddleware,
  soloRol('rrhh'),
  verificarCsrf,
  validar(idParamSchema, 'params'),
  validar(resolverSolicitudSchema),
  ctrl.resolver
);
router.patch(
  '/:id/status',
  authMiddleware,
  soloRol('rrhh'),
  verificarCsrf,
  validar(idParamSchema, 'params'),
  validar(resolverSolicitudSchema),
  ctrl.resolver
);

module.exports = router;
