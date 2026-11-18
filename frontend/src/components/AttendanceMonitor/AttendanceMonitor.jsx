import { Check, Clock3, LogOut } from 'lucide-react';

export default function AttendanceMonitor({ items = [] }) {
  return <section className="panel attendance-monitor"><div className="panel-heading"><div><p className="eyebrow"><Clock3 size={13} /> Control de jornada</p><h2>Entradas y salidas confirmadas</h2></div></div><div className="attendance-table">{items.length ? items.map((item) => <div className="attendance-row" key={`${item.person}-${item.department}`}><div><strong>{item.person}</strong><small>{item.department}</small></div><span><Check size={13} /> Entrada: {item.checkedAt || 'Pendiente'}</span><span className={item.checkedOutAt ? 'checkout-complete' : 'checkout-pending'}>{item.checkedOutAt ? <LogOut size={13} /> : <Clock3 size={13} />} Salida: {item.checkedOutAt || 'Pendiente'}</span></div>) : <p className="empty-state">No hay marcas para este reporte.</p>}</div></section>;
}
