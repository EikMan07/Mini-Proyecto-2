import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { api } from '../../services/api';

export default function LeaveRequestModal({ onClose, onCreated }) {
  const [type, setType] = useState('Vacaciones');
  const [dates, setDates] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const firstControlRef = useRef(null);
  const closeTriggerRef = useRef(document.activeElement);

  useEffect(() => {
    firstControlRef.current?.focus();
    const handleKeyDown = (event) => { if (event.key === 'Escape' && !isSubmitting) onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); closeTriggerRef.current?.focus?.(); };
  }, [isSubmitting, onClose]);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try { onCreated(await api.submitRequest({ type, dates, reason })); }
    catch { setError('No se pudo enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.'); }
    finally { setIsSubmitting(false); }
  };

  return <AnimatePresence><motion.div className="modal-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && !isSubmitting && onClose()}><motion.div className="modal" role="dialog" aria-modal="true" aria-labelledby="request-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
    <button className="close-button" onClick={onClose} disabled={isSubmitting} aria-label="Cerrar"><X size={18} /></button>
    <p className="eyebrow">Nueva solicitud</p><h2 id="request-title" tabIndex="-1">Pide tiempo para ti</h2><p className="modal-intro">Tu solicitud llegará a la bandeja de RRHH para revisión.</p>
    <form onSubmit={submit}><label>Tipo<select ref={firstControlRef} value={type} onChange={(event) => setType(event.target.value)}><option>Vacaciones</option><option>Permiso personal</option><option>Permiso de estudio</option></select></label><label>Fechas<input required value={dates} onChange={(event) => setDates(event.target.value)} placeholder="Ej. 18–20 julio 2025" /></label><label>Nota para RRHH<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Agrega contexto (opcional)" rows="3" /></label>{error && <p className="feedback-error" role="alert">{error}</p>}<button className="button primary full-width" disabled={isSubmitting}>{isSubmitting ? 'Enviando…' : 'Enviar solicitud'}</button></form>
  </motion.div></motion.div></AnimatePresence>;
}
