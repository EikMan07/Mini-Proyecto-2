import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Moon, Sun, Sparkles, LogOut, MessageCircle, LayoutDashboard, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spring } from '../../lib/motion';

export default function AppShell({ children, eyebrow, title, subtitle, actions }) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('kendall-sidebar') === 'collapsed');
  const navigate = useNavigate();
  const isHr = user?.role === 'rrhh';
  const handleSignOut = () => { signOut(); navigate('/login'); };
  const toggleSidebar = () => setIsCollapsed((current) => { const next = !current; localStorage.setItem('kendall-sidebar', next ? 'collapsed' : 'open'); return next; });
  return <div className={`app-shell ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
    <motion.aside layout className="side-rail" animate={{ width: isCollapsed ? 84 : 248 }} transition={spring}>
      <div className="brand-lockup"><span className="brand-mark"><Sparkles size={16} /></span><AnimatePresence mode="wait">{!isCollapsed && <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}><strong>Kendall</strong><small>People operations</small></motion.span>}</AnimatePresence><button className="rail-toggle" onClick={toggleSidebar} aria-label={isCollapsed ? 'Expandir navegación' : 'Colapsar navegación'}>{isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}</button></div>
      <nav className="main-nav" aria-label="Navegación principal">
        <NavLink title={isCollapsed ? (isHr ? 'Resumen diario' : 'Mi espacio') : undefined} to={isHr ? '/rrhh/dashboard' : '/portal'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><LayoutDashboard size={17} />{!isCollapsed && (isHr ? 'Resumen diario' : 'Mi espacio')}</NavLink>
        {!isCollapsed && <span className="nav-label">Atajos</span>}
        <a title={isCollapsed ? 'Asistente de políticas' : undefined} className="nav-link muted" href="#chat"><MessageCircle size={17} />{!isCollapsed && 'Asistente de políticas'}</a>
        <a title={isCollapsed ? 'Solicitudes' : undefined} className="nav-link muted" href="#requests"><ClipboardList size={17} />{!isCollapsed && 'Solicitudes'}</a>
      </nav>
      <div className="rail-footer"><div className="status-line"><span className="status-dot" />{!isCollapsed && 'Sistemas operativos'}</div><button className="theme-toggle" onClick={toggleTheme} aria-label="Cambiar tema">{isDark ? <Sun size={16} /> : <Moon size={16} />}{!isCollapsed && (isDark ? 'Modo claro' : 'Modo oscuro')}</button><button className="text-button" onClick={handleSignOut}><LogOut size={15} />{!isCollapsed && 'Cerrar sesión'}</button></div>
    </motion.aside>
    <main className="main-content">
      <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div><div className="header-actions">{actions}<div className="user-chip"><span className="avatar">{user?.name?.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span><span><strong>{user?.name}</strong><small>{isHr ? 'RRHH · Administradora' : user?.department}</small></span></div></div></header>
      {children}
    </main>
  </div>;
}
