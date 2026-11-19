'use strict';

require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');
const { iniciarCronIngesta } = require('./jobs/ingestSyncCron');
const { iniciarCronReporteDiario } = require('./jobs/dailyReportCron');

const PUERTO = Number(process.env.PUERTO || process.env.PORT || 5000);

sequelize
  .authenticate()
  .then(() => {
    console.log('Conexión exitosa a MySQL con Sequelize');
    if (process.env.NODE_ENV !== 'test') {
      iniciarCronIngesta();
      iniciarCronReporteDiario();
      console.log('Crones diarios programados (Ingesta Drive 06:45, Reporte Analista 07:00 America/Costa_Rica)');
    }
    app.listen(PUERTO, () => {
      console.log(`Servidor escuchando en http://localhost:${PUERTO}`);
    });
  })
  .catch((err) => {
    console.error('Error crítico al conectar con MySQL:', err.message);
    process.exit(1);
  });
