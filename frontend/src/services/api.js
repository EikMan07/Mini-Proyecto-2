import { apiMock } from '../mocks/apiMock';

const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error('No fue posible completar la solicitud.');
  return response.json();
}

export const api = {
  login: (payload) => API_URL ? request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }) : apiMock.login(payload),
  getEmployeeSummary: () => API_URL ? request('/api/employee/me/summary') : apiMock.getEmployeeSummary(),
  askChat: (question) => API_URL ? request('/api/chat', { method: 'POST', body: JSON.stringify({ question }) }) : apiMock.askChat(question),
  checkIn: () => API_URL ? request('/api/attendance/check-in', { method: 'POST' }) : apiMock.checkIn(),
  checkOut: () => API_URL ? request('/api/attendance/check-out', { method: 'POST' }) : apiMock.checkOut(),
  submitRequest: (payload) => API_URL ? request('/api/requests', { method: 'POST', body: JSON.stringify(payload) }) : apiMock.submitRequest(payload),
  updateRequestStatus: (id, status, reviewNote = '') => API_URL ? request(`/api/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reviewNote }) }) : apiMock.updateRequestStatus(id, status, reviewNote),
  uploadDocument: (file) => API_URL ? (() => { const data = new FormData(); data.append('file', file); return fetch(`${API_URL}/api/documents`, { method: 'POST', body: data }).then((response) => { if (!response.ok) throw new Error('No fue posible subir el documento.'); return response.json(); }); })() : apiMock.uploadDocument(file),
  getDailyReport: (date) => API_URL ? request(`/api/reports/daily?fecha=${date}`) : apiMock.getDailyReport(date),
};
