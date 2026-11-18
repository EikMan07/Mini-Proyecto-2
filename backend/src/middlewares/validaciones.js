'use strict';

const requerir = (campos) => (req, res, next) => {
  const faltan = campos.filter(
    (c) => req.body[c] === undefined || req.body[c] === null || req.body[c] === ''
  );
  if (faltan.length) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: `Faltan campos obligatorios: ${faltan.join(', ')}`,
    });
  }
  return next();
};

const verificarRelacion = (Modelo, campo, etiqueta = 'El registro relacionado', status = 400) =>
  async (req, res, next) => {
    try {
      const id = req.body[campo];
      if (id === undefined || id === null) return next();
      const existe = await Modelo.findByPk(id);
      if (!existe) return res.status(status).json({ error: `${etiqueta} (${campo}=${id}) no existe` });
      return next();
    } catch (error) {
      return next(error);
    }
  };

const tipos = (reglas) => (req, res, next) => {
  const errores = [];
  for (const [campo, tipo] of Object.entries(reglas)) {
    const v = req.body[campo];
    if (v === undefined) continue;
    if (tipo === 'numero' && (typeof v !== 'number' || Number.isNaN(v))) errores.push(`${campo} debe ser un número`);
    if (tipo === 'entero' && !Number.isInteger(v)) errores.push(`${campo} debe ser un entero`);
    if (tipo === 'texto' && typeof v !== 'string') errores.push(`${campo} debe ser texto`);
  }
  if (errores.length) return res.status(400).json({ error: errores });
  return next();
};

module.exports = { requerir, verificarRelacion, tipos };
