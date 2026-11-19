import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '../../services/api';
import StatusBadge from '../StatusBadge/StatusBadge';
import './RequestReviewPanel.css';

export default function RequestReviewPanel({ items = [], onReviewed }) {
  const [busyId, setBusyId] = useState('');
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!rejectingItem) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && busyId !== rejectingItem.id) {
        setRejectingItem(null);
        setRejectionReason('');
        setRejectError('');
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [rejectingItem, busyId]);

  const approveRequest = async (item) => {
    setActionError('');
    setBusyId(item.id);
    try {
      await api.updateRequestStatus(item.id, 'Aprobada');
      onReviewed?.(item.id, 'Aprobada');
    } catch (err) {
      setActionError(err?.message || 'No pudimos aprobar la solicitud.');
    } finally {
      setBusyId('');
    }
  };

  const openRejectDialog = (item) => {
    setActionError('');
    setRejectError('');
    setRejectionReason('');
    setRejectingItem(item);
  };

  const closeRejectDialog = () => {
    if (rejectingItem && busyId === rejectingItem.id) return;
    setRejectingItem(null);
    setRejectionReason('');
    setRejectError('');
  };

  const confirmReject = async (event) => {
    event.preventDefault();
    if (!rejectingItem) return;

    const cleanReason = rejectionReason.trim();
    if (cleanReason.length < 5) {
      setRejectError('Debes indicar el motivo del rechazo de al menos 5 caracteres.');
      return;
    }

    setRejectError('');
    setBusyId(rejectingItem.id);
    try {
      await api.updateRequestStatus(rejectingItem.id, 'Rechazada', cleanReason);
      const reviewedId = rejectingItem.id;
      setRejectingItem(null);
      setRejectionReason('');
      onReviewed?.(reviewedId, 'Rechazada', cleanReason);
    } catch (err) {
      setRejectError(err?.message || 'No pudimos registrar el rechazo de la solicitud.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="panel review-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Decisiones de RRHH</p>
          <h2>Revisar solicitudes</h2>
        </div>
      </div>

      {actionError && (
        <p className="field-error review-action-error" role="alert">
          {actionError}
        </p>
      )}

      {items.length ? (
        <div className="review-list">
          {items.map((item) => {
            const dias = item.days ?? 1;
            return (
              <article className="review-item" key={item.id}>
                <div>
                  <strong>{item.person}</strong>
                  <p>
                    {item.type} · {item.dates || `${item.startDate} → ${item.endDate}`} · {dias}{' '}
                    {dias === 1 ? 'día' : 'días'}
                  </p>
                  {item.reason && <small>{item.reason}</small>}
                </div>
                <div className="review-actions">
                  <StatusBadge tone="warning">Pendiente</StatusBadge>
                  <button
                    type="button"
                    className="review-approve"
                    disabled={busyId === item.id}
                    onClick={() => approveRequest(item)}
                    aria-label={`Aprobar ${item.id}`}
                  >
                    <Check size={15} />
                  </button>
                  <button
                    type="button"
                    className="review-reject"
                    disabled={busyId === item.id}
                    onClick={() => openRejectDialog(item)}
                    aria-label={`Rechazar ${item.id}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">No hay solicitudes pendientes de revisión.</p>
      )}

      {rejectingItem && (
        <div
          className="reject-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRejectDialog();
          }}
        >
          <div
            className="reject-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
          >
            <header className="reject-modal-header">
              <div>
                <p className="eyebrow">Resolución de RRHH</p>
                <h3 id="reject-modal-title">Rechazar solicitud</h3>
              </div>
              <button
                type="button"
                className="reject-modal-close"
                onClick={closeRejectDialog}
                aria-label="Cerrar ventana de rechazo"
              >
                <X size={17} />
              </button>
            </header>

            <form className="reject-modal-body" onSubmit={confirmReject}>
              <div className="reject-summary-box">
                <strong>{rejectingItem.person}</strong>
                <span>
                  {rejectingItem.type} ·{' '}
                  {rejectingItem.dates || `${rejectingItem.startDate} → ${rejectingItem.endDate}`}
                </span>
              </div>

              <label className="reject-field">
                <span>Motivo del rechazo</span>
                <textarea
                  name="motivo_rechazo"
                  rows={3}
                  value={rejectionReason}
                  onChange={(event) => {
                    setRejectionReason(event.target.value);
                    if (rejectError) setRejectError('');
                  }}
                  placeholder="Explica con claridad al colaborador el motivo del rechazo"
                  autoFocus
                />
              </label>

              {rejectError && (
                <p className="field-error" role="alert">
                  {rejectError}
                </p>
              )}

              <div className="reject-modal-actions">
                <button
                  type="button"
                  className="button reject-cancel-btn"
                  onClick={closeRejectDialog}
                  disabled={busyId === rejectingItem.id}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={busyId === rejectingItem.id}
                >
                  {busyId === rejectingItem.id ? 'Guardando…' : 'Confirmar rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
