import { useState } from 'react';
import { Check, ExternalLink, FileText, X } from 'lucide-react';
import { api } from '../../services/api';
import StatusBadge from '../StatusBadge/StatusBadge';

export default function DocumentsInbox({ documents = [], onReviewed }) {
  const [busyId, setBusyId] = useState(null);

  const reviewDocument = async (docId, status) => {
    setBusyId(docId);
    try {
      await api.updateDocumentStatus(docId, status);
      onReviewed?.(docId, status);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel documents-inbox">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            <FileText size={13} /> Archivo de RRHH
          </p>
          <h2>Comprobantes recibidos</h2>
        </div>
      </div>
      {documents.length ? (
        <div className="documents-list">
          {documents.map((document) => {
            const tone =
              document.status === 'Aprobado'
                ? 'success'
                : document.status === 'Rechazado'
                  ? 'critical'
                  : 'warning';
            const esPendiente = document.status === 'Pendiente';

            return (
              <article className="document-row" key={document.id}>
                <span className="document-icon">
                  <FileText size={17} />
                </span>
                <div>
                  <strong>{document.name}</strong>
                  <p>
                    {document.person} · {new Date(document.uploadedAt).toLocaleString('es-CR')}
                  </p>
                  <div className="document-detail-tags">
                    {document.tipo_justificacion_etiqueta && (
                      <span className="document-detail-tag">
                        {document.tipo_justificacion_etiqueta}
                      </span>
                    )}
                    {document.fecha_inicio_ausencia && (
                      <span className="document-detail-tag">
                        {document.fecha_fin_ausencia &&
                        document.fecha_fin_ausencia !== document.fecha_inicio_ausencia
                          ? `Del ${document.fecha_inicio_ausencia} al ${document.fecha_fin_ausencia}`
                          : `Fecha ${document.fecha_inicio_ausencia}`}
                      </span>
                    )}
                  </div>
                  {document.observacion && <p>{document.observacion}</p>}
                </div>
                <div className="review-actions">
                  <StatusBadge tone={tone}>{document.status}</StatusBadge>
                  {esPendiente && onReviewed && (
                    <>
                      <button
                        type="button"
                        className="review-approve"
                        disabled={busyId === document.id}
                        onClick={() => reviewDocument(document.id, 'aprobado')}
                        aria-label={`Aprobar comprobante ${document.id}`}
                      >
                        <Check size={15} />
                      </button>
                      <button
                        type="button"
                        className="review-reject"
                        disabled={busyId === document.id}
                        onClick={() => reviewDocument(document.id, 'rechazado')}
                        aria-label={`Rechazar comprobante ${document.id}`}
                      >
                        <X size={15} />
                      </button>
                    </>
                  )}
                  {document.url && (
                    <a href={document.url} target="_blank" rel="noreferrer" aria-label="Abrir documento">
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">Todavía no hay comprobantes enviados.</p>
      )}
    </section>
  );
}
