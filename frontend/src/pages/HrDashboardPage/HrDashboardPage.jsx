import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, RefreshCw, Users } from 'lucide-react';
import AppShell from '../../components/AppShell/AppShell';
import KpiGrid from '../../components/KpiGrid/KpiGrid';
import PendingTable from '../../components/PendingTable/PendingTable';
import ReportHistorySelector from '../../components/ReportHistorySelector/ReportHistorySelector';
import TopTopicsChart from '../../components/TopTopicsChart/TopTopicsChart';
import Trend30DaysChart from '../../components/Trend30DaysChart/Trend30DaysChart';
import ReportDetails from '../../components/ReportDetails/ReportDetails';
import RequestReviewPanel from '../../components/RequestReviewPanel/RequestReviewPanel';
import DocumentsInbox from '../../components/DocumentsInbox/DocumentsInbox';
import WorkersDirectory from '../../components/WorkersDirectory/WorkersDirectory';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { dashboardItemVariants, dashboardVariants } from '../../lib/motion';

export default function HrDashboardPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState('resumen');
  const [date, setDate] = useState(today);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [error, setError] = useState('');
  const requestVersion = useRef(0);

  const loadReport = (selectedDate = date) => {
    const version = ++requestVersion.current;
    setIsLoading(true);
    setError('');
    api
      .getDailyReport(selectedDate)
      .then((nextReport) => {
        if (version === requestVersion.current) {
          setReport(nextReport);
          if (nextReport?.date && nextReport.date !== selectedDate && !selectedDate) {
            setDate(nextReport.date);
          }
        }
      })
      .catch(() => {
        if (version === requestVersion.current) {
          setError('No pudimos cargar el reporte seleccionado.');
        }
      })
      .finally(() => {
        if (version === requestVersion.current) setIsLoading(false);
      });
  };

  useEffect(() => {
    loadReport(today);
  }, []);

  const handleDateChange = (nextDate) => {
    setDate(nextDate);
    loadReport(nextDate);
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    setSyncMessage('');
    try {
      const data = await api.syncDrive(false);
      const res = data?.resultado || {};
      const procesados =
        res.archivos_procesados !== undefined && res.archivos_procesados !== null
          ? res.archivos_procesados
          : 0;
      const fragmentos =
        res.fragmentos_indexados !== undefined && res.fragmentos_indexados !== null
          ? res.fragmentos_indexados
          : 0;
      setSyncMessage(`Drive sincronizado: ${procesados} archivos procesados y ${fragmentos} fragmentos indexados.`);
    } catch (syncErr) {
      setSyncMessage(syncErr.message || 'No pudimos sincronizar los documentos desde Drive.');
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const firstName = (user?.name || user?.nombre || 'RRHH').split(' ')[0];
  const reportDate = report?.date
    ? new Date(`${report.date}T12:00:00`).toLocaleDateString('es-CR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '';

  return (
    <AppShell
      eyebrow="Talento Humano · RRHH"
      title={`Buenos días, ${firstName}`}
      subtitle="Una lectura de las señales que necesitan atención hoy."
      actions={
        <div
          className="dashboard-actions"
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
        >
          <button
            type="button"
            className="button secondary"
            onClick={handleSyncDrive}
            disabled={isSyncingDrive}
          >
            <RefreshCw size={15} className={isSyncingDrive ? 'spin' : ''} />
            {isSyncingDrive ? 'Sincronizando Drive…' : 'Sincronizar Drive'}
          </button>
          {activeTab === 'resumen' && report && (
            <ReportHistorySelector
              date={date}
              options={report.history || []}
              onChange={handleDateChange}
            />
          )}
        </div>
      }
    >
      <div className="workers-tab-bar" role="tablist" aria-label="Secciones de Recursos Humanos">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'resumen'}
          className={`workers-tab-btn ${activeTab === 'resumen' ? 'active' : ''}`}
          onClick={() => setActiveTab('resumen')}
        >
          <LayoutDashboard size={15} /> Resumen diario
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'trabajadores'}
          className={`workers-tab-btn ${activeTab === 'trabajadores' ? 'active' : ''}`}
          onClick={() => setActiveTab('trabajadores')}
        >
          <Users size={15} /> Trabajadores
        </button>
      </div>

      {syncMessage && (
        <div className="panel" role="status" style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <span>{syncMessage}</span>
        </div>
      )}

      {activeTab === 'trabajadores' ? (
        <WorkersDirectory attendanceItems={report?.attendance || []} />
      ) : (
        <>
          <div className="dashboard-intro">
            <div>
              <p className="report-date">Reporte del {reportDate || '…'}</p>
              <h2>La organización, en perspectiva.</h2>
            </div>
            <span className={`report-status ${isLoading ? 'updating' : ''}`}>
              <i /> {isLoading ? 'Actualizando reporte…' : 'Sincronizado en vivo'}
            </span>
          </div>

          {error && (
            <div className="feedback-error" role="alert">
              <span>{error}</span>
              <button className="text-button" onClick={() => loadReport(date)}>
                Reintentar
              </button>
            </div>
          )}

          {report ? (
            <motion.div
              key={report.date}
              className="report-content"
              variants={dashboardVariants}
              initial="initial"
              animate="animate"
            >
              <KpiGrid items={report.kpis || []} />
              <motion.div className="charts-grid" variants={dashboardItemVariants}>
                <Trend30DaysChart data={report.trend || []} />
                <TopTopicsChart data={report.topics || []} />
              </motion.div>
              <ReportDetails report={report} />
              <div className="dashboard-workspace-grid">
                <div className="dashboard-workspace-main">
                  <RequestReviewPanel
                    items={(report.pending || []).map((item) => item.request).filter(Boolean)}
                    onReviewed={() => loadReport(date)}
                  />
                  <DocumentsInbox documents={report.documents || []} onReviewed={() => loadReport(date)} />
                  <PendingTable items={report.pending || []} />
                </div>
                <motion.section className="panel executive-panel" variants={dashboardItemVariants}>
                  <div className="panel-heading">
                    <div>
                      <p className="eyebrow">Lectura del día</p>
                      <h2>Resumen ejecutivo</h2>
                    </div>
                  </div>
                  <p>{report.summary}</p>
                  <div className="unresolved">
                    <strong>Preguntas que requieren seguimiento</strong>
                    {report.unresolved?.length ? (
                      report.unresolved.map((question, idx) => <span key={`${question}-${idx}`}>{question}</span>)
                    ) : (
                      <span>No hay preguntas pendientes.</span>
                    )}
                  </div>
                </motion.section>
              </div>
            </motion.div>
          ) : (
            <div className="panel empty-state">Selecciona una fecha para consultar el reporte.</div>
          )}
        </>
      )}
    </AppShell>
  );
}
