import { useEffect, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import AppShell from '../../components/AppShell/AppShell';
import AttendanceCard from '../../components/AttendanceCard/AttendanceCard';
import ChatBox from '../../components/ChatBox/ChatBox';
import LeaveRequestModal from '../../components/LeaveRequestModal/LeaveRequestModal';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { api } from '../../services/api';
import { dashboardItemVariants, dashboardVariants, springSoft } from '../../lib/motion';
import RightsCenter from '../../components/RightsCenter/RightsCenter';
import WorkCalendar from '../../components/WorkCalendar/WorkCalendar';
import { getVacationBalance } from '../../services/workflowService';

export default function EmployeePortalPage() {
  const [summary, setSummary] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = () => {
    setIsLoading(true);
    setError('');
    api.getEmployeeSummary().then(setSummary).catch(() => setError('No pudimos cargar tu resumen. Intenta nuevamente.')).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSummary();
    const refreshSummary = () => loadSummary();
    const handleStorage = (event) => {
      if (!event.key || event.key.includes('ticosoft-demo-')) refreshSummary();
    };
    window.addEventListener('focus', refreshSummary);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('focus', refreshSummary);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  if (!summary && (isLoading || error)) return <div className="route-loader"><p>{isLoading ? 'Cargando tu espacio…' : error}</p>{error && <button className="button secondary" onClick={loadSummary}>Reintentar</button>}</div>;

  const addRequest = (request) => {
    setSummary((current) => ({
      ...current,
      vacationBalance: request.type === 'Vacaciones' ? getVacationBalance() : current.vacationBalance,
      requests: [request, ...current.requests],
    }));
    setIsModalOpen(false);
  };

  return (
    <AppShell
      eyebrow="Portal del colaborador"
      title="Tu espacio de trabajo"
      actions={<button className="button secondary" onClick={() => setIsModalOpen(true)}>Nueva solicitud <span>↗</span></button>}
    >
      <LayoutGroup id="employee-dashboard">
        <motion.div className="portal-grid" layout initial="initial" animate="animate" variants={dashboardVariants}>
          <motion.div className="portal-main" variants={dashboardItemVariants}>
            <ChatBox />
            <AttendanceCard
              attendance={summary.attendanceToday}
              onCheckedIn={(result) => setSummary((current) => ({ ...current, attendanceToday: result }))}
            />
          </motion.div>

          <motion.aside className="portal-aside" variants={dashboardVariants}>
            <WorkCalendar />
            <motion.section className="balance-card" layout transition={springSoft} whileHover={{ y: -3 }}>
              <p className="eyebrow">Saldo disponible</p>
              <strong>{Math.floor(Number(summary.vacationBalance) || 0)}<small> días</small></strong>
              <p>de vacaciones para usar este año</p>
              <button className="text-button" onClick={() => setIsModalOpen(true)}>Solicitar días →</button>
            </motion.section>

            <motion.section className="panel request-list" layout transition={springSoft} id="requests">
              <div className="panel-heading">
                <div><p className="eyebrow">Actividad personal</p><h2>Tus solicitudes</h2></div>
              </div>
              <div className="request-items">
                {summary.requests.map((request) => (
                  <motion.div
                    className="request-item"
                    key={request.id}
                    layout
                    layoutId={`request-${request.id}`}
                    transition={springSoft}
                    whileHover={{ x: 4 }}
                  >
                    <div>
                      <strong>{request.type}</strong>
                      <p>{request.dates} · {request.createdAt}</p>
                      {request.type === 'Vacaciones' && request.status === 'Aprobada' && (
                        <p className="request-confirmation">
                          Vacaciones aprobadas: se descontaron {request.days} {request.days === 1 ? 'día' : 'días'} de tu saldo.
                        </p>
                      )}
                    </div>
                    <StatusBadge tone={request.status === 'Aprobada' ? 'success' : 'warning'}>{request.status}</StatusBadge>
                  </motion.div>
                ))}
              </div>
            </motion.section>

          </motion.aside>
        </motion.div>
      </LayoutGroup>
      <div className="employee-resource-grid"><RightsCenter /></div>

      {isModalOpen && <LeaveRequestModal onClose={() => setIsModalOpen(false)} onCreated={addRequest} vacationBalance={summary.vacationBalance} />}
    </AppShell>
  );
}
