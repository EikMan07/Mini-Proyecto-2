import { TextEncoder, TextDecoder } from 'node:util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../../context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

const { render, screen } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');
const BrandLogo = require('./BrandLogo').default;
const AppShell = require('../AppShell/AppShell').default;
const { useAuth } = require('../../context/AuthContext');
const { useTheme } = require('../../context/ThemeContext');

describe('BrandLogo e identidad visual TicoSoft S.A.', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.mockReturnValue({
      user: { id: 1, name: 'Ana Solís', role: 'rrhh', department: 'RRHH' },
      signOut: jest.fn(),
    });
    useTheme.mockReturnValue({
      theme: 'dark',
      accent: 'coral',
      accentOptions: { coral: { label: 'Coral', light: '#ee6c4d', dark: '#ff8367' } },
      isDark: true,
      setAccent: jest.fn(),
      toggleTheme: jest.fn(),
    });
  });

  test('renderiza isotipo SVG vectorial geometrico sin <text>T</text> y muestra TicoSoft S.A. / Talento Humano', () => {
    const { container } = render(<BrandLogo size={44} showText={true} theme="dark" />);
    const svg = container.querySelector('svg.brand-logo-mark');
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('width')).toBe('44');
    expect(svg.getAttribute('height')).toBe('44');
    expect(svg.querySelector('text')).toBeNull();
    expect(svg.querySelectorAll('path').length).toBeGreaterThanOrEqual(2);
    expect(svg.querySelectorAll('circle').length).toBeGreaterThanOrEqual(1);
    expect(svg.querySelectorAll('rect').length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText('TicoSoft S.A.')).toBeInTheDocument();
    expect(screen.getByText('Talento Humano')).toBeInTheDocument();
  });

  test('en modo compacto oculta el texto y conserva el isotipo centrado', () => {
    const { container } = render(<BrandLogo size={36} showText={false} compact={true} theme="dark" />);
    expect(container.querySelector('svg.brand-logo-mark')).toHaveAttribute('width', '36');
    expect(screen.queryByText('TicoSoft S.A.')).not.toBeInTheDocument();
    expect(screen.queryByText('Talento Humano')).not.toBeInTheDocument();
  });

  test('AppShell muestra el nuevo encabezado corporativo sin referencias a Kendall ni People operations', () => {
    render(
      <MemoryRouter>
        <AppShell eyebrow="Talento Humano · RRHH" title="Resumen diario">
          <div>Contenido</div>
        </AppShell>
      </MemoryRouter>
    );

    expect(screen.getByText('TicoSoft S.A.')).toBeInTheDocument();
    expect(screen.getByText('Talento Humano')).toBeInTheDocument();
    expect(screen.queryByText(/People operations/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Kendall/i)).not.toBeInTheDocument();
  });
});
