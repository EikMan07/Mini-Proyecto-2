import { useEffect, useState } from 'react';
import { CalendarDays, ExternalLink, LoaderCircle } from 'lucide-react';
import { getCostaRicaHolidays } from '../../services/realDataService';

export default function WorkCalendar() {
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { getCostaRicaHolidays().then(setHolidays).catch(() => setError('No pudimos consultar el calendario laboral.')).finally(() => setIsLoading(false)); }, []);
  return <section className="panel work-calendar"><div className="panel-heading"><div><p className="eyebrow"><CalendarDays size={13} /> Calendario laboral</p><h2>Feriados de Costa Rica</h2></div><a href="https://www.mtss.go.cr/temas-laborales/feriados/feriados_calendario_2026.pdf" target="_blank" rel="noreferrer" aria-label="Abrir calendario oficial"><ExternalLink size={16} /></a></div>{isLoading && <p className="calendar-state"><LoaderCircle className="spin" size={15} /> Consultando calendario actualizado…</p>}{error && <p className="calendar-state field-error">{error}</p>}{!isLoading && !error && <div className="holiday-list">{holidays.slice(0, 6).map((holiday) => <div className="holiday-item" key={holiday.date}><div><strong>{holiday.localName || holiday.name}</strong><small>{new Date(`${holiday.date}T12:00:00`).toLocaleDateString('es-CR', { day: 'numeric', month: 'long' })}</small></div><span>{holiday.types?.includes('Public') ? 'Pago obligatorio' : 'Feriado'}</span></div>)}</div>}</section>;
}
