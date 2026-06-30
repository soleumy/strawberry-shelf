import React, { useState } from 'react';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Bell,
  BookOpen,
  FileText,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  UserRound,
  X,
} from 'lucide-react';

const SIDEBAR_LINKS = [
  { to: '/dashboard/novels', label: 'Mis novelas', icon: BookOpen },
  { to: '/dashboard/collections', label: 'Colecciones', icon: Layers },
  { to: '/dashboard/drafts', label: 'Borradores', icon: FileText },
  { to: '/dashboard/messages', label: 'Mensajes', icon: MessageSquare },
  { to: '/dashboard/notifications', label: 'Notificaciones', icon: Bell },
  { to: '/profile/edit', label: 'Editar perfil', icon: UserRound },
  { to: '/dashboard/settings', label: 'Ajustes', icon: Settings },
];

export function DashboardLayout() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) return <div className="loading-screen">Accediendo al panel...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (location.pathname === '/dashboard') return <Navigate to="/dashboard/novels" replace />;

  return (
    <div className="dashboard-shell kawaii-page">
      <button
        type="button"
        className="dashboard-menu-button"
        onClick={() => setIsSidebarOpen((open) => !open)}
      >
        {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <aside className={`dashboard-sidebar-kawaii ${isSidebarOpen ? 'open' : ''}`}>
        <Link to="/" className="kawaii-logo dashboard-logo" onClick={() => setIsSidebarOpen(false)}>
          <span>🍓</span>
          <strong>strawberry<br />studio</strong>
        </Link>

        <div className="dashboard-user-card">
          <LayoutDashboard size={20} />
          <div>
            <strong>Panel creativo</strong>
            <p>{user.email}</p>
          </div>
        </div>

        <nav className="dashboard-nav-kawaii">
          {SIDEBAR_LINKS.map((link) => {
            const Icon = link.icon;
            const active = location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);

            return (
              <Link
                key={link.to}
                to={link.to}
                className={active ? 'active' : ''}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={17} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="dashboard-sidebar-actions">
          <Link to={`/user/${user.id}`} className="secondary-action" onClick={() => setIsSidebarOpen(false)}>
            <UserRound size={16} /> Ver perfil público
          </Link>

          <Link to="/" className="secondary-action" onClick={() => setIsSidebarOpen(false)}>
            Volver al catálogo
          </Link>

          <button type="button" className="secondary-action" onClick={signOut}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          className="dashboard-overlay"
          aria-label="Cerrar menú"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="dashboard-main-kawaii">
        <Outlet />
      </main>
    </div>
  );
}