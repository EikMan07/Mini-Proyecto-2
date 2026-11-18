'use strict';

const db = require('../models');
const { obtenerDatosPersonales } = require('../agents/dataAgent');

async function obtenerResumenColaborador(colaboradorId) {
  return obtenerDatosPersonales(colaboradorId);
}

async function registrarAsistenciaHoy(colaboradorId, datos) {
  const ahora = new Date();
  const hoyStr = ahora.toISOString().slice(0, 10);
  const horaActual = ahora.toTimeString().slice(0, 8);

  const existente = await db.Asistencia.findOne({
    where: {
      colaborador_id: colaboradorId,
      fecha: hoyStr,
    },
  });

  const payload = {
    colaborador_id: colaboradorId,
    fecha: hoyStr,
    hora_entrada: datos.estado === 'presente' ? horaActual : null,
    modalidad: datos.modalidad,
    estado: datos.estado,
    comprobante_url: datos.comprobante_url || null,
    entidad_comprobante: datos.entidad_comprobante || null,
    observacion: datos.observacion || null,
  };

  if (existente) {
    await existente.update(payload);
    return { asistencia: existente.toJSON(), creada: false };
  }

  const creada = await db.Asistencia.create(payload);
  return { asistencia: creada.toJSON(), creada: true };
}

module.exports = {
  obtenerResumenColaborador,
  registrarAsistenciaHoy,
};
