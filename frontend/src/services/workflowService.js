const REQUESTS_KEY = 'ticosoft-demo-requests';
const DOCUMENTS_KEY = 'ticosoft-demo-documents';
function read(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); return value; }
export const getLocalRequests = () => read(REQUESTS_KEY);
export const getLocalDocuments = () => read(DOCUMENTS_KEY);
export const saveLocalRequest = (request) => { const next = [request, ...getLocalRequests().filter((item) => item.id !== request.id)]; write(REQUESTS_KEY, next); return request; };
export const updateLocalRequest = (id, status, reviewNote = '') => { const request = getLocalRequests().find((item) => item.id === id); if (!request) return null; const updated = { ...request, status, reviewNote, reviewedAt: new Date().toISOString() }; saveLocalRequest(updated); return updated; };
export const saveLocalDocument = (document) => { const next = [document, ...getLocalDocuments().filter((item) => item.id !== document.id)]; write(DOCUMENTS_KEY, next); return document; };
