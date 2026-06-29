import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Shield, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { SiteLayout } from '../components/SiteLayout';
import { SEO } from '../components/SEO';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Usuarios' },
  { id: 'novels', label: 'Novelas' },
  { id: 'chapters', label: 'Capítulos' },
  { id: 'comments', label: 'Comentarios' },
  { id: 'reports', label: 'Reportes' },
  { id: 'requests', label: 'Solicitudes' },
];

function SiteStats() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    async function load() {
      const tables = ['profiles', 'novels', 'chapters', 'comments', 'favorites'];
      const results = {};

      await Promise.all(
        tables.map(async (table) => {
          const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
          results[table] = count || 0;
        })
      );

      setStats(results);
    }

    load();
  }, []);

  return (
    <div className="stats-grid">
      <div className="stat-card"><strong>{stats.profiles || 0}</strong><span>Usuarios</span></div>
      <div className="stat-card"><strong>{stats.novels || 0}</strong><span>Novelas</span></div>
      <div className="stat-card"><strong>{stats.chapters || 0}</strong><span>Capítulos</span></div>
      <div className="stat-card"><strong>{stats.comments || 0}</strong><span>Comentarios</span></div>
      <div className="stat-card"><strong>{stats.favorites || 0}</strong><span>Favoritos</span></div>
    </div>
  );
}

