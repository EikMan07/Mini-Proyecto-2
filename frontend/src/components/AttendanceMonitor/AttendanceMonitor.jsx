import { useMemo, useState } from 'react';
import { Check, Clock3, LogOut, Search } from 'lucide-react';
import './AttendanceMonitor.css';

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function AttendanceMonitor({ items = [] }) {
  const [search, setSearch] = useState('');
  const [departamento, setDepartamento] = useState('todos');
  const [estado, setEstado] = useState('todos');

  const safeItems = Array.isArray(items) ? items : [];

  const departamentos = useMemo(() => {
    const unique = new Set();
    safeItems.forEach((item) => {
      if (item?.department) unique.add(String(item.department).trim());
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }, [safeItems]);

  const filteredItems = useMemo(() => {
    const term = normalizeText(search);
    return safeItems.filter((item) => {
      if (departamento !== 'todos' && String(item?.department || '').trim() !== departamento) {
        return false;
      }

      if (estado === 'en_curso' && item?.checkedOutAt) {
        return false;
      }
      if (estado === 'completada' && !(item?.checkedAt && item?.checkedOutAt)) {
        return false;
      }
      if (estado === 'tardia' && !(item?.checkedAt && String(item.checkedAt) > '08:05')) {
        return false;
      }
      if (estado === 'temprana' && !(item?.checkedOutAt && String(item.checkedOutAt) < '17:00')) {
        return false;
      }

      if (term) {
        const haystack = normalizeText(
          `${item?.person || ''} ${item?.apellidos || ''} ${item?.department || ''}`
        );
        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [safeItems, search, departamento, estado]);

  const count = filteredItems.length;
  const countLabel = `${count} ${count === 1 ? 'registro' : 'registros'}`;

  return (
    <section className="panel attendance-monitor" aria-labelledby="attendance-monitor-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            <Clock3 size={13} /> Control de jornada
          </p>
          <h2 id="attendance-monitor-title">Entradas y salidas confirmadas</h2>
        </div>
        <span className="attendance-count-badge">{countLabel}</span>
      </div>

      <div className="attendance-toolbar" role="search" aria-label="Filtros de control de jornada">
        <div className="attendance-search-box">
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, apellidos o departamento"
            aria-label="Buscar marca de jornada"
          />
        </div>

        <div className="attendance-filters">
          <select
            value={departamento}
            onChange={(event) => setDepartamento(event.target.value)}
            aria-label="Filtrar jornada por departamento"
          >
            <option value="todos">Todos los departamentos</option>
            {departamentos.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>

          <select
            value={estado}
            onChange={(event) => setEstado(event.target.value)}
            aria-label="Filtrar jornada por estado"
          >
            <option value="todos">Todos los estados</option>
            <option value="en_curso">Jornada en curso</option>
            <option value="completada">Jornada completada</option>
            <option value="tardia">Llegada tardía</option>
            <option value="temprana">Salida temprana</option>
          </select>
        </div>
      </div>

      <div className="attendance-table">
        {filteredItems.length ? (
          filteredItems.map((item, idx) => (
            <div
              className="attendance-row"
              key={`${item.id ?? idx}-${item.person}-${item.department}`}
            >
              <div>
                <strong>{item.person}</strong>
                <small>{item.department}</small>
              </div>
              <span>
                <Check size={13} /> Entrada: {item.checkedAt || 'Pendiente'}
              </span>
              <span className={item.checkedOutAt ? 'checkout-complete' : 'checkout-pending'}>
                {item.checkedOutAt ? <LogOut size={13} /> : <Clock3 size={13} />} Salida:{' '}
                {item.checkedOutAt || 'Pendiente'}
              </span>
            </div>
          ))
        ) : (
          <p className="empty-state">
            {safeItems.length
              ? 'No hay marcas que coincidan con los filtros seleccionados.'
              : 'No hay marcas para este reporte.'}
          </p>
        )}
      </div>
    </section>
  );
}
