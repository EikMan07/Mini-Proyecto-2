import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Moon, Sun, Sparkles, LogOut, MessageCircle, LayoutDashboard, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dashboardItemVariants, dashboardVariants, spring } from '../../lib/motion';

export default function AppShell({ children, eyebrow, title, subtitle, actions }) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('kendall-sidebar') === 'collapsed');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();
  const isHr = user?.role === 'rrhh';
  const handleSignOut = () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    window.setTimeout(() => { signOut(); navigate('/login', { replace: true }); }, 180);
  };
  const toggleSidebar = () => setIsCollapsed((current) => { const next = !current; localStorage.setItem('kendall-sidebar', next ? 'collapsed' : 'open'); return next; });

  return <div className={`app-shell ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
    <AnimatePresence>{isSigningOut && <motion.div className="logout-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status" aria-live="polite"><span className="brand-mark"><Sparkles size={16} /></span><strong>Cerrando sesión…</strong></motion.div>}</AnimatePresence>
    <motion.aside layout className="side-rail" initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1, width: isCollapsed ? 84 : 232 }} transition={spring}>
      <motion.div layout className="brand-lockup"><span className="brand-mark"><Sparkles size={16} /></span><AnimatePresence mode="wait">{!isCollapsed && <motion.span layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: .18 }}><strong>Kendall</strong><small>People operations</small></motion.span>}</AnimatePresence><motion.button className="rail-toggle" onClick={toggleSidebar} aria-label={isCollapsed ? 'Expandir navegación' : 'Colapsar navegación'} whileTap={{ scale: .88 }} whileHover={{ rotate: isCollapsed ? 0 : -8 }}>{isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}</motion.button></motion.div>
      <motion.nav className="main-nav" aria-label="Navegación principal" variants={dashboardVariants} initial="initial" animate="animate">
        <motion.div variants={dashboardItemVariants}><NavLink title={isCollapsed ? (isHr ? 'Resumen diario' : 'Mi espacio') : undefined} to={isHr ? '/rrhh/dashboard' : '/portal'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><LayoutDashboard size={17} />{!isCollapsed && (isHr ? 'Resumen diario' : 'Mi espacio')}</NavLink></motion.div>
        {!isCollapsed && <motion.span className="nav-label" variants={dashboardItemVariants}>Atajos</motion.span>}
        {!isHr && <motion.div variants={dashboardItemVariants}><a title={isCollapsed ? 'Asistente de políticas' : undefined} className="nav-link muted" href="#chat"><MessageCircle size={17} />{!isCollapsed && 'Asistente de políticas'}</a></motion.div>}
        <motion.div variants={dashboardItemVariants}><a title={isCollapsed ? 'Solicitudes' : undefined} className="nav-link muted" href="#requests"><ClipboardList size={17} />{!isCollapsed && (isHr ? 'Solicitudes pendientes' : 'Solicitudes')}</a></motion.div>
      </motion.nav>
      <div className="rail-footer"><div className="status-line"><span className="status-dot" />{!isCollapsed && 'Sistemas operativos'}</div><motion.button className="theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema" whileTap={{ scale: .9 }}>{isDark ? <Sun size={16} /> : <Moon size={16} />}{!isCollapsed && (isDark ? 'Modo claro' : 'Modo oscuro')}</motion.button><motion.button className="text-button" onClick={handleSignOut} whileTap={{ x: 2 }}><LogOut size={15} />{!isCollapsed && 'Cerrar sesión'}</motion.button></div>
    </motion.aside>
    <motion.main className="main-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .3, delay: .08 }}>
      <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div><div className="header-actions">{actions}<div className="user-chip"><span className="avatar">{user?.name?.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span><span><strong>{user?.name}</strong><small>{isHr ? 'RRHH · Administradora' : user?.department}</small></span></div></div></header>
      {children}
    </motion.main>
  </div>;
}
