import { fireEvent, render, screen } from '@testing-library/react';
import LeaveRequestModal from './LeaveRequestModal';
import { api } from '../../services/api';

jest.mock('../../services/api', () => ({
  api: { submitRequest: jest.fn() },
}));

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

  it('prevents selecting dates before today', () => {
    render(<LeaveRequestModal onClose={jest.fn()} onCreated={jest.fn()} vacationBalance={10} />);

    const today = getLocalDateValue(new Date());
    expect(screen.getByLabelText('Desde')).toHaveAttribute('min', today);
    expect(screen.getByLabelText('Hasta')).toHaveAttribute('min', today);
  });

  it('rejects past dates even if entered manually', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = getLocalDateValue(yesterday);
    render(<LeaveRequestModal onClose={jest.fn()} onCreated={jest.fn()} vacationBalance={10} />);

    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: pastDate } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: pastDate } });
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar solicitud' }).closest('form'));

    expect(screen.getByRole('alert')).toHaveTextContent('No puedes solicitar días libres en fechas que ya pasaron.');
    expect(api.submitRequest).not.toHaveBeenCalled();
  });
});
