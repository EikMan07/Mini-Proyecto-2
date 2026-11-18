import { Activity, BriefcaseBusiness, CalendarDays, HeartPulse, MessageSquareText, UsersRound } from 'lucide-react';
import StatusBadge from '../StatusBadge/StatusBadge';

const blocks = [
  { key: 'absences', icon: CalendarDays, label: 'Ausencias del día' },
  { key: 'medical', icon: HeartPulse, label: 'Incapacidades' },
  { key: 'movements', icon: UsersRound, label: 'Movimientos de personal' },
  { key: 'vacationRisk', icon: BriefcaseBusiness, label: 'Vacaciones acumuladas' },
  { key: 'chatUsage', icon: MessageSquareText, label: 'Uso del chatbot' },
];

function Value({ value }) { return <strong className="detail-value">{value ?? 'Dato no disponible'}</strong>; }

export default function ReportDetails({ report }) {
  const details = report.details || {};
  return <section className="report-details" aria-label="Detalle operativo del reporte">
    {blocks.map(({ key, icon: Icon, label }) => {
      const item = details[key] || {};
      return <article className="panel report-detail-card" key={key}>
        <div className="detail-card-heading"><span className="detail-icon"><Icon size={16} /></span><p>{label}</p></div>
        <Value value={item.total} />
        {item.detail && <p className="detail-description">{item.detail}</p>}
        {item.breakdown && <div className="detail-breakdown">{Object.entries(item.breakdown).map(([name, value]) => <span key={name}><small>{name}</small><b>{value}</b></span>)}</div>}
        {item.status && <StatusBadge tone={item.tone || 'neutral'}>{item.status}</StatusBadge>}
      </article>;
    })}
    <article className="panel report-detail-card unresolved-card">
      <div className="detail-card-heading"><span className="detail-icon"><Activity size={16} /></span><p>Preguntas sin respuesta</p></div>
      <Value value={details.unresolvedCount ?? report.unresolved?.length} />
      <div className="unresolved compact-unresolved">{report.unresolved?.length ? report.unresolved.map((question) => <span key={question}>{question}</span>) : <span>No hay preguntas pendientes.</span>}</div>
    </article>
  </section>;
}
