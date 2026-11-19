import { TextEncoder, TextDecoder } from 'node:util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('./AttendanceMonitor.css', () => ({}));
jest.mock('../RequestReviewPanel/RequestReviewPanel.css', () => ({}));
jest.mock('../../services/api', () => ({
  api: {
    updateRequestStatus: jest.fn(),
  },
}));

const { render, screen, waitFor } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
const AttendanceMonitor = require('./AttendanceMonitor').default;
const RequestReviewPanel = require('../RequestReviewPanel/RequestReviewPanel').default;
const { api } = require('../../services/api');

describe('AttendanceMonitor y RequestReviewPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.updateRequestStatus.mockResolvedValue({
      solicitud: { id: 15, estado: 'rechazada', motivo_rechazo: 'Cierre operativo del equipo' },
    });
  });

  test('filtra entradas y salidas confirmadas por nombre sin tildes, departamento y estado', async () => {
    const user = userEvent.setup();
    render(
      <AttendanceMonitor
        items={[
          {
            id: 1,
            person: 'Sofía Méndez',
            apellidos: 'Méndez Rojas',
            department: 'Ingeniería',
            checkedAt: '08:12',
            checkedOutAt: '17:05',
          },
          {
            id: 2,
            person: 'Carlos Mora',
            apellidos: 'Mora Solís',
            department: 'Operaciones',
            checkedAt: '07:55',
            checkedOutAt: null,
          },
          {
            id: 3,
            person: 'Laura Jiménez',
            apellidos: 'Jiménez Ulate',
            department: 'Operaciones',
            checkedAt: '07:58',
            checkedOutAt: '16:40',
          },
        ]}
      />
    );

    expect(screen.getByText('3 registros')).toBeInTheDocument();

    const searchInput = screen.getByLabelText('Buscar marca de jornada');
    await user.type(searchInput, 'sofia mendez');
    expect(screen.getByText('1 registro')).toBeInTheDocument();
    expect(screen.getByText('Sofía Méndez')).toBeInTheDocument();
    expect(screen.queryByText('Carlos Mora')).not.toBeInTheDocument();

    await user.clear(searchInput);
    await user.selectOptions(screen.getByLabelText('Filtrar jornada por departamento'), 'Operaciones');
    await user.selectOptions(screen.getByLabelText('Filtrar jornada por estado'), 'en_curso');
    expect(screen.getByText('1 registro')).toBeInTheDocument();
    expect(screen.getByText('Carlos Mora')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filtrar jornada por estado'), 'tardia');
    expect(screen.getByText('0 registros')).toBeInTheDocument();
    expect(
      screen.getByText('No hay marcas que coincidan con los filtros seleccionados.')
    ).toBeInTheDocument();
  });

  test('exige motivo de al menos 5 caracteres al rechazar una solicitud y lo envia en PATCH', async () => {
    const user = userEvent.setup();
    const onReviewed = jest.fn();

    render(
      <RequestReviewPanel
        items={[
          {
            id: 15,
            person: 'Diego Chaves Alpizar',
            type: 'Vacaciones',
            dates: '2026-12-01 → 2026-12-03',
            days: 3,
            reason: 'Viaje familiar',
          },
        ]}
        onReviewed={onReviewed}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Rechazar 15' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const textarea = screen.getByLabelText('Motivo del rechazo');
    await user.type(textarea, 'No');
    await user.click(screen.getByRole('button', { name: 'Confirmar rechazo' }));
    expect(
      screen.getByText(/Debes indicar el motivo del rechazo de al menos 5 caracteres/i)
    ).toBeInTheDocument();
    expect(api.updateRequestStatus).not.toHaveBeenCalled();

    await user.clear(textarea);
    await user.type(textarea, 'Cierre operativo del departamento en esas fechas');
    await user.click(screen.getByRole('button', { name: 'Confirmar rechazo' }));

    await waitFor(() => {
      expect(api.updateRequestStatus).toHaveBeenCalledWith(
        15,
        'Rechazada',
        'Cierre operativo del departamento en esas fechas'
      );
    });
    expect(onReviewed).toHaveBeenCalledWith(
      15,
      'Rechazada',
      'Cierre operativo del departamento en esas fechas'
    );
  });
});
