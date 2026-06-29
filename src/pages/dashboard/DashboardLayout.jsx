import React, { useState } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  BookOpen, 
  Layers, 
  FileText, 
  Bell, 
  Settings, 
  MessageSquare, 
  Menu, 
  X, 
  LayoutDashboard,
  LogOut 
} from 'lucide-react';

const SIDEBAR_LINKS = [
  { path: 'novels', label: 'Mis Novelas', icon: BookOpen },
  { path: 'collections', label: 'Colecciones', icon: Layers },
  { path: 'drafts', label: 'Borradores', icon: FileText },
  { path: 'messages', label: 'Mensajes', icon: MessageSquare },
  { path: 'notifications', label: 'Notificaciones', icon: Bell },
  { path: 'settings', label: 'Ajustes', icon: Settings },
];

export function DashboardLayout() {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Mientras se verifica el estado de la sesión, mostramos pantalla de carga
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="animate-pulse text-pink-500 font-medium">Accediendo al panel de control...</div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigimos de forma segura a la página de inicio
  if (!user) {
    return <Navigate to="/" replace />;
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans flex text-neutral-800 dark:text-neutral-200">
      
      {/* Botón de menú flotante para pantallas móviles */}
      <button 
        type="button"
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-6 right-6 z-50 p-3.5 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 transition active:scale-95"
      >
        {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar / Barra lateral de Navegación */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-neutral-900 border-r border-neutral-200/60 dark:border-neutral-800/60 p-5 flex flex-col justify-between transition-transform duration-300 transform
        md:translate-x-0 md:static md:h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col gap-6">
          {/* Logo del Panel */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="p-2 bg-pink-500 text-white rounded-xl shadow-sm">
              <LayoutDashboard size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-neutral-900 dark:text-white tracking-tight">Studio Panel</h2>
              <p className="text-[10px] text-neutral-400 font-medium">Creadores y Editores</p>
            </div>
          </div>

          {/* Listado de Enlaces */}
          <nav className="flex flex-col gap-1">
            {SIDEBAR_LINKS.map((link) => {
              const Icon = link.icon;
              // Evaluamos si la subruta actual coincide con el enlace para el estado activo
              const isActive = location.pathname.includes(`/dashboard/${link.path}`);
              
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-neutral-400'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sección inferior: Retorno / Desconexión */}
        <div className="flex flex-col gap-2 border-t border-neutral-100 dark:border-neutral-800/80 pt-4">
          <Link 
            to="/" 
            className="flex items-center justify-center text-center px-4 py-2 border border-neutral-200 dark:border-neutral-800 text-xs font-bold rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition"
          >
            Volver al Catálogo
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all text-left w-full"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Fondo oscuro traslúcido para móviles cuando el menú está desplegado */}
      {isSidebarOpen && (
        <div 
          onClick={toggleSidebar} 
          className="md:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-xs"
        />
      )}

      {/* Contenedor Principal del Contenido Dinámico */}
      <section className="flex-1 min-w-0 h-screen overflow-y-auto px-4 py-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Aquí se renderizarán los componentes hijos según la ruta activa */}
          <Outlet />
        </div>
      </section>

    </div>
  );
}