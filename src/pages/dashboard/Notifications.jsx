import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, MessageSquare, Heart, UserPlus, BookOpen, Star, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const TYPE_CONFIG = {
  comment: { label: 'Nuevo comentario', icon: MessageSquare, color: 'text-blue-500' },
  favorite: { label: 'Nuevo favorito', icon: Heart, color: 'text-pink-500' },
  follower: { label: 'Nuevo seguidor', icon: UserPlus, color: 'text-green-500' },
  novel_approved: { label: 'Novela aprobada', icon: CheckCircle, color: 'text-emerald-500' },
  new_chapter: { label: 'Nuevo capítulo', icon: BookOpen, color: 'text-purple-500' },
  message: { label: 'Mensaje', icon: MessageSquare, color: 'text-blue-500' },
  report_resolved: { label: 'Reporte resuelto', icon: CheckCircle, color: 'text-emerald-500' },
  rating: { label: 'Nueva calificación', icon: Star, color: 'text-yellow-500' },
};

export function Notifications() {
  const { session } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const unreadCount = items.filter((item) => !item.is_read).length;

  const filteredItems = filter === 'all' ? items : items.filter((item) => item.type === filter);

  return (
    <section className="reader-card">
      <div className="page-header-row">
        <div>
          <p className="reader-novel">
            <Bell size={16} /> Notificaciones
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </p>
          <h1>Tu actividad</h1>
        </div>
        <button type="button" className="secondary-action" onClick={markAllRead}>
          <Check size={16} /> Marcar todo leído
        </button>
      </div>

      <div className="notification-filters">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`notification-filter ${filter === 'all' ? 'active' : ''}`}
        >
          Todo
        </button>
        <button
          type="button"
          onClick={() => setFilter('comment')}
          className={`notification-filter ${filter === 'comment' ? 'active' : ''}`}
        >
          Comentarios
        </button>
        <button
          type="button"
          onClick={() => setFilter('follower')}
          className={`notification-filter ${filter === 'follower' ? 'active' : ''}`}
        >
          Seguidores
        </button>
        <button
          type="button"
          onClick={() => setFilter('favorite')}
          className={`notification-filter ${filter === 'favorite' ? 'active' : ''}`}
        >
          Favoritos
        </button>
      </div>

      {loading && <p className="form-message">Cargando...</p>}

      <div className="notifications-list">
        {filteredItems.map((item) => {
          const config = TYPE_CONFIG[item.type] || { label: item.title, icon: Bell, color: 'text-gray-500' };
          const Icon = config.icon;
          return (
            <article key={item.id} className={`notification-item ${item.is_read ? 'read' : ''}`}>
              <div className="notification-icon">
                <Icon size={20} className={config.color} />
              </div>
              <div className="notification-content">
                <div className="notification-header">
                  <strong>{config.label}</strong>
                  {!item.is_read && <span className="notification-unread-dot" />}
                </div>
                <p>{item.body || item.title}</p>
                <time>{new Date(item.created_at).toLocaleString('es')}</time>
              </div>
              <div className="notification-actions">
                {item.link && <Link to={item.link} className="primary-action">Ver</Link>}
                {!item.is_read && (
                  <button type="button" className="text-button" onClick={() => markRead(item.id)}>
                    Leído
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!loading && filteredItems.length === 0 && (
        <div className="empty-state">
          {filter === 'all' ? 'No tienes notificaciones.' : `No tienes notificaciones de tipo ${filter}.`}
        </div>
      )}
    </section>
  );
}