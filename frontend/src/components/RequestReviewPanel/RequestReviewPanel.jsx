import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '../../services/api';
import StatusBadge from '../StatusBadge/StatusBadge';

export default function RequestReviewPanel({ items = [], onReviewed }) {
  const [busyId, setBusyId] = useState('');
  const review = async (item, status) => { setBusyId(item.id); try { await api.updateRequestStatus(item.id, status); onReviewed?.(item.id, status); } finally { setBusyId(''); } };
  return <section className="panel review-panel"><div className="panel-heading"><div><p className="eyebrow">Decisiones de RRHH</p><h2>Revisar solicitudes</h2></div></div>{items.length ? <div className="review-list">{items.map((item) => <article className="review-item" key={item.id}><div><strong>{item.person}</strong><p>{item.type} · {item.dates || `${item.startDate} → ${item.endDate}`} · {item.days || 1} días</p>{item.reason && <small>{item.reason}</small>}</div><div className="review-actions"><StatusBadge tone="warning">Pendiente</StatusBadge><button className="review-approve" disabled={busyId === item.id} onClick={() => review(item, 'Aprobada')} aria-label={`Aprobar ${item.id}`}><Check size={15} /></button><button className="review-reject" disabled={busyId === item.id} onClick={() => review(item, 'Rechazada')} aria-label={`Rechazar ${item.id}`}><X size={15} /></button></div></article>)}</div> : <p className="empty-state">No hay solicitudes pendientes de revisión.</p>}</section>;
}
