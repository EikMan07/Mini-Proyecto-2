'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');
const { verificarCsrf } = require('../middlewares/csrf');
const validar = require('../middlewares/validar');
const { chatSchema } = require('../schemas/portalSchemas');

router.post('/', authMiddleware, verificarCsrf, validar(chatSchema), ctrl.preguntar);
router.get('/history', authMiddleware, ctrl.historial);

module.exports = router;
