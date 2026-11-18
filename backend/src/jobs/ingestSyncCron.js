'use strict';

const cron = require('node-cron');
const ingestAgent = require('../agents/ingestAgent');

let tareaIngesta = null;

function iniciarCronIngesta() {
  if (tareaIngesta) return tareaIngesta;

  // Todos los días a las 6:45 a. m. (hora de Costa Rica)
  tareaIngesta = cron.schedule(
    '45 6 * * *',
    async () => {
      try {
        console.log('[Cron Ingesta 06:45] Iniciando sincronización diaria con Google Drive...');
        const res = await ingestAgent.sincronizarDesdeDrive();
        console.log('[Cron Ingesta 06:45] Sincronización completada:', JSON.stringify(res));
      } catch (error) {
        console.warn('[Cron Ingesta 06:45] Sincronización omitida o con aviso:', error.message);
      }
    },
    {
      timezone: 'America/Costa_Rica',
    }
  );

  return tareaIngesta;
}

module.exports = {
  iniciarCronIngesta,
};