export function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [novels, setNovels] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [comments, setComments] = useState([]);
  const [reports, setReports] = useState([]);
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState('');

  async function loadTabData() {
    if (tab === 'users') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
      setUsers(data || []);
    }

    if (tab === 'novels') {
      const { data } = await supabase.from('novels').select('*').order('created_at', { ascending: false }).limit(50);
      setNovels(data || []);
    }

    if (tab === 'chapters') {
      const { data } = await supabase.from('chapters').select('*, novels(title)').order('created_at', { ascending: false }).limit(50);
      setChapters(data || []);
    }

    if (tab === 'comments') {
      const { data } = await supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(50);
      setComments(data || []);
    }

    if (tab === 'reports') {
      const { data } = await supabase.from('reports').select('*').eq('status', 'pending').order('created_at', { ascending: false });
      setReports(data || []);
    }

    if (tab === 'requests') {
      const { data } = await supabase.from('novels').select('*, chapters(*)').eq('status', 'pending').order('created_at', { ascending: false });
      setPending(data || []);
    }
  }

  useEffect(() => {
    if (isAdmin) loadTabData();
  }, [tab, isAdmin]);

  async function updateNovelStatus(id, status) {
    const updates = { status };
    if (status === 'approved') {
      updates.approved_at = new Date().toISOString();
    }

    await supabase.from('novels').update(updates).eq('id', id);

    const novel = pending.find((n) => n.id === id);
    if (novel?.created_by && status === 'approved') {
      await supabase.from('notifications').insert({
        user_id: novel.created_by,
        type: 'novel_approved',
        title: 'Tu novela fue aprobada',
        body: `"${novel.title}" ya está publicada.`,
        reference_id: id,
      });
    }

    setMessage(status === 'approved' ? 'Novela aprobada.' : 'Novela rechazada.');
    loadTabData();
  }

  async function updateUserRole(id, role) {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setMessage(`Rol actualizado a ${role}.`);
    loadTabData();
  }

  async function banUser(id, banned) {
    await supabase.from('profiles').update({ is_banned: banned }).eq('id', id);
    setMessage(banned ? 'Usuario baneado.' : 'Ban levantado.');
    loadTabData();
  }

  async function hideComment(id) {
    await supabase.from('comments').update({ is_hidden: true }).eq('id', id);
    loadTabData();
  }

  async function deleteComment(id) {
    await supabase.from('comments').delete().eq('id', id);
    loadTabData();
  }

  async function resolveReport(id, status) {
    await supabase.from('reports').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
    loadTabData();
  }

  if (loading) {
    return <SiteLayout><main className="detail-page"><section className="reader-card">Cargando...</section></main></SiteLayout>;
  }

  if (!isAdmin) {
    return (
      <SiteLayout>
        <main className="detail-page">
          <section className="reader-card">
            <h1>Acceso denegado</h1>
            <Link to="/" className="reader-button">Volver</Link>
          </section>
        </main>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <SEO title="Admin" />

      <main className="admin-page">
        <section className="reader-card">
          <p className="reader-novel"><Shield size={16} /> Administración</p>
          <h1>Panel Admin</h1>

          <div className="library-tabs admin-tabs">
            {TABS.map((t) => (
              <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'dashboard' && <SiteStats />}

          {tab === 'users' && (
            <div className="admin-list">
              {users.map((user) => (
                <article key={user.id} className="admin-item">
                  <div>
                    <h3>{user.display_name || user.email}</h3>
                    <p>@{user.username} · {user.role}</p>
                    {user.is_banned && <span className="detail-pill">Baneado</span>}
                    <div className="admin-actions">
                      <button type="button" onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}>
                        {user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                      </button>
                      <button type="button" onClick={() => banUser(user.id, !user.is_banned)}>
                        {user.is_banned ? 'Desbanear' : 'Banear'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === 'novels' && (
            <div className="admin-list">
              {novels.map((novel) => (
                <article key={novel.id} className="admin-item">
                  {novel.cover_url && <img src={novel.cover_url} alt={novel.title} />}
                  <div>
                    <h3>{novel.title}</h3>
                    <p>{novel.status}</p>
                    <div className="admin-actions">
                      <button type="button" onClick={() => updateNovelStatus(novel.id, 'approved')}><Check size={16} /> Aprobar</button>
                      <button type="button" onClick={() => updateNovelStatus(novel.id, 'hidden')}><X size={16} /> Ocultar</button>
                      <button type="button" onClick={() => supabase.from('novels').delete().eq('id', novel.id).then(loadTabData)}>
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === 'chapters' && (
            <div className="admin-list">
              {chapters.map((ch) => (
                <article key={ch.id} className="admin-item">
                  <div>
                    <h3>{ch.title}</h3>
                    <p>{ch.novels?.title}</p>
                    <button type="button" onClick={() => supabase.from('chapters').delete().eq('id', ch.id).then(loadTabData)}>
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === 'comments' && (
            <div className="admin-list">
              {comments.map((c) => (
                <article key={c.id} className="admin-item">
                  <div>
                    <p>{c.content}</p>
                    {c.is_hidden && <span className="detail-pill">Oculto</span>}
                    <div className="admin-actions">
                      <button type="button" onClick={() => hideComment(c.id)}>Ocultar</button>
                      <button type="button" onClick={() => deleteComment(c.id)}><Trash2 size={16} /> Borrar</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === 'reports' && (
            <div className="admin-list">
              {reports.map((r) => (
                <article key={r.id} className="admin-item">
                  <div>
                    <h3>{r.target_type}: {r.reason}</h3>
                    <p>{r.details}</p>
                    <div className="admin-actions">
                      <button type="button" onClick={() => resolveReport(r.id, 'resolved')}>Resolver</button>
                      <button type="button" onClick={() => resolveReport(r.id, 'dismissed')}>Descartar</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === 'requests' && (
            <div className="admin-list">
              {pending.map((novel) => (
                <article key={novel.id} className="admin-item">
                  {novel.cover_url && <img src={novel.cover_url} alt={novel.title} />}
                  <div>
                    <h3>{novel.title}</h3>
                    <p>{novel.author}</p>
                    <div className="admin-actions">
                      <button type="button" onClick={() => updateNovelStatus(novel.id, 'approved')}><Check size={17} /> Aprobar</button>
                      <button type="button" onClick={() => updateNovelStatus(novel.id, 'rejected')}><X size={17} /> Rechazar</button>
                    </div>
                  </div>
                </article>
              ))}
              {pending.length === 0 && <div className="empty-state">No hay solicitudes pendientes.</div>}
            </div>
          )}

          {message && <p className="form-message">{message}</p>}
        </section>
      </main>
    </SiteLayout>
  );
}
