import AppShell from '../../components/AppShell/AppShell';
import WorkersDirectory from '../../components/WorkersDirectory/WorkersDirectory';
import { useAuth } from '../../context/AuthContext';

export default function HrWorkersPage() {
  const { user } = useAuth();
  const firstName = (user?.name || user?.nombre || 'RRHH').split(' ')[0];

  return (
    <AppShell
      eyebrow="Talento Humano · RRHH"
      title={`Trabajadores · ${firstName}`}
      subtitle="Consulta el expediente, puntualidad, horas extra, incapacidades y días libres de toda la planilla."
    >
      <WorkersDirectory />
    </AppShell>
  );
}
