import { FileText, ExternalLink } from 'lucide-react';
import StatusBadge from '../StatusBadge/StatusBadge';

export default function DocumentsInbox({ documents = [] }) {
  return <section className="panel documents-inbox"><div className="panel-heading"><div><p className="eyebrow"><FileText size={13} /> Archivo de RRHH</p><h2>Comprobantes recibidos</h2></div></div>{documents.length ? <div className="documents-list">{documents.map((document) => <article className="document-row" key={document.id}><span className="document-icon"><FileText size={17} /></span><div><strong>{document.name}</strong><p>{document.person} · {new Date(document.uploadedAt).toLocaleString('es-CR')}</p></div><StatusBadge tone={document.status === 'Aprobado' ? 'success' : 'warning'}>{document.status}</StatusBadge>{document.url && <a href={document.url} target="_blank" rel="noreferrer" aria-label="Abrir documento"><ExternalLink size={15} /></a>}</article>)}</div> : <p className="empty-state">Todavía no hay comprobantes enviados.</p>}</section>;
}
