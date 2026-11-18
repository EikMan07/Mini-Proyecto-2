'use strict';

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

async function accrueWeeklyDays(balance, transaction) {
  const lastAccrual = new Date(
    balance.fecha_ultima_acumulacion || balance.createdAt || new Date()
  );
  if (Number.isNaN(lastAccrual.getTime())) {
    throw new Error('La fecha de acumulacion del saldo de vacaciones no es valida.');
  }

  const completedWeeks = Math.floor((Date.now() - lastAccrual.getTime()) / WEEK_IN_MS);
  const nextAccrualDate = new Date(lastAccrual.getTime() + Math.max(0, completedWeeks) * WEEK_IN_MS);
  const updates = {};

  if (!balance.fecha_ultima_acumulacion) updates.fecha_ultima_acumulacion = lastAccrual;
  if (completedWeeks > 0) {
    updates.dias_disponibles = balance.dias_disponibles + completedWeeks;
    updates.fecha_ultima_acumulacion = nextAccrualDate;
  }

  if (Object.keys(updates).length) {
    await balance.update(updates, transaction ? { transaction } : undefined);
  }
  return balance;
}

module.exports = { accrueWeeklyDays };
