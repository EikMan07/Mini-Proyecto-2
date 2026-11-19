import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Bot, LoaderCircle, Send, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { messageVariants, springSoft } from '../../lib/motion';
import CitationCard from '../CitationCard/CitationCard';
import SecurityAlert from '../SecurityAlert/SecurityAlert';
import EscalationBanner from '../EscalationBanner/EscalationBanner';

function limpiarMarcadoresSueltos(text = '') {
  return String(text || '').replace(/[*`]/g, '');
}

function renderInlineMarkdown(text = '') {
  const regex = /(\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  const parts = String(text || '').split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={`l-${index}`}
          className="chat-inline-link"
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
        >
          {limpiarMarcadoresSueltos(linkMatch[1])}
        </a>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong className="chat-highlight" key={`b-${index}`}>
          {limpiarMarcadoresSueltos(part.slice(2, -2))}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em className="chat-emphasis" key={`i-${index}`}>
          {limpiarMarcadoresSueltos(part.slice(1, -1))}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <span className="chat-code-clean" key={`c-${index}`}>
          {limpiarMarcadoresSueltos(part.slice(1, -1))}
        </span>
      );
    }

    return limpiarMarcadoresSueltos(part);
  });
}

function renderFormattedMessage(rawText = '') {
  const lines = String(rawText || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let listItems = [];

  const flushList = (keyPrefix) => {
    if (!listItems.length) return;
    blocks.push(
      <ul className="chat-list" key={`ul-${keyPrefix}`}>
        {listItems.map((item, idx) => (
          <li key={`li-${keyPrefix}-${idx}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(lineIdx);
      return;
    }

    const bulletMatch = trimmed.match(/^(?:\*|-|•)\s+(.+)$/);
    if (bulletMatch) {
      listItems.push(bulletMatch[1]);
      return;
    }

    flushList(lineIdx);
    blocks.push(
      <p className="chat-paragraph" key={`p-${lineIdx}`}>
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });

  flushList('end');
  return blocks;
}

export default function ChatBox() {
  const { user } = useAuth();
  const displayName = user?.name || user?.nombre || 'Colaborador';
  const firstName = displayName.split(' ')[0];
  const userInitials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CO';

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hola, ${firstName}. Puedo ayudarte a encontrar políticas, revisar tu saldo de vacaciones o explicar cómo registrar una ausencia.`,
      agentUsed: 'Asistente de Políticas RRHH',
      latencyMs: 0,
    },
  ]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const shouldFollowRef = useRef(true);

  const updateScrollState = () => {
    const node = messagesRef.current;
    if (!node) return;
    const isNearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 72;
    shouldFollowRef.current = isNearBottom;
    setShowJumpButton(!isNearBottom);
  };

  useEffect(() => {
    const node = messagesRef.current;
    if (node && shouldFollowRef.current) {
      node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const sendQuestion = async (cleanQuestion) => {
    if (!cleanQuestion || isLoading) return;
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', text: cleanQuestion }]);
    setQuestion('');
    setIsLoading(true);
    try {
      const answer = await api.askChat(cleanQuestion);
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', ...answer }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: 'No pude conectar con el orquestador. Puedes reintentar esta pregunta.',
          error: true,
          retryQuestion: cleanQuestion,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendQuestion(question.trim());
  };
  const usePrompt = (prompt) => {
    setQuestion(prompt);
    inputRef.current?.focus();
  };

  return (
    <motion.section
      className="chat-panel panel"
      id="chat"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springSoft}
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            <Sparkles size={13} /> Asistente de políticas
          </p>
          <h2>Pregúntale a tus políticas</h2>
        </div>
        <span className="live-indicator">
          <i /> En línea
        </span>
      </div>
      <div className="chat-messages" ref={messagesRef} onScroll={updateScrollState} aria-live="polite">
        <AnimatePresence initial={false} mode="popLayout">
          {messages.map((message) => (
            <motion.div
              className={`message-row ${message.role}`}
              key={message.id}
              variants={messageVariants}
              initial="initial"
              animate="animate"
              exit="initial"
              layout
            >
              <div className="message-avatar">
                {message.role === 'assistant' ? <Bot size={15} /> : userInitials}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {message.personal && (
                    <div className="personal-answer">
                      <small>{message.personal.label}</small>
                      <strong>{message.personal.value}</strong>
                      <span>{message.personal.detail}</span>
                    </div>
                  )}
                  <div className="message-body">
                    {renderFormattedMessage(message.text || message.answer)}
                    {message.role === 'assistant' && !message.error && message.id !== 'welcome' && (
                      <motion.span
                        className="stream-caret"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      />
                    )}
                  </div>
                  {message.policyText && (
                    <div className="policy-answer">
                      <strong>Cómo aplica la política</strong>
                      <span>{message.policyText}</span>
                    </div>
                  )}
                  {message.error && (
                    <button
                      className="text-button retry-button"
                      onClick={() => sendQuestion(message.retryQuestion)}
                    >
                      Reintentar
                    </button>
                  )}
                </div>
                {message.role === 'assistant' && !message.error && (
                  <>
                    <div className="message-meta">
                      <span>{message.agentUsed}</span>
                      {message.latencyMs > 0 && <span>{message.latencyMs} ms</span>}
                    </div>
                    {message.restricted && <SecurityAlert />}
                    {message.outOfScope && (
                      <div className="scope-alert">
                        Consulta fuera del alcance del asistente. Puedo orientarte sobre trámites y políticas de RRHH.
                      </div>
                    )}
                    {message.escalated && <EscalationBanner />}
                    {message.citations?.length > 0 && (
                      <div className="citations">
                        <p className="small-heading">Fuentes consultadas</p>
                        {message.citations.map((citation, idx) => (
                          <CitationCard citation={citation} key={`${citation.title || 'src'}-${idx}`} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div className="message-row assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="message-avatar">
              <Bot size={15} />
            </div>
            <div className="typing">
              <LoaderCircle size={14} className="spin" /> Consultando políticas{' '}
              <span className="typing-dots">
                <i />
                <i />
                <i />
              </span>
            </div>
          </motion.div>
        )}
      </div>
      {showJumpButton && (
        <button
          className="jump-button"
          onClick={() => messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' })}
        >
          Ir al último mensaje
        </button>
      )}
      <form className="chat-composer" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          aria-label="Escribe tu pregunta"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ej. ¿Cómo registro una ausencia médica?"
        />
        <motion.button
          className="button primary"
          type="submit"
          disabled={isLoading || !question.trim()}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}
          <span>Enviar</span>
        </motion.button>
      </form>
      <div className="suggested-prompts">
        <button onClick={() => usePrompt('¿Cuántos días de vacaciones tengo disponibles?')}>
          Consultar saldo de vacaciones <ArrowUpRight size={13} />
        </button>
        <button onClick={() => usePrompt('¿Cómo registro una ausencia médica?')}>
          Registrar una ausencia <ArrowUpRight size={13} />
        </button>
        <button onClick={() => usePrompt('¿Existe un bono por mascotas?')}>
          Consultar una política <ArrowUpRight size={13} />
        </button>
      </div>
    </motion.section>
  );
}
