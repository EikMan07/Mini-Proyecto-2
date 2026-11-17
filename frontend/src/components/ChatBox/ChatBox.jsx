import { useState } from 'react';
import { api } from '../../services/api';
import CitationCard from '../CitationCard/CitationCard';
import SecurityAlert from '../SecurityAlert/SecurityAlert';
import EscalationBanner from '../EscalationBanner/EscalationBanner';

const initialMessages = [{ id: 'welcome', role: 'assistant', text: 'Hola, Kendall. Puedo ayudarte a encontrar políticas, revisar tu saldo de vacaciones o explicar cómo registrar una ausencia.', agentUsed: 'HR Policy Agent', latencyMs: 318 }];

export default function ChatBox() {
  const [messages, setMessages] = useState(initialMessages);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sendQuestion = async (event) => {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || isLoading) return;
    setMessages((current) => [...current, { id: Date.now(), role: 'user', text: cleanQuestion }]);
    setQuestion(''); setIsLoading(true);
    try { const answer = await api.askChat(cleanQuestion); setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', ...answer }]); } catch { setMessages((current) => [...current, { id: Date.now() + 1, role: 'assistant', text: 'No pude conectar con el orquestador. Intenta de nuevo en unos segundos.', error: true }]); } finally { setIsLoading(false); }
  };
  return <section className="chat-panel panel" id="chat"><div className="panel-heading"><div><p className="eyebrow">Asistente interno</p><h2>Pregúntale a tus políticas</h2></div><span className="live-indicator"><i /> En línea</span></div><div className="chat-messages" aria-live="polite">{messages.map((message) => <div className={`message-row ${message.role}`} key={message.id}><div className="message-avatar">{message.role === 'assistant' ? 'K' : 'KV'}</div><div className="message-content"><div className="message-bubble"><p>{message.text || message.answer}</p></div>{message.role === 'assistant' && !message.error && <><div className="message-meta"><span>{message.agentUsed}</span>{message.latencyMs && <span>{message.latencyMs} ms</span>}</div>{message.restricted && <SecurityAlert />}{message.escalated && <EscalationBanner />}{message.citations?.length > 0 && <div className="citations"><p className="small-heading">Fuentes consultadas</p>{message.citations.map((citation) => <CitationCard citation={citation} key={citation.title} />)}</div>}</>}</div></div>)}{isLoading && <div className="message-row assistant"><div className="message-avatar">K</div><div className="typing"><span /><span /><span /> Consultando el orquestador…</div></div>}</div><form className="chat-composer" onSubmit={sendQuestion}><input aria-label="Escribe tu pregunta" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ej. ¿Cómo registro una ausencia médica?" /><button className="button primary" type="submit" disabled={isLoading}>Enviar <span>↗</span></button></form><div className="suggested-prompts"><button onClick={() => setQuestion('¿Cuántos días de vacaciones tengo?')}>Mi saldo de vacaciones</button><button onClick={() => setQuestion('¿Cómo registro una ausencia médica?')}>Registrar una ausencia</button><button onClick={() => setQuestion('¿Existe un bono por mascotas?')}>Buscar una política</button></div></section>;
}
