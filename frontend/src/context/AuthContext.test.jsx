import { TextEncoder, TextDecoder } from 'node:util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('../services/api', () => ({
  api: {
    getMe: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
  },
}));

const { render, screen, waitFor } = require('@testing-library/react');
const { AuthProvider, useAuth } = require('./AuthContext');
const { api } = require('../services/api');

function SessionStatus() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <p>Cargando sesión</p>;
  return <p>{isAuthenticated ? `Hola, ${user.name}` : 'Sesión cerrada'}</p>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('restaura la sesión autenticada desde el backend en memoria al cargar', async () => {
    api.getMe.mockResolvedValue({
      user: { id: 9, name: 'Diego Chaves Alpizar', role: 'colaborador' },
    });

    render(
      <AuthProvider>
        <SessionStatus />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Hola, Diego Chaves Alpizar')).toBeInTheDocument();
    });
  });

  it('mantiene sesión cerrada cuando /api/auth/yo responde sin sesión activa', async () => {
    api.getMe.mockRejectedValue(new Error('No autorizado'));

    render(
      <AuthProvider>
        <SessionStatus />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sesión cerrada')).toBeInTheDocument();
    });
  });
});
