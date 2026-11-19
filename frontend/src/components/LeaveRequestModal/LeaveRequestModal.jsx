import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { api } from '../../services/api';
import './LeaveRequestModal.css';

function getLocalTodayISO() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function addDaysISO(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function countDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  return end >= start ? Math.floor((end - start) / 86400000) + 1 : 0;
}

function extractOccupiedDates(existingRequests = []) {
  const occupied = new Set();
  for (const req of existingRequests) {
    const status = String(req?.status || req?.estado || '').toLowerCase();
    if (status === 'rechazada' || status === 'rechazado') continue;

    const start = String(req?.startDate || req?.fecha_inicio || '').slice(0, 10);
    const end = String(req?.endDate || req?.fecha_fin || start).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) continue;

    let cursor = start;
    let guard = 0;
    while (cursor <= end && guard < 180) {
      occupied.add(cursor);
      cursor = addDaysISO(cursor, 1);
      guard += 1;
    }
  }
  return occupied;
}

function findOccupiedInRange(startDate, endDate, occupiedSet) {
  if (!startDate || !endDate || endDate < startDate) return null;
  let cursor = startDate;
  let guard = 0;
  while (cursor <= endDate && guard < 180) {
    if (occupiedSet.has(cursor)) return cursor;
    cursor = addDaysISO(cursor, 1);
    guard += 1;
  }
  return null;
}

