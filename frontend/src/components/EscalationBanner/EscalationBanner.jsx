import { useState } from 'react';

export default function EscalationBanner() {
  const [sent, setSent] = useState(false);
  return <div className="escalation-banner"><div><span className="banner-kicker">Sin evidencia suficiente</span><strong>Esta consulta necesita una mirada humana</strong><p>No encontré una política vigente en Drive que responda con seguridad.</p></div><button className="button secondary" onClick={() => setSent(true)}>{sent ? 'Solicitud enviada' : 'Escalar a RRHH'}</button></div>;
}
