import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock3, FileUp, LoaderCircle, LogOut, UploadCloud } from 'lucide-react';
import { api } from '../../services/api';
import useLocalContext from '../../hooks/useLocalContext';
import StatusBadge from '../StatusBadge/StatusBadge';

export default function AttendanceCard({ attendance, onCheckedIn }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptName, setReceiptName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const { date, time, location } = useLocalContext();
  const checkedIn = attendance?.status === 'registrada';
  const checkedOut = attendance?.status === 'cerrada';

  const handleCheckIn = async () => {
    setError(''); setIsSubmitting(true);
    try { onCheckedIn(await api.checkIn()); }
    catch { setError('No se pudo registrar la entrada. Inténtalo de nuevo.'); }
    finally { setIsSubmitting(false); }
  };
  const handleCheckOut = async () => {
    setError(''); setIsSubmitting(true);
    try { onCheckedIn(await api.checkOut()); }
    catch { setError('No se pudo registrar la salida. Inténtalo de nuevo.'); }
    finally { setIsSubmitting(false); }
  };

  const handleFile = (file) => setReceiptName(file?.name || '');

  return <motion.section className="panel attendance-card" layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }}>
    <div className="panel-heading"><div><p className="eyebrow"><Clock3 size={13} /> {date}</p><p className="live-location">{location.permission === 'granted' ? 'Ubicación actual' : 'Hora local del dispositivo'} · {location.label}</p><h2>{checkedOut ? 'Tu jornada terminó aquí' : 'Tu jornada empieza aquí'}</h2></div><StatusBadge tone={checkedIn || checkedOut ? 'success' : 'warning'}>{checkedOut ? <><Check size={12} /> Salida registrada</> : checkedIn ? <><Check size={12} /> Entrada registrada</> : 'Entrada pendiente'}</StatusBadge></div>
    <div className="attendance-main"><motion.div className="attendance-time" animate={checkedIn || checkedOut ? { scale: [1, 1.08, 1] } : {}}>{checkedOut ? attendance.checkedOutAt : checkedIn ? attendance.checkedAt : time}<small>{checkedOut ? 'Salida confirmada por el servicio' : checkedIn ? `Entrada registrada · ${attendance.checkedAt}` : 'Hora actual en tu ubicación'}</small></motion.div><div><motion.button className="button primary" onClick={checkedIn ? handleCheckOut : handleCheckIn} disabled={checkedOut || isSubmitting} whileTap={{ scale: .97 }}>{isSubmitting ? <><LoaderCircle className="spin" size={16} /> Registrando…</> : checkedOut ? <><Check size={16} /> Jornada cerrada</> : checkedIn ? <><LogOut size={16} /> Marcar salida</> : <><Clock3 size={16} /> Marcar entrada</>}</motion.button>{error && <p className="field-error" role="alert">{error}</p>}</div></div>
    <div className="attendance-divider" />
    <div className="medical-row"><div><strong>¿Faltaste por una razón médica?</strong><p>Sube el comprobante de clínica o CCSS para que RRHH lo revise.</p></div><label className={`upload-button ${isDragging ? 'dragging' : ''}`} onDragEnter={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setIsDragging(false); handleFile(event.dataTransfer.files?.[0]); }}>{receiptName ? <><Check size={14} /> {receiptName}</> : <><UploadCloud size={16} /> Seleccionar comprobante</>}<input type="file" accept="image/*,.pdf" onChange={(event) => handleFile(event.target.files?.[0])} /></label></div>
    <AnimatePresence>{receiptName && <motion.div className="upload-success" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}><FileUp size={14} /> Archivo seleccionado: {receiptName}<button className="text-button" type="button" onClick={() => setReceiptName('')}>Quitar</button></motion.div>}</AnimatePresence>
  </motion.section>;
}
