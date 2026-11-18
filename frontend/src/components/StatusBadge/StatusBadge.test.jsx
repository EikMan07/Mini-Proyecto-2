import { render, screen } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('muestra el texto y aplica el tono recibido', () => {
    render(<StatusBadge tone="success">Aprobada</StatusBadge>);
    expect(screen.getByText('Aprobada')).toHaveClass('success');
  });
});
