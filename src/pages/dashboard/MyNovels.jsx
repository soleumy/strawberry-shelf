import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BookOpen, CheckCircle2, Clock, Edit3, Layers, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export function MyNovels() {
  const { user } = useAuth();
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState('');
  const [message, setMessage] = useState('');

  async function loadMyNovels() {
    setMessage('');

    if (!user?.id) {
      setLoading(false);
      setMessage('Necesitas iniciar sesión.');
      return;
    }

    if (!supabase.isConfigured) {
      setLoading(false);
      setMessage('Supabase no está configurado.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('novels')
      .select('id, title, cover_url, status, author_id, created_at, chapters(id)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      setNovels([]);
    } else {
      setNovels(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMyNovels();
  }, [user?.id]);

  async function deleteNovel(novelId) {
    const confirmed = window.confirm('¿Seguro que quieres borrar esta obra? También se borrarán sus capítulos.');

    if (!confirmed) return;

    setDeletingId(novelId);
    setMessage('');

    const { error: chaptersError } = await supabase
      .from('chapters')
      .delete()
      .eq('novel_id', novelId);

    if (chaptersError) {
      setMessage(chaptersError.message);
      setDeletingId('');
      return;
    }

    const { error: novelError } = await supabase
      .from('novels')
      .delete()
      .eq('id', novelId)
      .eq('author_id', user.id);

    if (novelError) {
      setMessage(novelError.message);
      setDeletingId('');
      return;
    }

    setNovels((current) => current.filter((novel) => novel.id !== novelId));
    setMessage('Obra borrada correctamente.');
    setDeletingId('');
  }

  function renderStatusBadge(status) {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-md">
          <CheckCircle2 size={12} /> Publicada
        </span>
      );
    }

    if (status === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md">
          <AlertCircle size={12} /> Rechazada
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md">
        <Clock size={12} /> Pendiente
      </span>
    );
  }

  return (
    <div className="animate-fadeIn font-sans">
      <div className="page-header-row">
        <div>
          <p className="reader-novel">Panel creativo</p>
          <h1 className="flex items-center gap-2">
            <Layers size={24} /> Mis novelas
          </h1>
          <p className="muted">
            Administra tus obras, capítulos y datos principales.
          </p>
        </div>

        <Link to="/dashboard/novels/new/edit" className="primary-action">
          <Plus size={16} /> Crear novela
        </Link>
      </div>

      {message && <p className="form-message">{message}</p>}

      {loading ? (
        <div className="empty-state">Abriendo tus novelas...</div>
      ) : novels.length === 0 ? (
        <div className="empty-state">
          Aún no has registrado ninguna novela.
          <br />
          <Link to="/dashboard/novels/new/edit" className="text-button">
            Crear mi primera novela
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {novels.map((novel) => (
            <article key={novel.id} className="library-item">
              <img src={novel.cover_url || '/placeholder-cover.png'} alt={novel.title} />

              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3>{novel.title}</h3>
                  {renderStatusBadge(novel.status)}
                </div>

                <p>
                  <BookOpen size={14} /> {novel.chapters?.length || 0} capítulos creados
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Link to={`/dashboard/novels/${novel.id}/edit`} className="secondary-action">
                    <Edit3 size={14} /> Datos
                  </Link>

                  <Link to={`/dashboard/novels/${novel.id}/chapters`} className="primary-action">
                    <BookOpen size={14} /> Subir capítulos
                  </Link>

                  <button
                    type="button"
                    className="secondary-action"
                    disabled={deletingId === novel.id}
                    onClick={() => deleteNovel(novel.id)}
                  >
                    <Trash2 size={14} /> {deletingId === novel.id ? 'Borrando...' : 'Borrar obra'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
