import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import AppShell from '../../components/AppShell/AppShell';
import KpiGrid from '../../components/KpiGrid/KpiGrid';
import PendingTable from '../../components/PendingTable/PendingTable';
import ReportHistorySelector from '../../components/ReportHistorySelector/ReportHistorySelector';
import TopTopicsChart from '../../components/TopTopicsChart/TopTopicsChart';
import Trend30DaysChart from '../../components/Trend30DaysChart/Trend30DaysChart';
import { api } from '../../services/api';
import { springSoft } from '../../lib/motion';

export default function HrDashboardPage() {
  const today = '2025-06-13';
  const [date, setDate] = useState(today);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);

  const loadReport = (selectedDate = date) => {
    const version = ++requestVersion.current;
    setIsLoading(true);
    setError('');
    api.getDailyReport(selectedDate).then((nextReport) => {
      if (version === requestVersion.current) setReport(nextReport);
    }).catch(() => {
      if (version === requestVersion.current) setError('No pudimos cargar el reporte seleccionado.');
    }).finally(() => {
      if (version === requestVersion.current) setIsLoading(false);
    });
  };

  useEffect(() => { loadReport(today); }, []);

  const handleDateChange = (nextDate) => { setDate(nextDate); loadReport(nextDate); };
  const reportDate = report ? new Date(`${report.date}T12:00:00`).toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';

  return <AppShell eyebrow="People operations · RRHH" title="Buenos días, María" subtitle="Una lectura de las señales que necesitan atención hoy." actions={report && <ReportHistorySelector date={date} options={report.history} onChange={handleDateChange} />}>
    <div className="dashboard-intro"><div><p className="report-date">Reporte del {reportDate || '…'}</p><h2>La organización, en perspectiva.</h2></div><span className={`report-status ${isLoading ? 'updating' : ''}`}><i /> {isLoading ? 'Actualizando reporte…' : 'Sincronizado · demo 07:00 a. m.'}</span></div>
    {error && <div className="feedback-error" role="alert"><span>{error}</span><button className="text-button" onClick={() => loadReport(date)}>Reintentar</button></div>}
    {report ? <motion.div key={report.date} initial={{ opacity: 0.55 }} animate={{ opacity: 1 }} transition={springSoft} className="report-content"><KpiGrid items={report.kpis} /><div className="charts-grid"><Trend30DaysChart data={report.trend} /><TopTopicsChart data={report.topics} /></div><div className="dashboard-lower"><PendingTable items={report.pending} /><section className="panel executive-panel"><div className="panel-heading"><div><p className="eyebrow">Lectura del día</p><h2>Resumen ejecutivo</h2></div></div><p>{report.summary}</p><div className="unresolved"><strong>Preguntas que requieren seguimiento</strong>{report.unresolved.length ? report.unresolved.map((question) => <span key={question}>{question}</span>) : <span>No hay preguntas pendientes.</span>}</div></section></div></motion.div> : <div className="panel empty-state">Selecciona una fecha para consultar el reporte.</div>}
  </AppShell>;
}
