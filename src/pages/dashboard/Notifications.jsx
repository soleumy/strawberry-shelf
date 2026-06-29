import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const TYPE_LABELS = {
  comment: 'Nuevo comentario',
  favorite: 'Nuevo favorito',
  follower: 'Nuevo seguidor',
  novel_approved: 'Novela aprobada',
  new_chapter: 'Nuevo capítulo',
  message: 'Mensaje',
  report_resolved: 'Reporte resuelto',
};

export function Notifications() {
  const { session } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!session?.user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [session]);

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    load();
  }

  async function markAllRead() {
    if (!session?.user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id);
    load();
  }

  return (
    <section className="reader-card">
      <div className="page-header-row">
        <div>
          <p className="reader-novel"><Bell size={16} /> Notificaciones</p>
          <h1>Tu actividad</h1>
        </div>
        <button type="button" className="secondary-action" onClick={markAllRead}>
          <Check size={16} /> Marcar todo leído
        </button>
      </div>

      {loading && <p className="form-message">Cargando...</p>}

      <div className="notifications-list">
        {items.map((item) => (
          <article key={item.id} className={`notification-item ${item.is_read ? 'read' : ''}`}>
            <div>
              <strong>{TYPE_LABELS[item.type] || item.title}</strong>
              <p>{item.body || item.title}</p>
              <time>{new Date(item.created_at).toLocaleString('es')}</time>
            </div>

            <div className="notification-actions">
              {item.link && <Link to={item.link}>Ver</Link>}
              {!item.is_read && (
                <button type="button" className="text-button" onClick={() => markRead(item.id)}>
                  Leído
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="empty-state">No tienes notificaciones.</div>
      )}
    </section>
  );
}
