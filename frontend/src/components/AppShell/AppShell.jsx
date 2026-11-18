import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AppShell({ children, eyebrow, title, subtitle, actions }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isHr = user?.role === 'rrhh';
  const handleSignOut = () => { signOut(); navigate('/login'); };
  return <div className="app-shell">
    <aside className="side-rail">
      <div className="brand-lockup"><span className="brand-mark">K</span><span><strong>Kendall</strong><small>People operations</small></span></div>
      <nav className="main-nav" aria-label="Navegación principal">
        <NavLink to={isHr ? '/rrhh/dashboard' : '/portal'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><span>◒</span>{isHr ? 'Resumen diario' : 'Mi espacio'}</NavLink>
        <span className="nav-label">Atajos</span>
        <a className="nav-link muted" href="#chat"><span>↗</span>Asistente de políticas</a>
        <a className="nav-link muted" href="#requests"><span>◇</span>Solicitudes</a>
      </nav>
      <div className="rail-footer"><div className="status-dot" /> Sistemas operativos <button className="text-button" onClick={handleSignOut}>Cerrar sesión</button></div>
    </aside>
    <main className="main-content">
      <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-subtitle">{subtitle}</p></div><div className="header-actions">{actions}<div className="user-chip"><span className="avatar">{user?.name?.split(' ').map((word) => word[0]).join('').slice(0, 2)}</span><span><strong>{user?.name}</strong><small>{isHr ? 'RRHH · Administradora' : user?.department}</small></span></div></div></header>
      {children}
    </main>
  </div>;
}