function buildMonthGrid(year, monthIndex) {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const leadingEmpty = (firstDay.getUTCDay() + 6) % 7; // Lunes=0..Domingo=6
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells = [];

  for (let i = 0; i < leadingEmpty; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const mm = String(monthIndex + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    cells.push({ day, iso: `${year}-${mm}-${dd}` });
  }
  return cells;
}

export default function LeaveRequestModal({ onClose, onCreated, existingRequests = [] }) {
  const todayStr = getLocalTodayISO();
  const [todayYear, todayMonth] = todayStr.split('-').map(Number);

  const [type, setType] = useState('Vacaciones');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth - 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const firstControlRef = useRef(null);
  const closeTriggerRef = useRef(document.activeElement);

  const occupiedSet = useMemo(() => extractOccupiedDates(existingRequests), [existingRequests]);
  const monthCells = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const days = countDays(startDate, endDate);

  const monthLabel = useMemo(() => {
    const d = new Date(Date.UTC(viewYear, viewMonth, 15));
    return d.toLocaleDateString('es-CR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }, [viewYear, viewMonth]);

  const canGoPrevMonth =
    viewYear > todayYear || (viewYear === todayYear && viewMonth > todayMonth - 1);

  useEffect(() => {
    firstControlRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      closeTriggerRef.current?.focus?.();
    };
  }, [isSubmitting, onClose]);

  const validateDates = (nextStart, nextEnd) => {
    if (nextStart && nextStart < todayStr) {
      return 'No puedes escoger fechas que ya hayan pasado.';
    }
    if (nextEnd && nextEnd < todayStr) {
      return 'No puedes escoger fechas que ya hayan pasado.';
    }
    if (nextStart && occupiedSet.has(nextStart)) {
      return `El día ${nextStart} ya fue escogido en otra solicitud.`;
    }
    if (nextEnd && occupiedSet.has(nextEnd)) {
      return `El día ${nextEnd} ya fue escogido en otra solicitud.`;
    }
    if (nextStart && nextEnd) {
      const conflictDay = findOccupiedInRange(nextStart, nextEnd, occupiedSet);
      if (conflictDay) {
        return `El rango incluye el día ${conflictDay}, que ya fue escogido en otra solicitud.`;
      }
    }
    return '';
  };

  const handleStartChange = (value) => {
    const nextEnd = endDate && endDate < value ? value : endDate;
    const msg = validateDates(value, nextEnd || value);
    setError(msg);
    if (msg && occupiedSet.has(value)) return;
    setStartDate(value);
    if (endDate && endDate < value) {
      setEndDate(value);
    }
  };

  const handleEndChange = (value) => {
    const baseStart = startDate || value;
    const msg = validateDates(baseStart, value);
    setError(msg);
    if (msg && occupiedSet.has(value)) return;
    if (!startDate) setStartDate(value);
    setEndDate(value);
  };

  const handleDayClick = (iso) => {
    if (iso < todayStr || occupiedSet.has(iso)) return;

    if (!startDate || (startDate && endDate && startDate !== endDate) || iso < startDate) {
      setStartDate(iso);
      setEndDate(iso);
      setError('');
      return;
    }

    const conflictDay = findOccupiedInRange(startDate, iso, occupiedSet);
    if (conflictDay) {
      setError(`No puedes abarcar el día ${conflictDay} porque ya fue escogido.`);
      return;
    }
    setEndDate(iso);
    setError('');
  };

  const prevMonth = () => {
    if (!canGoPrevMonth) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!days) {
      setError('Selecciona un rango de fechas válido.');
      return;
    }
    const validationError = validateDates(startDate, endDate);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await api.submitRequest({
        type,
        startDate,
        endDate,
        dates: `${startDate} → ${endDate}`,
        days,
        reason,
      });
      onCreated(created);
    } catch (submitError) {
      setError(submitError?.message || 'No se pudo enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minEndDate = startDate && startDate >= todayStr ? startDate : todayStr;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        role="presentation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(event) => event.target === event.currentTarget && !isSubmitting && onClose()}
      >
        <motion.div
          className="modal leave-modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-title"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
        >
          <div className="leave-modal-header">
            <button
              type="button"
              className="close-button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
            <p className="eyebrow">Nueva solicitud</p>
            <h2 id="request-title">Pide tiempo para ti</h2>
            <p className="modal-intro">
              Elige únicamente fechas vigentes desde hoy y que no hayan sido solicitadas antes.
            </p>
          </div>

          <div className="leave-modal-body">
            <form onSubmit={submit}>
              <label>
                Tipo
                <select
                  ref={firstControlRef}
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <option>Vacaciones</option>
                  <option>Permiso personal</option>
                  <option>Permiso de estudio</option>
                </select>
              </label>

              <div className="date-range">
                <label>
                  Desde
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={startDate}
                    onChange={(event) => handleStartChange(event.target.value)}
                  />
                </label>
                <label>
                  Hasta
                  <input
                    type="date"
                    required
                    min={minEndDate}
                    value={endDate}
                    onChange={(event) => handleEndChange(event.target.value)}
                  />
                </label>
              </div>

              <div className="availability-box">
                <div className="availability-head">
                  <strong>{monthLabel}</strong>
                  <div className="availability-nav">
                    <button
                      type="button"
                      onClick={prevMonth}
                      disabled={!canGoPrevMonth}
                      aria-label="Mes anterior"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button type="button" onClick={nextMonth} aria-label="Mes siguiente">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="availability-weekdays">
                  <span>LU</span>
                  <span>MA</span>
                  <span>MI</span>
                  <span>JU</span>
                  <span>VI</span>
                  <span>SA</span>
                  <span>DO</span>
                </div>

                <div className="availability-grid">
                  {monthCells.map((cell, idx) => {
                    if (!cell) return <span key={`empty-${idx}`} />;
                    const isPast = cell.iso < todayStr;
                    const isOccupied = occupiedSet.has(cell.iso);
                    const isSelected = cell.iso === startDate || cell.iso === endDate;
                    const isInRange =
                      startDate && endDate && cell.iso > startDate && cell.iso < endDate;

                    const classes = ['day-cell'];
                    if (isPast) classes.push('past');
                    if (isOccupied) classes.push('occupied');
                    if (isSelected) classes.push('selected');
                    else if (isInRange) classes.push('in-range');

                    return (
                      <button
                        type="button"
                        key={cell.iso}
                        className={classes.join(' ')}
                        disabled={isPast || isOccupied}
                        onClick={() => handleDayClick(cell.iso)}
                        title={
                          isPast
                            ? 'Fecha pasada'
                            : isOccupied
                              ? 'Día ya escogido en otra solicitud'
                              : cell.iso
                        }
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>

                <div className="availability-legend">
                  <span>
                    <i className="legend-dot avail" /> Disponible
                  </span>
                  <span>
                    <i className="legend-dot busy" /> Ya escogido
                  </span>
                  <span>
                    <i className="legend-dot sel" /> Tu selección
                  </span>
                </div>
              </div>

              {days > 0 && (
                <p className="days-preview">
                  {days} {days === 1 ? 'día solicitado' : 'días solicitados'}
                </p>
              )}

              <label>
                Nota para RRHH
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Agrega contexto breve si lo necesitas"
                  rows="3"
                />
              </label>

              {error && (
                <p className="feedback-error" role="alert">
                  {error}
                </p>
              )}

              <button className="button primary full-width" disabled={isSubmitting || Boolean(error)}>
                {isSubmitting ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
