import { TextEncoder, TextDecoder } from 'node:util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('./LeaveRequestModal.css', () => ({}));
jest.mock('../../services/api', () => ({
  api: { submitRequest: jest.fn() },
}));

const { fireEvent, render, screen } = require('@testing-library/react');
const LeaveRequestModal = require('./LeaveRequestModal').default;
const { api } = require('../../services/api');

function getLocalDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('LeaveRequestModal date selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('impide seleccionar fechas anteriores a hoy', () => {
    render(<LeaveRequestModal onClose={jest.fn()} onCreated={jest.fn()} existingRequests={[]} />);

    const today = getLocalDateValue(new Date());
    expect(screen.getByLabelText('Desde')).toHaveAttribute('min', today);
    expect(screen.getByLabelText('Hasta')).toHaveAttribute('min', today);
  });

  it('rechaza fechas pasadas incluso si se ingresan manualmente', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = getLocalDateValue(yesterday);
    render(<LeaveRequestModal onClose={jest.fn()} onCreated={jest.fn()} existingRequests={[]} />);

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: pastDate } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: pastDate } });
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form'));

    expect(screen.getByRole('alert')).toHaveTextContent(
      /No puedes escoger fechas que ya hayan pasado/i
    );
    expect(api.submitRequest).not.toHaveBeenCalled();
  });
});
