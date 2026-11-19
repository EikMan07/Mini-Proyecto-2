import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { api } from '../../services/api';

function countDays(startDate, endDate) { if (!startDate || !endDate) return 0; const start = new Date(`${startDate}T12:00:00`); const end = new Date(`${endDate}T12:00:00`); return end >= start ? Math.floor((end - start) / 86400000) + 1 : 0; }
function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function LeaveRequestModal({ onClose, onCreated, vacationBalance = 0 }) {
  const [type, setType] = useState('Vacaciones'); const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState(''); const [reason, setReason] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false); const [error, setError] = useState(''); const firstControlRef = useRef(null); const closeTriggerRef = useRef(document.activeElement); const days = countDays(startDate, endDate); const today = getLocalDateValue();
  useEffect(() => { firstControlRef.current?.focus(); const handleKeyDown = (event) => { if (event.key === 'Escape' && !isSubmitting) onClose(); }; document.addEventListener('keydown', handleKeyDown); return () => { document.removeEventListener('keydown', handleKeyDown); closeTriggerRef.current?.focus?.(); }; }, [isSubmitting, onClose]);
  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!days) {
      setError('Selecciona un rango de fechas válido.');
      return;
    }
    if (startDate < today || endDate < today) {
      setError('No puedes solicitar días libres en fechas que ya pasaron.');
      return;
    }
    if (type === 'Vacaciones' && days > vacationBalance) {
      setError(`Solo tienes ${vacationBalance} días disponibles.`);
      return;
    }
    setIsSubmitting(true);
    try {
      onCreated(await api.submitRequest({ type, startDate, endDate, dates: `${startDate} → ${endDate}`, days, reason }));
    } catch (requestError) {
      setError(requestError.message || 'No se pudo enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return <AnimatePresence><motion.div className="modal-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && !isSubmitting && onClose()}><motion.div className="modal" role="dialog" aria-modal="true" aria-labelledby="request-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}><button className="close-button" onClick={onClose} disabled={isSubmitting} aria-label="Cerrar"><X size={18} /></button><p className="eyebrow">Nueva solicitud</p><h2 id="request-title">Pide tiempo para ti</h2><p className="modal-intro">Tu solicitud llegará a la bandeja de RRHH para revisión.</p><form onSubmit={submit}><label>Tipo<select ref={firstControlRef} value={type} onChange={(event) => setType(event.target.value)}><option>Vacaciones</option><option>Permiso personal</option><option>Permiso de estudio</option></select></label><div className="date-range"><label>Desde<input type="date" required min={today} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>Hasta<input type="date" required min={startDate || today} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div>{days > 0 && <p className="days-preview">{days} {days === 1 ? 'día solicitado' : 'días solicitados'}</p>}<label>Nota para RRHH<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Agrega contexto (opcional)" rows="3" /></label>{error && <p className="feedback-error" role="alert">{error}</p>}<button className="button primary full-width" disabled={isSubmitting}>{isSubmitting ? 'Enviando…' : 'Enviar solicitud'}</button></form></motion.div></motion.div></AnimatePresence>;
}
