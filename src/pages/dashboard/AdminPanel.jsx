import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

export function AdminPanel() {
  const { userId } = useAuth();
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('reports');

  useEffect(() => {
    async function load() {
      if (!userId) { setLoading(false); return; }

      // Check if user is admin
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle();
      if (!profile?.is_admin) { setLoading(false); return; }
      setIsAdmin(true);

      // Load reports
      const { data: reportsData } = await supabase.from('reports').select('*').eq('status', 'pending');
      setReports(reportsData || []);

      // Load users
      const { data: usersData } = await supabase.from('profiles').select('*').limit(50);
      setUsers(usersData || []);

      setLoading(false);
    }
    load();
  }, [userId]);

  if (!isAdmin) {
    return <div className="reader-card">No tienes acceso a esta sección.</div>;
  }

  async function resolveReport(reportId, approved) {
    await supabase.from('reports').update({ status: approved ? 'resolved' : 'dismissed', reviewed_at: new Date() }).eq('id', reportId);
    setReports((r) => r.filter((x) => x.id !== reportId));
  }

  async function toggleAdminStatus(userId, isAdmin) {
    await supabase.from('profiles').update({ is_admin: !isAdmin }).eq('id', userId);
    setUsers((u) => u.map((x) => (x.id === userId ? { ...x, is_admin: !isAdmin } : x)));
  }

  return (
    <section className="reader-card">
      <p className="reader-novel">Admin</p>
      <h1><Shield size={20} /> Panel de administración</h1>

      <div className="admin-tabs">
        <button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>
          <AlertCircle size={16} /> Reportes ({reports.length})
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          Usuarios ({users.length})
        </button>
      </div>

      {loading && <p>Cargando...</p>}

      {tab === 'reports' && (
        <div className="admin-list">
          {reports.map((r) => (
            <article key={r.id} className="admin-item">
              <div>
                <h3>Reporte: {r.target_type}</h3>
                <p>{r.reason}</p>
                <p className="muted">ID: {r.target_id}</p>
              </div>
              <div className="admin-actions">
                <button className="primary-action" onClick={() => resolveReport(r.id, true)}>
                  <CheckCircle size={16} /> Resolver
                </button>
                <button className="secondary-action" onClick={() => resolveReport(r.id, false)}>
                  Descartar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="admin-list">
          {users.map((u) => (
            <article key={u.id} className="admin-item">
              <div>
                <h3>{u.display_name || u.username}</h3>
                <p className="muted">@{u.username}</p>
                {u.is_admin && <span className="badge">Admin</span>}
              </div>
              <button
                className="secondary-action"
                onClick={() => toggleAdminStatus(u.id, u.is_admin)}
              >
                {u.is_admin ? 'Remover Admin' : 'Hacer Admin'}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminPanel;
