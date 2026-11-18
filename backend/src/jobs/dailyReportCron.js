'use strict';

const cron = require('node-cron');
const analystAgent = require('../agents/analystAgent');

let tareaReporte = null;

function iniciarCronReporteDiario() {
  if (tareaReporte) return tareaReporte;

  // Todos los días a las 7:00 a. m. (hora de Costa Rica)
  tareaReporte = cron.schedule(
    '0 7 * * *',
    async () => {
      try {
        console.log('[Cron Analista 07:00] Generando reporte ejecutivo diario de RRHH...');
        const res = await analystAgent.generarReporteDiario();
        console.log(
          '[Cron Analista 07:00] Reporte generado:',
          res.reporte.fecha,
          'validacion:',
          res.validacion_numerica.origen
        );
      } catch (error) {
        console.error('[Cron Analista 07:00] Error generando reporte diario:', error.message);
      }
    },
    {
      timezone: 'America/Costa_Rica',
    }
  );

  return tareaReporte;
}

module.exports = {
  iniciarCronReporteDiario,
};
