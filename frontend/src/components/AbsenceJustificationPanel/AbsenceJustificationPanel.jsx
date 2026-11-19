import { useEffect, useState } from 'react';
import { CalendarRange, ExternalLink, FileCheck2, FileUp, Info, LoaderCircle, UploadCloud, X } from 'lucide-react';
import { api } from '../../services/api';
import StatusBadge from '../StatusBadge/StatusBadge';
import './AbsenceJustificationPanel.css';

export const TIPOS_JUSTIFICACION_CR = [
  {
    value: 'incapacidad_ccss',
    label: 'Incapacidad por enfermedad común CCSS',
    guide:
      'Adjunta la boleta Aviso al Patrono emitida por la CCSS. Los dictámenes de médico privado deben refrendarse en la CCSS para tener validez oficial.',
  },
  {
    value: 'incapacidad_ins',
    label: 'Incapacidad por riesgo laboral INS',
    guide:
      'Adjunta la boleta oficial de incapacidad emitida por el Instituto Nacional de Seguros dentro de las 48 horas siguientes al evento.',
  },
  {
    value: 'cita_medica',
    label: 'Cita médica o atención en emergencias',
    guide:
      'Adjunta la constancia de asistencia emitida por la CCSS, hospital o clínica autorizada con hora de entrada y hora de salida.',
  },
  {
    value: 'duelo_familiar',
    label: 'Duelo por fallecimiento de familiar',
    guide:
      'Adjunta el acta o constancia oficial de defunción. TicoSoft otorga 3 días hábiles para primer grado y 1 día hábil para segundo grado.',
  },
  {
    value: 'citacion_judicial',
    label: 'Citación judicial o deber cívico',
    guide:
      'Adjunta la cédula de citación formal emitida por el Poder Judicial, juzgado competente o Tribunal Supremo de Elecciones.',
  },
  {
    value: 'licencia_maternidad_paternidad',
    label: 'Licencia de maternidad o paternidad',
    guide:
      'Adjunta la certificación médica oficial, el certificado de nacimiento del Registro Civil o la resolución de adopción.',
  },
  {
    value: 'fuerza_mayor',
    label: 'Fuerza mayor o calamidad doméstica',
    guide:
      'Adjunta comprobante verificable emitido por Bomberos, Policía de Tránsito, Cruz Roja o autoridad pública competente.',
  },
];

function getLocalTodayISO() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function formatAbsenceDates(doc) {
  if (doc?.fecha_inicio_ausencia && doc?.fecha_fin_ausencia) {
    return doc.fecha_inicio_ausencia === doc.fecha_fin_ausencia
      ? `Ausencia del ${doc.fecha_inicio_ausencia}`
      : `Del ${doc.fecha_inicio_ausencia} al ${doc.fecha_fin_ausencia}`;
  }
  if (doc?.fecha_inicio_ausencia) {
    return `Ausencia del ${doc.fecha_inicio_ausencia}`;
  }
  return doc?.uploadedAt
    ? `Enviado el ${new Date(doc.uploadedAt).toLocaleDateString('es-CR')}`
    : 'Recibido recientemente';
}

