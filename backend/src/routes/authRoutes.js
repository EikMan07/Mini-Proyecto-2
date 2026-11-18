'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const { verificarCsrf } = require('../middlewares/csrf');
const validar = require('../middlewares/validar');
const { registroSchema, loginSchema } = require('../schemas/authSchema');

// Rutas públicas
router.post('/registro', validar(registroSchema), ctrl.registro);
router.post('/login', validar(loginSchema), ctrl.login);
router.get('/usuarios-demo', ctrl.usuariosDemo);

// Rutas autenticadas
router.get('/yo', authMiddleware, ctrl.yo);
router.post('/logout', authMiddleware, verificarCsrf, ctrl.logout);

module.exports = router;
