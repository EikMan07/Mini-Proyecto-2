import { apiMock } from '../mocks/apiMock';

const API_URL = import.meta.env.VITE_API_URL;

const requestTypeLabels = {
  vacaciones: 'Vacaciones',
  estudio: 'Permiso de estudio',
  permiso_con_goce: 'Permiso personal',
  permiso_sin_goce: 'Permiso personal',
  licencia_duelo: 'Licencia por duelo',
  licencia_paternidad: 'Licencia de paternidad',
};

const requestStatusLabels = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

function normalizeRequest(item) {
  const startDate = item.fecha_inicio || item.startDate;
  const endDate = item.fecha_fin || item.endDate;
  return {
    ...item,
    type: requestTypeLabels[item.tipo] || item.type,
    status: requestStatusLabels[item.estado] || item.status,
    startDate,
    endDate,
    dates: item.dates || `${startDate} → ${endDate}`,
    days: item.dias_solicitados ?? item.days,
    reason: item.motivo || item.reason,
    createdAt: item.creada_en ? new Date(item.creada_en).toLocaleDateString('es-CR') : item.createdAt,
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.mensaje || payload?.message || 'No fue posible completar la solicitud.');
  }
  return response.json();
}

export const api = {
  login: (payload) => API_URL ? request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }) : apiMock.login(payload),
  getEmployeeSummary: async () => {
    if (!API_URL) return apiMock.getEmployeeSummary();
    const data = await request('/api/employee/me/summary');
    return {
      ...data,
      vacationBalance: data.saldo_vacaciones_2026?.dias_disponibles ?? data.vacationBalance ?? 0,
      attendanceToday: data.asistencias_recientes?.[0]
        ? { status: data.asistencias_recientes[0].estado, checkedAt: data.asistencias_recientes[0].hora_entrada }
        : { status: 'pendiente', checkedAt: null },
      requests: (data.solicitudes_recientes || []).map(normalizeRequest),
    };
  },
  askChat: (question) => API_URL ? request('/api/chat', { method: 'POST', body: JSON.stringify({ question }) }) : apiMock.askChat(question),
  checkIn: () => API_URL ? request('/api/attendance/check-in', { method: 'POST' }) : apiMock.checkIn(),
  checkOut: () => API_URL ? request('/api/attendance/check-out', { method: 'POST' }) : apiMock.checkOut(),
  submitRequest: async (payload) => {
    if (!API_URL) return apiMock.submitRequest(payload);
    const result = await request('/api/requests', {
      method: 'POST',
      body: JSON.stringify({
      tipo: payload.type === 'Vacaciones'
        ? 'vacaciones'
        : payload.type === 'Permiso de estudio'
          ? 'estudio'
          : 'permiso_con_goce',
      fecha_inicio: payload.startDate,
      fecha_fin: payload.endDate,
      motivo: payload.reason || null,
      }),
    });
    return normalizeRequest(result.solicitud);
  },
  updateRequestStatus: async (id, status, reviewNote = '') => {
    if (!API_URL) return apiMock.updateRequestStatus(id, status, reviewNote);
    const result = await request(`/api/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        estado: status === 'Aprobada' ? 'aprobada' : 'rechazada',
        observacion: reviewNote,
      }),
    });
    return normalizeRequest(result.solicitud);
  },
  uploadDocument: (file) => API_URL ? (() => { const data = new FormData(); data.append('file', file); return fetch(`${API_URL}/api/documents`, { method: 'POST', body: data }).then((response) => { if (!response.ok) throw new Error('No fue posible subir el documento.'); return response.json(); }); })() : apiMock.uploadDocument(file),
  getDailyReport: (date) => API_URL ? request(`/api/reports/daily?fecha=${date}`) : apiMock.getDailyReport(date),
};
