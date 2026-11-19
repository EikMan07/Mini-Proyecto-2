'use strict';

const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/employeeController');
const authMiddleware = require('../middlewares/authMiddleware');
const { verificarCsrf } = require('../middlewares/csrf');
const validar = require('../middlewares/validar');
const { checkInSchema } = require('../schemas/portalSchemas');

router.get('/employee/me/summary', authMiddleware, ctrl.resumen);
router.post('/attendance/check-in', authMiddleware, verificarCsrf, validar(checkInSchema), ctrl.checkIn);
router.post('/attendance/check-out', authMiddleware, verificarCsrf, ctrl.checkOut);

module.exports = router;
