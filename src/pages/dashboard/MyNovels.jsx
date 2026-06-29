import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { NOVEL_STATUSES } from '../../lib/constants';

export function MyNovels() {
  const { session } = useAuth();
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!session?.user) return;

      const { data } = await supabase
        .from('novels')
        .select('*, chapters(count)')
        .eq('created_by', session.user.id)
        .order('updated_at', { ascending: false });

      setNovels(data || []);
      setLoading(false);
    }

    load();
  }, [session]);

  return (
    <section className="reader-card">
      <div className="page-header-row">
        <div>
          <p className="reader-novel">Mis novelas</p>
          <h1>Gestión de novelas</h1>
        </div>
        <Link to="/dashboard/novels/new/edit" className="primary-action">
          <Plus size={17} /> Subir novela
        </Link>
      </div>

      {loading && <p className="form-message">Cargando...</p>}

      {!loading && novels.length === 0 && (
        <div className="empty-state">Todavía no has subido novelas.</div>
      )}

      <div className="admin-list">
        {novels.map((novel) => (
          <article key={novel.id} className="admin-item">
            {novel.cover_url && <img src={novel.cover_url} alt={novel.title} />}

            <div>
              <h3>{novel.title}</h3>
              <p>{novel.author || 'Sin autor'}</p>
              <span className="detail-pill">{NOVEL_STATUSES[novel.status] || novel.status}</span>
              <p>{novel.chapters?.[0]?.count || 0} capítulos</p>

              <div className="admin-actions">
                <Link to={`/novel/${novel.id}`} className="secondary-action">
                  <Eye size={16} /> Ver
                </Link>
                <Link to={`/dashboard/novels/${novel.id}/edit`} className="secondary-action">
                  <Edit size={16} /> Editar
                </Link>
                <Link to={`/dashboard/novels/${novel.id}/chapters`} className="secondary-action">
                  Capítulos
                </Link>
                <button type="button" className="secondary-action" onClick={async () => {
                  if (!confirm('¿Eliminar esta novela? Esta acción es irreversible.')) return;
                  await supabase.from('novels').delete().eq('id', novel.id);
                  setNovels((cur) => cur.filter((n) => n.id !== novel.id));
                }}>
                  <Trash2 size={16} /> Eliminar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
