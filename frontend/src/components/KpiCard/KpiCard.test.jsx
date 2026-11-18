import { render, screen } from '@testing-library/react';
import KpiCard from './KpiCard';

describe('KpiCard', () => {
  it('presenta valor, detalle y tendencia de un indicador', () => {
    render(<KpiCard label="Ausentes hoy" value="07" detail="3.1% de la plantilla" trend="+2 vs. ayer" tone="warning" />);
    expect(screen.getByText('Ausentes hoy')).toBeInTheDocument();
    expect(screen.getByText('07')).toBeInTheDocument();
    expect(screen.getByText('+2 vs. ayer')).toBeInTheDocument();
  });
});
