import { TextEncoder, TextDecoder } from 'node:util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('./WorkersDirectory.css', () => ({}));
jest.mock('../AttendanceMonitor/AttendanceMonitor.css', () => ({}));
jest.mock('../RequestReviewPanel/RequestReviewPanel.css', () => ({}));
jest.mock('../../services/api', () => ({
  api: {
    getHrWorkers: jest.fn(),
    getHrWorkerDetail: jest.fn(),
    getDailyReport: jest.fn(),
    syncDrive: jest.fn(),
  },
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

const { render, screen, waitFor } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
const { MemoryRouter, Route, Routes } = require('react-router-dom');
const HrWorkersPage = require('../../pages/HrWorkersPage/HrWorkersPage').default;
const HrDashboardPage = require('../../pages/HrDashboardPage/HrDashboardPage').default;
const PageTransition = require('../PageTransition/PageTransition').default;
const { api } = require('../../services/api');
const { useAuth } = require('../../context/AuthContext');
const { useTheme } = require('../../context/ThemeContext');

describe('HrWorkersPage y WorkersDirectory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 1, name: 'Ana Solís', role: 'rrhh', department: 'RRHH' },
      isAuthenticated: true,
      signOut: jest.fn(),
    });
    useTheme.mockReturnValue({
      theme: 'light',
      accent: 'coral',
      accentOptions: { coral: { label: 'Coral', light: '#ee6c4d', dark: '#ff8367' } },
      isDark: false,
      setAccent: jest.fn(),
      toggleTheme: jest.fn(),
    });
    api.getHrWorkers.mockResolvedValue({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      departamentos: [{ id: 1, nombre: 'Ingenieria' }],
      resumenGlobal: {
        totalTrabajadores: 260,
        conRiesgoPasivo20: 22,
        totalIncapacidades: 155,
        totalLlegadasTarde: 1122,
        totalSalidasTempranas: 782,
        totalHorasExtra: 2310.2,
      },
      trabajadores: [
        {
          id: 9,
          codigo_empleado: 'EMP-0009',
          cedula: '3-1333-1676',
          nombre: 'Diego Chaves Alpizar',
          apellidos: 'Chaves Alpizar',
          email: 'diego.chaves@ticosoft.cr',
          provincia: 'Heredia',
          departamento: 'Ingenieria',
          puesto: 'Desarrollador',
          ultima_hora_entrada: '08:00',
          ultima_hora_salida: '17:00',
          dias_incapacidad: 0,
          dias_libres_tomados: 0,
          dias_libres_acumulados: 24,
          horas_extra_total: 6.1,
          dias_llegada_tarde: 4,
          dias_salida_temprana: 5,
        },
      ],
    });
    api.getDailyReport.mockResolvedValue({
      date: '2026-11-19',
      summary: 'Resumen ok',
      kpis: [],
      trend: [],
      topics: [],
      pending: [],
      unresolved: [],
      documents: [],
      history: ['2026-11-19'],
      attendance: [],
      details: {},
    });
  });

  it('navega desde el enlace lateral Trabajadores y renderiza el directorio sin quedar en blanco', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/rrhh/dashboard']}>
        <PageTransition>
          <Routes>
            <Route path="/rrhh/dashboard" element={<HrDashboardPage />} />
            <Route path="/rrhh/trabajadores" element={<HrWorkersPage />} />
          </Routes>
        </PageTransition>
      </MemoryRouter>
    );

    const navLink = await screen.findByRole('link', { name: /Trabajadores/i });
    await user.click(navLink);

    await waitFor(() => expect(screen.getByText('Diego Chaves Alpizar')).toBeInTheDocument());
    expect(
      screen.getByPlaceholderText(/Buscar por nombre, apellidos, cédula, correo, provincia o código/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Buscar por nombre, apellidos o departamento/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Entradas y salidas confirmadas')).toBeInTheDocument();
  });

  it('cambia a la pestaña Trabajadores dentro de HrDashboardPage', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/rrhh/dashboard']}>
        <Routes>
          <Route path="/rrhh/dashboard" element={<HrDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    const tabBtn = await screen.findByRole('tab', { name: /Trabajadores/i });
    await user.click(tabBtn);
    await waitFor(() => expect(screen.getByText('Diego Chaves Alpizar')).toBeInTheDocument());
  });
});
