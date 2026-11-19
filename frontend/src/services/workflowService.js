const REQUESTS_KEY = 'ticosoft-demo-requests';
const DOCUMENTS_KEY = 'ticosoft-demo-documents';
const VACATION_BALANCE_KEY = 'ticosoft-demo-vacation-balance';
const INITIAL_VACATION_BALANCE = 14;
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
function read(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); return value; }
export const getLocalRequests = () => read(REQUESTS_KEY);
export const getLocalDocuments = () => read(DOCUMENTS_KEY);
export const saveLocalRequest = (request) => { const next = [request, ...getLocalRequests().filter((item) => item.id !== request.id)]; write(REQUESTS_KEY, next); return request; };
export const updateLocalRequest = (id, status, reviewNote = '') => {
  const request = getLocalRequests().find((item) => item.id === id);
  if (!request) return null;
  if (request.status !== 'Pendiente') throw new Error('Esta solicitud ya fue revisada.');

  if (status === 'Aprobada' && request.type === 'Vacaciones') {
    const usage = useVacationDays(request.days);
    if (!usage.ok) {
      throw new Error(`Saldo insuficiente. Disponibles: ${usage.balance}, solicitados: ${request.days}.`);
    }
  }

  const updated = { ...request, status, reviewNote, reviewedAt: new Date().toISOString() };
  saveLocalRequest(updated);
  return updated;
};
export const saveLocalDocument = (document) => { const next = [document, ...getLocalDocuments().filter((item) => item.id !== document.id)]; write(DOCUMENTS_KEY, next); return document; };

export const getVacationBalance = () => {
  const state = read(VACATION_BALANCE_KEY);
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    const initial = { balance: INITIAL_VACATION_BALANCE, lastAccrualAt: new Date().toISOString() };
    write(VACATION_BALANCE_KEY, initial);
    return initial.balance;
  }

  const lastAccrual = new Date(state.lastAccrualAt);
  if (Number.isNaN(lastAccrual.getTime())) {
    const reset = { balance: INITIAL_VACATION_BALANCE, lastAccrualAt: new Date().toISOString() };
    write(VACATION_BALANCE_KEY, reset);
    return reset.balance;
  }

  const elapsedWeeks = Math.floor((Date.now() - lastAccrual.getTime()) / WEEK_IN_MS);
  if (elapsedWeeks < 1) return Number(state.balance) || 0;

  const updated = {
    balance: (Number(state.balance) || 0) + elapsedWeeks,
    lastAccrualAt: new Date(lastAccrual.getTime() + elapsedWeeks * WEEK_IN_MS).toISOString(),
  };
  write(VACATION_BALANCE_KEY, updated);
  return updated.balance;
};

export const useVacationDays = (days) => {
  const balance = getVacationBalance();
  const requested = Math.max(0, Math.floor(Number(days) || 0));
  if (requested > balance) return { ok: false, balance };

  const state = read(VACATION_BALANCE_KEY);
  const remaining = balance - requested;
  write(VACATION_BALANCE_KEY, { ...state, balance: remaining });
  return { ok: true, balance: remaining };
};
