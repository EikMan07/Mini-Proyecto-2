'use strict';

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { validarConfiguracionCookies } = require('./utils/cookies');
const { verificarOrigen } = require('./middlewares/csrf');
const authRoutes = require('./routes/authRoutes');
const ingestRoutes = require('./routes/ingestRoutes');
const chatRoutes = require('./routes/chatRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const requestRoutes = require('./routes/requestRoutes');
const reportRoutes = require('./routes/reportRoutes');
const errorHandler = require('./middlewares/errorHandler');
const { NotFoundError } = require('./utils/errors');
const db = require('./models');

// 1. Validación temprana de configuración de seguridad
validarConfiguracionCookies();

const app = express();

// 2. Seguridad HTTP y compresión
app.use(helmet());
app.use(compression());

// 3. CORS con origen explícito y credenciales activas
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

// 4. Logging HTTP
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// 5. Parseo de cookies y cuerpos
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 6. Rate limiting en endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Demasiadas peticiones de autenticación, intenta nuevamente en unos minutos.',
  },
});

// 7. Verificación de origen en métodos mutables (Capa 2 anti-CSRF)
app.use(verificarOrigen);

// 8. Healthcheck con conteo real de tablas en PostgreSQL
app.get('/api/health', async (req, res, next) => {
  try {
    await db.sequelize.authenticate();

    const [
      departamentos,
      colaboradores,
      saldos_vacaciones,
      solicitudes,
      incapacidades,
      asistencias,
      movimientos_personal,
      fragmentos_documento,
      consultas_chat,
      reportes_diarios,
      tickets_escalamiento,
    ] = await Promise.all([
      db.Departamento.count(),
      db.Colaborador.count(),
      db.SaldoVacaciones.count(),
      db.Solicitud.count(),
      db.Incapacidad.count(),
      db.Asistencia.count(),
      db.MovimientoPersonal.count(),
      db.FragmentoDocumento.count(),
      db.ConsultaChat.count(),
      db.ReporteDiario.count(),
      db.TicketEscalamiento.count(),
    ]);

    return res.status(200).json({
      estado: 'ok',
      servicio: 'Portal RRHH RAG Multiagente API',
      base_datos: 'postgresql',
      tablas: {
        departamentos,
        colaboradores,
        saldos_vacaciones,
        solicitudes,
        incapacidades,
        asistencias,
        movimientos_personal,
        fragmentos_documento,
        consultas_chat,
        reportes_diarios,
        tickets_escalamiento,
      },
      colaboradores,
    });
  } catch (error) {
    return next(error);
  }
});

// 9. Rutas modulares de autenticación, ingesta, chat y portal RRHH
app.use('/auth', authLimiter, authRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', employeeRoutes);

// 10. Manejador 404 para rutas inexistentes
app.use((req, res, next) => {
  next(new NotFoundError('Ruta'));
});

// 11. Manejador centralizado de errores (firma cuádruple obligatoria)
app.use(errorHandler);

module.exports = app;