export default function AbsenceJustificationPanel() {
  const todayISO = getLocalTodayISO();
  const [tipoJustificacion, setTipoJustificacion] = useState(TIPOS_JUSTIFICACION_CR[0].value);
  const [fechaInicio, setFechaInicio] = useState(todayISO);
  const [fechaFin, setFechaFin] = useState(todayISO);
  const [observacion, setObservacion] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [history, setHistory] = useState([]);

  const selectedOption =
    TIPOS_JUSTIFICACION_CR.find((item) => item.value === tipoJustificacion) ||
    TIPOS_JUSTIFICACION_CR[0];

  useEffect(() => {
    let active = true;
    api
      .getDocuments()
      .then((docs) => {
        if (active) setHistory(Array.isArray(docs) ? docs : []);
      })
      .catch(() => {
        if (active) setHistory([]);
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleFileSelect = (file) => {
    setError('');
    setSuccessMessage('');
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('El archivo supera el máximo permitido de 5 MB.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleStartDateChange = (nextStart) => {
    setFechaInicio(nextStart);
    if (fechaFin && nextStart && fechaFin < nextStart) {
      setFechaFin(nextStart);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!selectedFile) {
      setError('Adjunta el comprobante en PDF, JPG o PNG antes de enviar.');
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setError('Indica las fechas Desde y Hasta de la ausencia.');
      return;
    }
    if (fechaFin < fechaInicio) {
      setError('La fecha Hasta debe ser igual o posterior a la fecha Desde.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await api.uploadDocument({
        file: selectedFile,
        tipo_justificacion: tipoJustificacion,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        observacion: observacion.trim(),
      });
      setHistory((current) => [created, ...current]);
      setSelectedFile(null);
      setObservacion('');
      setSuccessMessage('Justificación enviada a revisión de RRHH.');
    } catch (uploadError) {
      setError(uploadError?.message || 'No fue posible enviar la justificación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel justification-panel" aria-labelledby="justification-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            <FileCheck2 size={13} /> Respaldo laboral en Costa Rica
          </p>
          <h2 id="justification-heading">Justificar ausencia</h2>
          <p className="justification-subtitle">
            Tienes hasta 48 horas según el artículo 81 inciso g del Código de Trabajo para adjuntar tu respaldo oficial.
          </p>
        </div>
      </div>

      <div className="justification-layout">
        <form className="justification-form" onSubmit={handleSubmit}>
          <label className="justification-field">
            <span>Tipo de justificación</span>
            <select
              name="tipo_justificacion"
              value={tipoJustificacion}
              onChange={(event) => setTipoJustificacion(event.target.value)}
            >
              {TIPOS_JUSTIFICACION_CR.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="justification-guide" role="note">
            <Info size={16} />
            <div>
              <strong>Documento requerido</strong>
              <p>{selectedOption.guide}</p>
            </div>
          </div>

          <div className="justification-dates">
            <label className="justification-field">
              <span>Desde</span>
              <input
                type="date"
                name="fecha_inicio"
                value={fechaInicio}
                onChange={(event) => handleStartDateChange(event.target.value)}
                required
              />
            </label>
            <label className="justification-field">
              <span>Hasta</span>
              <input
                type="date"
                name="fecha_fin"
                min={fechaInicio || undefined}
                value={fechaFin}
                onChange={(event) => setFechaFin(event.target.value)}
                required
              />
            </label>
          </div>

          <label className="justification-field">
            <span>Observación opcional</span>
            <textarea
              name="observacion"
              rows={2}
              maxLength={500}
              value={observacion}
              onChange={(event) => setObservacion(event.target.value)}
              placeholder="Agrega número de boleta, horario de cita o detalle breve"
            />
          </label>

          <div className="justification-field">
            <span>Comprobante en PDF, JPG o PNG</span>
            <label
              className={`justification-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleFileSelect(event.dataTransfer.files?.[0]);
              }}
            >
              <UploadCloud size={18} />
              <div>
                <strong>{selectedFile ? selectedFile.name : 'Selecciona o arrastra tu archivo'}</strong>
                <small>Formato PDF, JPG o PNG hasta 5 MB</small>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                onChange={(event) => handleFileSelect(event.target.files?.[0])}
              />
            </label>

            {selectedFile && (
              <div className="justification-file-chip">
                <FileUp size={14} />
                <span>{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  aria-label="Quitar archivo seleccionado"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="justification-success" role="status">
              {successMessage}
            </p>
          )}

          <button className="button primary full-width" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoaderCircle className="spin" size={16} /> Enviando justificación…
              </>
            ) : (
              'Enviar justificación a RRHH'
            )}
          </button>
        </form>

        <div className="justification-history">
          <div className="justification-history-head">
            <h3>Historial enviado</h3>
            <span>{history.length}</span>
          </div>

          {isLoadingHistory ? (
            <p className="empty-state">Cargando comprobantes enviados…</p>
          ) : history.length ? (
            <div className="justification-history-list">
              {history.map((item) => {
                const tone =
                  item.status === 'Aprobado'
                    ? 'success'
                    : item.status === 'Rechazado'
                      ? 'critical'
                      : 'warning';

                return (
                  <article className="justification-history-item" key={item.id}>
                    <div className="justification-history-top">
                      <strong>{item.tipo_justificacion_etiqueta || 'Comprobante laboral'}</strong>
                      <StatusBadge tone={tone}>{item.status || 'Pendiente'}</StatusBadge>
                    </div>
                    <p className="justification-history-meta">
                      <CalendarRange size={13} /> {formatAbsenceDates(item)}
                    </p>
                    <p className="justification-history-file">{item.name || item.nombre_archivo}</p>
                    {item.observacion && (
                      <p className="justification-history-note">{item.observacion}</p>
                    )}
                    {item.observacion_rrhh && (
                      <p className="justification-rrhh-note">RRHH: {item.observacion_rrhh}</p>
                    )}
                    {item.url && (
                      <a
                        className="justification-file-link"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver comprobante <ExternalLink size={13} />
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">Todavía no has enviado justificaciones de ausencia.</p>
          )}
        </div>
      </div>
    </section>
  );
}
