const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const METODOS_MUTABLES = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

let csrfTokenMemory = '';

export function setCsrfToken(token) {
  csrfTokenMemory = token || '';
}

export function getCsrfToken() {
  return csrfTokenMemory;
}

function normalizeUser(usuario) {
  if (!usuario) return null;
  const departamento =
    typeof usuario.departamento === 'object' && usuario.departamento !== null
      ? usuario.departamento.nombre
      : usuario.departamento || usuario.department || 'General';

  return {
    id: usuario.id,
    codigo_empleado: usuario.codigo_empleado,
    name: usuario.nombre || usuario.name || 'Colaborador',
    nombre: usuario.nombre || usuario.name || 'Colaborador',
    email: usuario.email,
    role: usuario.rol || usuario.role || 'colaborador',
    rol: usuario.rol || usuario.role || 'colaborador',
    position: usuario.puesto || usuario.position || 'Colaborador',
    department: departamento,
  };
}

async function request(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (METODOS_MUTABLES.has(method) && csrfTokenMemory) {
    headers['X-CSRF-Token'] = csrfTokenMemory;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    credentials: 'include',
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.message || 'No fue posible completar la solicitud.');
  }

  return data;
}

function resolveDocumentUrl(url = '') {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function normalizeDocument(doc) {
  if (!doc) return doc;
  return {
    ...doc,
    url: resolveDocumentUrl(doc.url),
  };
}

export const api = {
  async login(payload) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data?.csrfToken) setCsrfToken(data.csrfToken);
    return {
      user: normalizeUser(data?.usuario || data?.user),
      csrfToken: data?.csrfToken || '',
    };
  },

  async register(payload) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data?.csrfToken) setCsrfToken(data.csrfToken);
    return {
      user: normalizeUser(data?.usuario || data?.user),
      csrfToken: data?.csrfToken || '',
    };
  },

  async getMe() {
    const data = await request('/api/auth/yo');
    if (data?.csrfToken) setCsrfToken(data.csrfToken);
    return {
      user: normalizeUser(data?.usuario || data?.user),
      csrfToken: data?.csrfToken || '',
    };
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    } finally {
      setCsrfToken('');
    }
  },

  async getDemoUsers() {
    return request('/api/auth/usuarios-demo');
  },

  async getEmployeeSummary() {
    const data = await request('/api/employee/me/summary');
    const saldoRaw = data?.vacationBalance ?? data?.saldo_vacaciones_2026?.dias_disponibles;
    return {
      ...data,
      vacationBalance: saldoRaw !== undefined && saldoRaw !== null ? Number(saldoRaw) : 0,
      attendanceToday: data?.attendanceToday || { status: 'pendiente', checkedAt: null, checkedOutAt: null },
      requests: Array.isArray(data?.requests) ? data.requests : [],
    };
  },

  async askChat(question) {
    const data = await request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ pregunta: question, question }),
    });
    return {
      ...data,
      text: data?.answer,
      agentUsed: data?.agentUsed || data?.agente,
      latencyMs: data?.latencyMs ?? data?.latencia_ms,
      restricted: Boolean(data?.restricted || data?.intencion === 'restringida'),
      outOfScope: Boolean(data?.outOfScope || data?.intencion === 'fuera_de_alcance'),
      citations: Array.isArray(data?.citations) ? data.citations : [],
    };
  },

  async checkIn(payload = { modalidad: 'presencial', estado: 'presente' }) {
    const data = await request('/api/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      status: data?.status || 'registrada',
      checkedAt: data?.checkedAt || data?.asistencia?.hora_entrada || null,
      checkedOutAt: data?.checkedOutAt || data?.asistencia?.hora_salida || null,
    };
  },

  async checkOut() {
    const data = await request('/api/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return {
      status: data?.status || 'cerrada',
      checkedAt: data?.checkedAt || data?.asistencia?.hora_entrada || null,
      checkedOutAt: data?.checkedOutAt || data?.asistencia?.hora_salida || null,
    };
  },

  async submitRequest(payload) {
    const data = await request('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return data?.solicitud || data;
  },

  async updateRequestStatus(id, status, reasonOrOptions = '') {
    const isObject = reasonOrOptions && typeof reasonOrOptions === 'object';
    const motivo = isObject
      ? reasonOrOptions.motivo_rechazo ?? reasonOrOptions.rejectionReason ?? reasonOrOptions.reviewNote ?? ''
      : String(reasonOrOptions || '');

    return request(`/api/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        estado: status,
        status,
        ...(motivo.trim() ? { motivo_rechazo: motivo.trim(), rejectionReason: motivo.trim() } : {}),
      }),
    });
  },

  async getDocuments() {
    const data = await request('/api/documents');
    const docs = Array.isArray(data?.documents) ? data.documents : data?.comprobantes || [];
    return docs.map(normalizeDocument);
  },

  async uploadDocument(fileOrPayload) {
    const isDirectFile =
      typeof File !== 'undefined' && fileOrPayload instanceof File
        ? true
        : Boolean(fileOrPayload && !fileOrPayload.file && fileOrPayload.name && fileOrPayload.size !== undefined);

    const payload = isDirectFile ? { file: fileOrPayload } : fileOrPayload || {};
    const formData = new FormData();
    formData.append('file', payload.file);
    if (payload.tipo_justificacion) {
      formData.append('tipo_justificacion', payload.tipo_justificacion);
    }
    if (payload.fecha_inicio) {
      formData.append('fecha_inicio', payload.fecha_inicio);
    }
    if (payload.fecha_fin) {
      formData.append('fecha_fin', payload.fecha_fin);
    }
    if (payload.observacion) {
      formData.append('observacion', payload.observacion);
    }

    const headers = {};
    if (csrfTokenMemory) {
      headers['X-CSRF-Token'] = csrfTokenMemory;
    }

    const response = await fetch(`${API_URL}/api/documents`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'No fue posible subir el documento.');
    }
    return normalizeDocument(data?.comprobante || data);
  },

  async updateDocumentStatus(id, status, reviewNote = '') {
    return request(`/api/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reviewNote }),
    });
  },

  async getDailyReport(date) {
    const query = date ? `?fecha=${encodeURIComponent(date)}` : '';
    const data = await request(`/api/reports/daily${query}`);
    const dashboard = data?.dashboard || data;
    if (dashboard && Array.isArray(dashboard.documents)) {
      return {
        ...dashboard,
        documents: dashboard.documents.map(normalizeDocument),
      };
    }
    return dashboard;
  },

  async syncDrive(forzarCompleto = false) {
    return request('/api/ingest/sync', {
      method: 'POST',
      body: JSON.stringify({ forzarCompleto }),
    });
  },

  async getIngestStatus() {
    return request('/api/ingest/status');
  },

  async getHrWorkers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', String(params.search));
    if (params.departamento && params.departamento !== 'todos') {
      query.set('departamento', String(params.departamento));
    }
    if (params.estado && params.estado !== 'todos') {
      query.set('estado', String(params.estado));
    }
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request(`/api/hr/workers${qs ? `?${qs}` : ''}`);
  },

  async getHrWorkerDetail(id) {
    return request(`/api/hr/workers/${id}`);
  },
};
