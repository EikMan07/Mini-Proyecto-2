import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const roleCopy = { colaborador: { initials: 'KV', title: 'Colaborador', description: 'Portal personal', email: 'kendall@kendall.cr' }, rrhh: { initials: 'MR', title: 'RRHH', description: 'Vista administrativa', email: 'maria@kendall.cr' } };

export default function LoginPage() {
  const { isAuthenticated, user, signIn } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('colaborador');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  if (isAuthenticated) return <Navigate to={user.role === 'rrhh' ? '/rrhh/dashboard' : '/portal'} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(''); setIsLoading(true);
    try { const session = await signIn(role); navigate(session.user.role === 'rrhh' ? '/rrhh/dashboard' : '/portal'); }
    catch { setError('No pudimos abrir la demo. Intenta nuevamente.'); }
    finally { setIsLoading(false); }
  };

  return <main className="login-page"><motion.section className="login-story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .2 }}><div className="brand-lockup light"><span className="brand-mark">K</span><span><strong>Kendall</strong><small>People operations</small></span></div><div className="story-copy"><p className="eyebrow">Un lugar para trabajar mejor</p><h1>Las respuestas correctas, más cerca.</h1><p>Un portal para entender tus políticas, cuidar tu tiempo y darle a RRHH una lectura clara de lo que está pasando.</p></div><div className="story-footer"><span>San José, Costa Rica</span><span>Mini Proyecto 02 · 2025</span></div></motion.section><section className="login-form-wrap"><motion.div className="login-form-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}><p className="eyebrow">Acceso al portal</p><h2>Bienvenido de vuelta</h2><p className="form-intro">Elige un perfil de demostración para explorar Kendall.</p><div className="role-switch" role="radiogroup" aria-label="Selecciona el rol de demostración">{Object.entries(roleCopy).map(([key, copy]) => <motion.button key={key} type="button" role="radio" aria-checked={role === key} className={role === key ? 'selected' : ''} onClick={() => { setRole(key); setError(''); }} whileTap={{ scale: .98 }}><span>{role === key ? <Check size={14} /> : copy.initials}</span><strong>{copy.title}</strong><small>{copy.description}</small></motion.button>)}</div><form onSubmit={handleSubmit}><label>Cuenta de demostración<input type="email" value={roleCopy[role].email} readOnly aria-label="Cuenta de demostración" /></label><AnimatePresence mode="wait"><motion.p key={role} className="selected-account" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}>Entrarás como <strong>{roleCopy[role].title}</strong></motion.p></AnimatePresence>{error && <p className="feedback-error" role="alert">{error}</p>}<motion.button className="button primary full-width" disabled={isLoading} whileTap={{ scale: .98 }}>{isLoading ? <><LoaderCircle size={16} className="spin" /> Ingresando…</> : <>Entrar como {roleCopy[role].title} <ArrowUpRight size={16} /></>}</motion.button></form><p className="demo-note">Demo local · La integración real usará <code>POST /api/auth/login</code></p></motion.div></section></main>;
}
