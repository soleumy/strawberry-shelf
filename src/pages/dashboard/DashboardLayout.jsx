import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BookOpen, ChevronRight, Heart, History, Layers, LibraryBig, PenLine, Settings, UserRound } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { SiteLayout } from '../../components/SiteLayout';
import { SEO } from '../../components/SEO';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const SIDEBAR_ITEMS = [
  { label: 'Inicio', icon: BookOpen, to: '/dashboard' },
  { label: 'Mis novelas', icon: PenLine, to: '/dashboard/novels' },
  { label: 'Mis capítulos', icon: Layers, to: '/dashboard/chapters' },
  { label: 'Favoritos', icon: Heart, to: '/library' },
  { label: 'Colecciones', icon: LibraryBig, to: '/dashboard/collections' },
  { label: 'Historial', icon: History, to: '/library' },
  { label: 'Borradores', icon: PenLine, to: '/dashboard/drafts' },
  { label: 'Notificaciones', icon: Bell, to: '/dashboard/notifications' },
  { label: 'Mensajes', icon: Bell, to: '/dashboard/messages' },
  { label: 'Perfil', icon: UserRound, to: '/profile/edit' },
  { label: 'Configuración', icon: Settings, to: '/dashboard/settings' },
];

function DashboardHome() {
  const { session, profile } = useAuth();
  const [stats, setStats] = useState({ novels: 0, chapters: 0, favorites: 0, followers: 0 });

  useEffect(() => {
    async function load() {
      if (!session?.user) return;

      const userId = session.user.id;

      const [
        { count: novels },
        { count: favorites },
        { count: followers },
      ] = await Promise.all([
        supabase.from('novels').select('*', { count: 'exact', head: true }).eq('created_by', userId),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      ]);

      const { data: userNovels } = await supabase.from('novels').select('id').eq('created_by', userId);
      const novelIds = (userNovels || []).map((n) => n.id);

      let chapterCount = 0;
      if (novelIds.length > 0) {
        const { count } = await supabase
          .from('chapters')
          .select('*', { count: 'exact', head: true })
          .in('novel_id', novelIds);
        chapterCount = count || 0;
      }

      setStats({
        novels: novels || 0,
        chapters: chapterCount,
        favorites: favorites || 0,
        followers: followers || 0,
      });
    }

    load();
  }, [session]);

  return (
    <section className="reader-card">
      <p className="reader-novel">Mi Panel</p>
      <h1>Hola, {profile?.display_name || 'Lector'} 🍓</h1>

      <div className="stats-grid">
        <div className="stat-card"><strong>{stats.novels}</strong><span>Novelas</span></div>
        <div className="stat-card"><strong>{stats.chapters}</strong><span>Capítulos</span></div>
        <div className="stat-card"><strong>{stats.favorites}</strong><span>Favoritos</span></div>
        <div className="stat-card"><strong>{stats.followers}</strong><span>Seguidores</span></div>
      </div>

      <div className="dashboard-quick-links">
        <Link to="/dashboard/novels" className="chapter-link">
          <PenLine size={17} /> Gestionar novelas <ChevronRight size={16} />
        </Link>
        <Link to="/library" className="chapter-link">
          <Heart size={17} /> Mi biblioteca <ChevronRight size={16} />
        </Link>
        <Link to="/dashboard/notifications" className="chapter-link">
          <Bell size={17} /> Notificaciones <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  );
}

export function DashboardLayout() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <SiteLayout>
        <main className="detail-page"><section className="reader-card">Cargando...</section></main>
      </SiteLayout>
    );
  }

  if (!session) {
    return (
      <SiteLayout>
        <main className="detail-page">
          <section className="reader-card">
            <h1>Inicia sesión</h1>
            <p className="form-message">Necesitas iniciar sesión para acceder al panel.</p>
            <Link to="/" className="reader-button">Volver al inicio</Link>
          </section>
        </main>
      </SiteLayout>
    );
  }

  const isHome = location.pathname === '/dashboard';

  return (
    <SiteLayout>
      <SEO title="Mi Panel" />

      <main className="dashboard-page">
        <aside className="dashboard-sidebar">
          <p className="reader-novel">Mi Panel</p>

          <nav className="dashboard-nav">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;

              return (
                <Link key={item.to + item.label} to={item.to} className={active ? 'active' : ''}>
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="dashboard-content">
          {isHome ? <DashboardHome /> : <Outlet />}
        </div>
      </main>
    </SiteLayout>
  );
}
