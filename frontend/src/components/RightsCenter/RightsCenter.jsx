import { ExternalLink, Scale } from 'lucide-react';
import { officialLaborDocuments } from '../../services/realDataService';

export default function RightsCenter() {
  return <section className="panel rights-center" id="rights"><div className="panel-heading"><div><p className="eyebrow"><Scale size={13} /> Centro laboral</p><h2>Tus derechos y deberes</h2></div><span className="source-label">Fuentes oficiales</span></div><p className="rights-intro">Consulta información oficial del Ministerio de Trabajo y Seguridad Social. Este espacio orienta, pero no sustituye asesoría legal.</p><div className="rights-documents">{officialLaborDocuments.map((document) => <a className="rights-document" href={document.url} target="_blank" rel="noreferrer" key={document.url}><div><strong>{document.title}</strong><p>{document.description}</p><small>{document.source}</small></div><ExternalLink size={16} /></a>)}</div></section>;
}
