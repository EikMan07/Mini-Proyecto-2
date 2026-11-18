import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

function SessionStatus() {
  const { isAuthenticated, user } = useAuth();
  return <p>{isAuthenticated ? `Hola, ${user.name}` : 'Sesión cerrada'}</p>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('restores a saved session on the first render', () => {
    localStorage.setItem('kendall-session', JSON.stringify({
      user: { name: 'Kendall Vargas', role: 'colaborador' },
    }));

    render(
      <AuthProvider>
        <SessionStatus />
      </AuthProvider>
    );

    expect(screen.getByText('Hola, Kendall Vargas')).toBeInTheDocument();
  });
});
