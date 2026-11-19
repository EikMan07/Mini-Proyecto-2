import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Briefcase,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartPulse,
  MapPin,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import AttendanceMonitor from '../AttendanceMonitor/AttendanceMonitor';
import StatusBadge from '../StatusBadge/StatusBadge';
import './WorkersDirectory.css';

function formatNumberSafe(value, suffix = '') {
  const num = value !== undefined && value !== null ? Number(value) : 0;
  return `${Number.isNaN(num) ? 0 : num}${suffix}`;
}

function WorkerProfileModal({ workerId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workerId) return undefined;
    let active = true;
    setIsLoading(true);
    setError('');

    api
      .getHrWorkerDetail(workerId)
      .then((data) => {
        if (active) setDetail(data);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'No fue posible cargar el expediente.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [workerId]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const ficha = detail?.trabajador;
  const resumen = detail?.resumen;
  const asistencias = Array.isArray(detail?.asistencias) ? detail.asistencias : [];
  const incapacidades = Array.isArray(detail?.incapacidades) ? detail.incapacidades : [];
  const solicitudes = Array.isArray(detail?.solicitudes) ? detail.solicitudes : [];

  return (
    <div
      className="worker-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="worker-modal-card" role="dialog" aria-modal="true" aria-labelledby="worker-modal-title">
        <header className="worker-modal-header">
          <div>
            <p className="eyebrow">Expediente laboral</p>
            <h3 id="worker-modal-title">
              {ficha ? ficha.nombre : 'Cargando expediente'}
            </h3>
            <p>
              {ficha
                ? `${ficha.codigo_empleado} · ${ficha.puesto} · ${ficha.departamento}`
                : 'Consultando historial del colaborador'}
            </p>
          </div>
          <button
            type="button"
            className="worker-modal-close"
            onClick={onClose}
            aria-label="Cerrar expediente"
          >
            <X size={18} />
          </button>
        </header>

        <div className="worker-modal-body">
          {isLoading && <p className="empty-state">Cargando datos del expediente…</p>}
          {!isLoading && error && (
            <p className="feedback-error" role="alert">
              {error}
            </p>
          )}

          {!isLoading && !error && ficha && (
            <>
              <div className="worker-detail-grid">
                <article className="worker-info-block">
                  <h4>
                    <UserCheck size={14} /> Identidad y contacto
                  </h4>
                  <div className="worker-info-row">
                    <span>Cédula</span>
                    <strong>{ficha.cedula || 'Sin registrar'}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Nombre</span>
                    <strong>{ficha.nombre}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Apellidos</span>
                    <strong>{ficha.apellidos || 'Sin registrar'}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Fecha de nacimiento</span>
                    <strong>{ficha.fecha_nacimiento || 'Sin registrar'}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Correo</span>
                    <strong>{ficha.email}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Teléfono</span>
                    <strong>{ficha.telefono || 'Sin registrar'}</strong>
                  </div>
                </article>

                <article className="worker-info-block">
                  <h4>
                    <MapPin size={14} /> Dirección en Costa Rica
                  </h4>
                  <div className="worker-info-row">
                    <span>Provincia</span>
                    <strong>{ficha.provincia || 'Sin registrar'}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Cantón</span>
                    <strong>{ficha.canton || 'Sin registrar'}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Distrito</span>
                    <strong>{ficha.distrito || 'Sin registrar'}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Dirección exacta</span>
                    <strong>{ficha.direccion_exacta || 'Sin registrar'}</strong>
                  </div>
                </article>

                <article className="worker-info-block">
                  <h4>
                    <Briefcase size={14} /> Relación laboral
                  </h4>
                  <div className="worker-info-row">
                    <span>Código</span>
                    <strong>{ficha.codigo_empleado}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Departamento</span>
                    <strong>{ficha.departamento}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Puesto</span>
                    <strong>{ficha.puesto}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Fecha de ingreso</span>
                    <strong>{ficha.fecha_ingreso}</strong>
                  </div>
                  <div className="worker-info-row">
                    <span>Estado</span>
                    <strong>{ficha.estado}</strong>
                  </div>
                </article>
              </div>

              <div className="worker-metrics-strip">
                <div className="worker-metric-pill">
                  <span>Días libres disponibles</span>
                  <strong>{formatNumberSafe(resumen?.dias_libres_acumulados)}</strong>
                </div>
                <div className="worker-metric-pill">
                  <span>Días libres tomados</span>
                  <strong>{formatNumberSafe(resumen?.dias_libres_tomados)}</strong>
                </div>
                <div className="worker-metric-pill">
                  <span>Días incapacidad</span>
                  <strong>{formatNumberSafe(resumen?.dias_incapacidad)}</strong>
                </div>
                <div className="worker-metric-pill">
                  <span>Horas extra acumuladas</span>
                  <strong>{formatNumberSafe(resumen?.horas_extra_total, ' h')}</strong>
                </div>
                <div className="worker-metric-pill">
                  <span>Llegadas tarde</span>
                  <strong>{formatNumberSafe(resumen?.dias_llegada_tarde)}</strong>
                </div>
                <div className="worker-metric-pill">
                  <span>Salidas tempranas</span>
                  <strong>{formatNumberSafe(resumen?.dias_salida_temprana)}</strong>
                </div>
              </div>

              <div className="worker-history-box">
                <div className="worker-history-title">Historial diario de marcas recientes</div>
                <div className="table-scroll">
                  <table className="workers-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Entrada</th>
                        <th>Salida</th>
                        <th>Modalidad</th>
                        <th>Detalle jornada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asistencias.length ? (
                        asistencias.map((a) => (
                          <tr key={a.id}>
                            <td>{a.fecha}</td>
                            <td>{a.hora_entrada || 'Sin marca'}</td>
                            <td>{a.hora_salida || 'Sin marca'}</td>
                            <td>{a.modalidad}</td>
                            <td>
                              {a.estado !== 'presente' && (
                                <StatusBadge tone="neutral">{a.estado}</StatusBadge>
                              )}
                              {a.llego_tarde && (
                                <StatusBadge tone="warning">Llegada tarde</StatusBadge>
                              )}{' '}
                              {a.salio_temprano && (
                                <StatusBadge tone="critical">Salida temprana</StatusBadge>
                              )}{' '}
                              {a.horas_extra > 0 && (
                                <StatusBadge tone="success">{`+${a.horas_extra} h extra`}</StatusBadge>
                              )}
                              {a.estado === 'presente' &&
                                !a.llego_tarde &&
                                !a.salio_temprano &&
                                a.horas_extra === 0 && (
                                  <StatusBadge tone="success">Puntual</StatusBadge>
                                )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5}>Sin marcas recientes registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {(solicitudes.length > 0 || incapacidades.length > 0) && (
                <div className="worker-detail-grid">
                  <div className="worker-history-box">
                    <div className="worker-history-title">Solicitudes de días libres</div>
                    <div className="table-scroll">
                      <table className="workers-table">
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Fechas</th>
                            <th>Días</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {solicitudes.length ? (
                            solicitudes.map((s) => (
                              <tr key={s.id}>
                                <td>{s.tipo}</td>
                                <td>{`${s.fecha_inicio} a ${s.fecha_fin}`}</td>
                                <td>{formatNumberSafe(s.dias_solicitados)}</td>
                                <td>
                                  <StatusBadge
                                    tone={
                                      s.estado === 'aprobada'
                                        ? 'success'
                                        : s.estado === 'rechazada'
                                          ? 'critical'
                                          : 'warning'
                                    }
                                  >
                                    {s.estado}
                                  </StatusBadge>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4}>Sin solicitudes registradas.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="worker-history-box">
                    <div className="worker-history-title">Incapacidades registradas</div>
                    <div className="table-scroll">
                      <table className="workers-table">
                        <thead>
                          <tr>
                            <th>Entidad</th>
                            <th>Fechas</th>
                            <th>Días</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incapacidades.length ? (
                            incapacidades.map((inc) => (
                              <tr key={inc.id}>
                                <td>{inc.entidad}</td>
                                <td>{`${inc.fecha_inicio} a ${inc.fecha_fin}`}</td>
                                <td>{formatNumberSafe(inc.dias)}</td>
                                <td>
                                  <StatusBadge tone={inc.estado === 'activa' ? 'warning' : 'neutral'}>
                                    {inc.estado}
                                  </StatusBadge>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4}>Sin incapacidades registradas.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkersDirectory({ attendanceItems = null }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [departamento, setDepartamento] = useState('todos');
  const [estado, setEstado] = useState('todos');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [attendance, setAttendance] = useState(() => (Array.isArray(attendanceItems) ? attendanceItems : []));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);

  useEffect(() => {
    if (Array.isArray(attendanceItems)) {
      setAttendance(attendanceItems);
      return undefined;
    }
    let active = true;
    const today = new Date().toISOString().slice(0, 10);
    api
      .getDailyReport(today)
      .then((rep) => {
        if (active && Array.isArray(rep?.attendance)) {
          setAttendance(rep.attendance);
        }
      })
      .catch(() => {
        // Conserva la lista vacía si el reporte no responde
      });
    return () => {
      active = false;
    };
  }, [attendanceItems]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadWorkers = useCallback(() => {
    let active = true;
    setIsLoading(true);
    setError('');

    api
      .getHrWorkers({
        search: debouncedSearch,
        departamento,
        estado,
        page,
        limit: 20,
      })
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err?.message || 'No pudimos consultar el directorio de trabajadores.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, departamento, estado, page]);

  useEffect(() => {
    const cleanup = loadWorkers();
    return cleanup;
  }, [loadWorkers]);

  const resumen = data?.resumenGlobal;
  const trabajadores = Array.isArray(data?.trabajadores) ? data.trabajadores : [];
  const departamentos = Array.isArray(data?.departamentos) ? data.departamentos : [];
  const total = data?.total !== undefined && data?.total !== null ? Number(data.total) : 0;
  const totalPages = data?.totalPages !== undefined && data?.totalPages !== null ? Number(data.totalPages) : 1;

  return (
    <section className="workers-section" aria-label="Directorio de trabajadores">
      <div className="workers-summary-grid">
        <article className="worker-stat-card">
          <span>
            <Users size={14} /> Plantilla total
          </span>
          <strong>{formatNumberSafe(resumen?.totalTrabajadores)}</strong>
        </article>
        <article className="worker-stat-card">
          <span>
            <CalendarCheck size={14} /> Pasivo mayor a 20 días
          </span>
          <strong>{formatNumberSafe(resumen?.conRiesgoPasivo20)}</strong>
        </article>
        <article className="worker-stat-card">
          <span>
            <HeartPulse size={14} /> Días de incapacidad
          </span>
          <strong>{formatNumberSafe(resumen?.totalIncapacidades)}</strong>
        </article>
        <article className="worker-stat-card">
          <span>
            <AlertTriangle size={14} /> Llegadas tarde
          </span>
          <strong>{formatNumberSafe(resumen?.totalLlegadasTarde)}</strong>
        </article>
        <article className="worker-stat-card">
          <span>
            <Clock size={14} /> Salidas tempranas
          </span>
          <strong>{formatNumberSafe(resumen?.totalSalidasTempranas)}</strong>
        </article>
        <article className="worker-stat-card">
          <span>
            <Clock size={14} /> Horas extra globales
          </span>
          <strong>{formatNumberSafe(resumen?.totalHorasExtra, ' h')}</strong>
        </article>
      </div>

      <section className="panel workers-toolbar">
        <div className="workers-search-box">
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, apellidos, cédula, correo, provincia o código"
            aria-label="Buscar trabajador"
          />
        </div>

        <div className="workers-filters">
          <select
            value={departamento}
            onChange={(event) => {
              setDepartamento(event.target.value);
              setPage(1);
            }}
            aria-label="Filtrar por departamento"
          >
            <option value="todos">Todos los departamentos</option>
            {departamentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>

          <select
            value={estado}
            onChange={(event) => {
              setEstado(event.target.value);
              setPage(1);
            }}
            aria-label="Filtrar por estado"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activo</option>
            <option value="vacaciones">Vacaciones</option>
            <option value="incapacidad">Incapacidad</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </section>

      {error && (
        <div className="feedback-error" role="alert">
          <span>{error}</span>
          <button type="button" className="text-button" onClick={loadWorkers}>
            Reintentar
          </button>
        </div>
      )}

      <section className="panel workers-table-wrap">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Control de personal</p>
            <h2>Listado de trabajadores</h2>
          </div>
          <span className="report-status">
            <i /> {isLoading ? 'Actualizando lista…' : `${total} registros`}
          </span>
        </div>

        <div className="table-scroll">
          <table className="workers-table">
            <caption className="sr-only">Directorio de trabajadores</caption>
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Departamento y puesto</th>
                <th>Entrada y salida</th>
                <th>Incapacidades</th>
                <th>Días libres</th>
                <th>Días libres acumulados</th>
                <th>Horas extra</th>
                <th>Llegadas tarde</th>
                <th>Salidas tempranas</th>
              </tr>
            </thead>
            <tbody>
              {trabajadores.length ? (
                trabajadores.map((w) => (
                  <tr
                    key={w.id}
                    onClick={() => setSelectedWorkerId(w.id)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedWorkerId(w.id);
                      }
                    }}
                  >
                    <td>
                      <div className="worker-cell-primary">
                        <strong>{w.nombre}</strong>
                        <small>{`${w.cedula || w.codigo_empleado} · ${w.provincia || 'Costa Rica'}`}</small>
                      </div>
                    </td>
                    <td>
                      <div className="worker-cell-primary">
                        <strong>{w.departamento}</strong>
                        <small>{w.puesto}</small>
                      </div>
                    </td>
                    <td>
                      <div className="worker-marks-cell">
                        <span>{`Entrada: ${w.ultima_hora_entrada || 'Pendiente'}`}</span>
                        <small>{`Salida: ${w.ultima_hora_salida || 'Pendiente'}`}</small>
                      </div>
                    </td>
                    <td>{formatNumberSafe(w.dias_incapacidad, ' días')}</td>
                    <td>{formatNumberSafe(w.dias_libres_tomados, ' tomados')}</td>
                    <td>
                      <StatusBadge tone={w.dias_libres_acumulados > 20 ? 'critical' : 'success'}>
                        {formatNumberSafe(w.dias_libres_acumulados, ' días')}
                      </StatusBadge>
                    </td>
                    <td>{formatNumberSafe(w.horas_extra_total, ' h')}</td>
                    <td>
                      <StatusBadge tone={w.dias_llegada_tarde > 0 ? 'warning' : 'neutral'}>
                        {formatNumberSafe(w.dias_llegada_tarde)}
                      </StatusBadge>
                    </td>
                    <td>
                      <StatusBadge tone={w.dias_salida_temprana > 0 ? 'warning' : 'neutral'}>
                        {formatNumberSafe(w.dias_salida_temprana)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>
                    <p className="empty-state">
                      {isLoading ? 'Cargando trabajadores…' : 'No hay trabajadores con esos filtros.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="workers-pagination">
          <span>{`Página ${page} de ${totalPages} · ${total} trabajadores encontrados`}</span>
          <div className="workers-pagination-controls">
            <button
              type="button"
              className="button secondary"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={15} /> Anterior
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <AttendanceMonitor items={attendance} />

      {selectedWorkerId !== null && (
        <WorkerProfileModal workerId={selectedWorkerId} onClose={() => setSelectedWorkerId(null)} />
      )}
    </section>
  );
}
