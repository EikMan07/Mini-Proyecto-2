const wait = (milliseconds = 280) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const users = {
  employee: {
    id: 'EMP-1042', name: 'Kendall Vargas', role: 'colaborador', department: 'Producto',
  },
  hr: {
    id: 'HR-001', name: 'María Fernanda Rojas', role: 'rrhh', department: 'People Operations',
  },
};

const citations = [
  { title: 'Jornada, asistencia y teletrabajo', section: 'Marcas diarias y ausencias', version: 'v2.1 · vigente', url: 'https://drive.google.com/' },
  { title: 'Catálogo de beneficios', section: 'Fondo de ahorro', version: 'v1.4 · vigente', url: 'https://drive.google.com/' },
];

const employeeSummary = {
  vacationBalance: 14.5,
  attendanceToday: { status: 'pendiente', checkedAt: null },
  medicalLeaves: [{ date: '12 jun 2025', type: 'Comprobante CCSS', status: 'en revisión' }],
  requests: [
    { id: 'REQ-284', type: 'Vacaciones', dates: '18–20 jul 2025', status: 'Pendiente', createdAt: 'Hace 1 día' },
    { id: 'REQ-271', type: 'Permiso personal', dates: '04 jun 2025', status: 'Aprobada', createdAt: 'Hace 8 días' },
  ],
};

const baseTrend = [
  { day: '19 may', absences: 3, queries: 18, turnover: 1 }, { day: '21 may', absences: 5, queries: 24, turnover: 0 },
  { day: '23 may', absences: 2, queries: 21, turnover: 1 }, { day: '26 may', absences: 4, queries: 29, turnover: 0 },
  { day: '28 may', absences: 6, queries: 31, turnover: 2 }, { day: '30 may', absences: 4, queries: 27, turnover: 0 },
  { day: '02 jun', absences: 7, queries: 36, turnover: 1 }, { day: '04 jun', absences: 3, queries: 34, turnover: 0 },
  { day: '06 jun', absences: 5, queries: 41, turnover: 1 }, { day: '09 jun', absences: 4, queries: 38, turnover: 0 },
  { day: '11 jun', absences: 2, queries: 45, turnover: 0 }, { day: '13 jun', absences: 3, queries: 48, turnover: 1 },
];

export const getMockUser = (role) => users[role === 'rrhh' ? 'hr' : 'employee'];

export const apiMock = {
  async login({ role }) { await wait(); return { token: `demo-token-${role}`, user: getMockUser(role) }; },
  async getEmployeeSummary() { await wait(180); return structuredClone(employeeSummary); },
  async askChat(question) {
    await wait(900);
    const normalized = question.toLowerCase();
    if (normalized.includes('bono') || normalized.includes('mascota')) {
      return { answer: 'No encontré una política vigente que respalde un bono por mascotas.', agentUsed: 'Policy Retriever', citations: [], escalated: true, latencyMs: 812 };
    }
    if (normalized.includes('salario') || normalized.includes('compañero') || normalized.includes('compañera')) {
      return { answer: 'No puedo mostrar información salarial o personal de otras personas. Puedo orientarte sobre tus propios beneficios y políticas generales.', agentUsed: 'Privacy Guard', citations: [], restricted: true, escalated: false, latencyMs: 463 };
    }
    return { answer: 'La jornada y las marcas se registran diariamente según tu horario asignado. Si trabajas en modalidad remota, debes marcar el inicio y cierre desde el canal habilitado. Las horas extra requieren autorización previa de tu jefatura.', agentUsed: 'HR Policy Agent', citations, escalated: false, latencyMs: 624 };
  },
  async checkIn() {
    await wait(420);
    return {
      status: 'registrada',
      checkedAt: new Intl.DateTimeFormat('es-CR', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date()),
    };
  },
  async submitRequest(payload) { await wait(500); return { id: `REQ-${Math.floor(Math.random() * 100) + 300}`, ...payload, status: 'Pendiente', createdAt: 'Ahora' }; },
  async getDailyReport(date) {
    await wait(360);
    return {
      date, summary: 'La operación mantiene una resolución automática estable, aunque las ausencias del equipo de Operaciones requieren seguimiento puntual. Las solicitudes antiguas concentran el mayor riesgo administrativo. El volumen de consultas subió por la campaña de beneficios y la latencia permanece dentro del objetivo.',
      kpis: [
        { label: 'Ausentes hoy', value: '07', detail: '3.1% de la plantilla', trend: '+2 vs. ayer', tone: 'warning' },
        { label: 'Solicitudes pendientes', value: '12', detail: '4 llevan +3 días', trend: '-3 esta semana', tone: 'accent' },
        { label: 'Vacaciones acumuladas', value: '18', detail: 'colaboradores en riesgo', trend: '+4 este mes', tone: 'critical' },
        { label: 'Resolución del chatbot', value: '86%', detail: 'sin escalamiento', trend: '+6.4% vs. semana anterior', tone: 'success' },
      ], trend: baseTrend, topics: [
        { topic: 'Teletrabajo y marcas', count: 86 }, { topic: 'Permisos y licencias', count: 61 }, { topic: 'Beneficios médicos', count: 48 }, { topic: 'Vacaciones', count: 39 }, { topic: 'Desempeño', count: 27 },
      ], pending: [
        { id: 'REQ-291', person: 'Daniela Solís', type: 'Incapacidad CCSS', department: 'Operaciones', age: '4 días', overdue: true },
        { id: 'REQ-284', person: 'Kendall Vargas', type: 'Vacaciones', department: 'Producto', age: '1 día', overdue: false },
        { id: 'REQ-278', person: 'Álvaro Jiménez', type: 'Permiso de estudio', department: 'Ventas', age: '6 días', overdue: true },
        { id: 'REQ-276', person: 'Sofía Castro', type: 'Permiso personal', department: 'Producto', age: '2 días', overdue: false },
      ], unresolved: ['¿Existe un bono por mascotas?', '¿Puedo conocer el salario de otra persona?', '¿Cómo se solicita una excepción de horario?'],
      history: ['2025-06-13', '2025-06-12', '2025-06-11', '2025-06-10'],
    };
  },
};
