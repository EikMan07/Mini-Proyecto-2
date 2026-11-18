import { useState } from 'react';
import { api } from '../../services/api';
import StatusBadge from '../StatusBadge/StatusBadge';

export default function AttendanceCard({ attendance, onCheckedIn }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptName, setReceiptName] = useState('');
  const checkedIn = attendance?.status === 'registrada';
  const handleCheckIn = async () => { setIsSubmitting(true); const result = await api.checkIn(); onCheckedIn(result); setIsSubmitting(false); };
  return <section className="panel attendance-card"><div className="panel-heading"><div><p className="eyebrow">Hoy · viernes 13 de junio</p><h2>Tu jornada empieza aquí</h2></div><StatusBadge tone={checkedIn ? 'success' : 'warning'}>{checkedIn ? 'Entrada registrada' : 'Pendiente'}</StatusBadge></div><div className="attendance-main"><div className="attendance-time">{checkedIn ? attendance.checkedAt : '—:—'}<small>{checkedIn ? 'Marca confirmada' : 'Todavía no has marcado'}</small></div><button className="button primary" onClick={handleCheckIn} disabled={checkedIn || isSubmitting}>{isSubmitting ? 'Guardando…' : checkedIn ? 'Asistencia marcada' : 'Hoy entré a trabajar'}<span>→</span></button></div><div className="attendance-divider" /><div className="medical-row"><div><strong>¿Faltaste por una razón médica?</strong><p>Sube el comprobante de clínica o CCSS para que RRHH lo revise.</p></div><label className="upload-button">{receiptName ? `✓ ${receiptName}` : 'Adjuntar comprobante'}<input type="file" accept="image/*,.pdf" onChange={(event) => setReceiptName(event.target.files?.[0]?.name || '')} /></label></div></section>;
}
