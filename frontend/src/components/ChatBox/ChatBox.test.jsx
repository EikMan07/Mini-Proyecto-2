import { TextEncoder, TextDecoder } from 'node:util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock('../../services/api', () => ({
  api: {
    askChat: jest.fn(),
  },
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const { render, screen, waitFor } = require('@testing-library/react');
const userEvent = require('@testing-library/user-event').default;
const ChatBox = require('./ChatBox').default;
const { api } = require('../../services/api');
const { useAuth } = require('../../context/AuthContext');

describe('ChatBox Markdown rendering', () => {
  beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      user: { id: 1, name: 'Diego Chaves Mora', role: 'empleado' },
    });
  });

  test('renders bold, italic, clean inline code, and bullet lists without literal asterisks or backticks', async () => {
    api.askChat.mockResolvedValue({
      answer: [
        'Diego, actualmente tienes **14 días** de vacaciones disponibles y *cero* bloqueos en `saldo_2026`.',
        '* Primer punto de **referencia**',
        '- Segundo punto con **24 días** anuales',
      ].join('\n'),
      agentUsed: 'Agente de Datos Personales',
      latencyMs: 120,
      citations: [],
    });

    const user = userEvent.setup();
    render(<ChatBox />);

    const input = screen.getByPlaceholderText(/Cómo registro una ausencia médica/i);
    await user.type(input, '¿Cuántos días de vacaciones tengo?');
    await user.click(screen.getByRole('button', { name: /Enviar/i }));

    await waitFor(() => {
      expect(screen.getByText('14 días')).toBeInTheDocument();
    });

    const strongNode = screen.getByText('14 días');
    expect(strongNode.tagName).toBe('STRONG');
    expect(strongNode).toHaveClass('chat-highlight');

    const italicNode = screen.getByText('cero');
    expect(italicNode.tagName).toBe('EM');

    expect(screen.getByText('Primer punto de')).toBeInTheDocument();
    expect(screen.getByText('24 días').tagName).toBe('STRONG');
    expect(screen.getByText('saldo_2026')).toHaveClass('chat-code-clean');

    const messageBodies = document.querySelectorAll('.message-body');
    const lastBodyText = messageBodies[messageBodies.length - 1].textContent || '';
    expect(lastBodyText).not.toContain('*');
    expect(lastBodyText).not.toContain('`');
    expect(document.querySelectorAll('.chat-list li')).toHaveLength(2);
  });
});
