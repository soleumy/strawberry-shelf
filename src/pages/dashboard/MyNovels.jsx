import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit3, BookOpen, Layers, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export function MyNovels() {
  const { user } = useAuth();
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMyNovels() {
      if (!supabase.isConfigured || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('novels')
        .select('id, title, cover_url, status, chapters(id)')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNovels(data);
      }
      setLoading(false);
    }

    loadMyNovels();
  }, [user]);

  // Badge de estado estilizado
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-md">
            <CheckCircle2 size={12} /> Publicada
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md">
            <AlertCircle size={12} /> Rechazada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md">
            <Clock size={12} /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="animate-fadeIn font-sans">
      {/* Encabezado del Panel Interno */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Layers className="text-pink-500" size={22} /> Mis Obras Publicadas
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">Administra tus novelas ligeras, añade capítulos o edita la información general.</p>
        </div>
        <Link
          to="/dashboard/novels/new/edit"
          className="inline-flex items-center gap-1.5 bg-pink-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-pink-600 transition"
        >
          <Plus size={16} /> Crear Nueva Novela
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-pink-500 font-medium animate-pulse text-xs">
          Abriendo tus archivadores de escritor...
        </div>
      ) : novels.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-400 text-xs flex flex-col items-center gap-2">
          <span>Aún no has registrado ninguna novela de tu autoría o traducción.</span>
          <Link to="/dashboard/novels/new/edit" className="text-pink-500 font-bold hover:underline">
            Comienza publicando tu primera obra aquí
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {novels.map((novel) => (
            <div
              key={novel.id}
              className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-4 flex gap-4 shadow-xs"
            >
              {/* Mini Portada */}
              <div className="w-16 aspect-[2/3] bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={novel.cover_url || '/placeholder-cover.png'}
                  alt={novel.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Datos y Botoneras de Acción Rápida */}
              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1">
                      {novel.title}
                    </h2>
                    {renderStatusBadge(novel.status)}
                  </div>
                  <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                    <BookOpen size={12} /> {novel.chapters?.length || 0} capítulos creados
                  </p>
                </div>

                {/* Accesos directos basados en tus rutas hijas de App.jsx */}
                <div className="flex gap-2 border-t border-neutral-50 dark:border-neutral-800/50 pt-2.5 mt-2">
                  <Link
                    to={`/dashboard/novels/${novel.id}/edit`}
                    className="flex items-center gap-1 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 hover:text-pink-500 bg-neutral-50 dark:bg-neutral-800/40 px-2.5 py-1.5 rounded-lg border border-neutral-200/40 dark:border-transparent transition"
                  >
                    <Edit3 size={12} /> Datos Obra
                  </Link>
                  <Link
                    to={`/dashboard/novels/${novel.id}/chapters`}
                    className="flex items-center gap-1 text-[11px] font-bold bg-pink-500 text-white hover:bg-pink-600 px-2.5 py-1.5 rounded-lg shadow-xs transition"
                  >
                    <BookOpen size={12} /> Gestionar Caps
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}