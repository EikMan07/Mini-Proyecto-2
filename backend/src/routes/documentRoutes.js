'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { soloRol } = require('../middlewares/authMiddleware');
const { verificarCsrf } = require('../middlewares/csrf');
const validar = require('../middlewares/validar');
const { idParamSchema, resolverDocumentoSchema } = require('../schemas/portalSchemas');

router.get('/', authMiddleware, ctrl.listar);
router.post('/', authMiddleware, verificarCsrf, ctrl.uploadMiddleware, ctrl.subir);
router.get('/:id/archivo', authMiddleware, validar(idParamSchema, 'params'), ctrl.descargar);
router.patch(
  '/:id',
  authMiddleware,
  soloRol('rrhh'),
  verificarCsrf,
  validar(idParamSchema, 'params'),
  validar(resolverDocumentoSchema),
  ctrl.actualizarEstado
);

module.exports = router;
