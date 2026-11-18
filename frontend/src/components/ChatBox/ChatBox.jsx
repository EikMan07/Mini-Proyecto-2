import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Bot, LoaderCircle, Send, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { messageVariants, springSoft } from '../../lib/motion';
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
  return <motion.section className="chat-panel panel" id="chat" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={springSoft}><div className="panel-heading"><div><p className="eyebrow"><Sparkles size={13} /> Asistente interno</p><h2>Pregúntale a tus políticas</h2></div><span className="live-indicator"><i /> En línea</span></div><div className="chat-messages" aria-live="polite"><AnimatePresence initial={false}>{messages.map((message) => <motion.div className={`message-row ${message.role}`} key={message.id} variants={messageVariants} initial="initial" animate="animate" layout><div className="message-avatar">{message.role === 'assistant' ? <Bot size={15} /> : 'KV'}</div><div className="message-content"><div className="message-bubble"><p>{message.text || message.answer}{message.role === 'assistant' && message.id !== 'welcome' && <motion.span className="stream-caret" animate={{ opacity: [1, 0] }} transition={{ duration: .6, repeat: Infinity }} />}</p></div>{message.role === 'assistant' && !message.error && <><div className="message-meta"><span>{message.agentUsed}</span>{message.latencyMs && <span>{message.latencyMs} ms</span>}</div>{message.restricted && <SecurityAlert />}{message.escalated && <EscalationBanner />}{message.citations?.length > 0 && <div className="citations"><p className="small-heading">Fuentes consultadas</p>{message.citations.map((citation) => <CitationCard citation={citation} key={citation.title} />)}</div>}</>}</div></motion.div>)}</AnimatePresence>{isLoading && <motion.div className="message-row assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><div className="message-avatar"><Bot size={15} /></div><div className="typing"><LoaderCircle size={14} className="spin" /> Consultando el orquestador <span className="typing-dots"><i /><i /><i /></span></div></motion.div>}</div><form className="chat-composer" onSubmit={sendQuestion}><input aria-label="Escribe tu pregunta" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ej. ¿Cómo registro una ausencia médica?" /><motion.button className="button primary" type="submit" disabled={isLoading} whileTap={{ scale: .97 }}>{isLoading ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}<span>Enviar</span></motion.button></form><div className="suggested-prompts"><button onClick={() => setQuestion('¿Cuántos días de vacaciones tengo?')}>Mi saldo de vacaciones <ArrowUpRight size={13} /></button><button onClick={() => setQuestion('¿Cómo registro una ausencia médica?')}>Registrar una ausencia <ArrowUpRight size={13} /></button><button onClick={() => setQuestion('¿Existe un bono por mascotas?')}>Buscar una política <ArrowUpRight size={13} /></button></div></motion.section>;
}
