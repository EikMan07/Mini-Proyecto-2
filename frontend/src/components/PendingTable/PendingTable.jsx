import StatusBadge from '../StatusBadge/StatusBadge';

export default function PendingTable({ items = [] }) {
  return (
    <section className="panel pending-panel" id="requests">
      <div className="panel-heading">
        <div><p className="eyebrow">Bandeja de atención</p><h2>Solicitudes pendientes</h2></div>
      </div>
      {items.length === 0 ? <p className="empty-state">No hay solicitudes pendientes para esta fecha.</p> : (
        <div className="table-scroll">
          <table><caption className="sr-only">Solicitudes pendientes de revisión</caption>
            <thead><tr><th>Colaborador</th><th>Solicitud</th><th>Área</th><th>Antigüedad</th><th>Estado</th></tr></thead>
            <tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.person}</strong><small>{item.id}</small></td><td>{item.type}</td><td>{item.department}</td><td>{item.age}</td><td><StatusBadge tone={item.overdue ? 'critical' : 'warning'}>{item.overdue ? 'Vencida' : 'En revisión'}</StatusBadge></td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
