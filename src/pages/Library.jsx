import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, Bookmark, CheckCircle, PauseCircle, FolderHeart } from 'lucide-react';
import { normalizeLocalNovel } from '../lib/novelUtils';

const TABS = [
  { id: 'reading', label: 'Leyendo', icon: BookOpen, color: 'text-pink-500' },
  { id: 'want_to_read', label: 'Por leer', icon: Bookmark, color: 'text-blue-500' },
  { id: 'completed', label: 'Completadas', icon: CheckCircle, color: 'text-green-500' },
  { id: 'paused', label: 'En Pausa', icon: PauseCircle, color: 'text-amber-500' },
];

export function Library() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reading');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLibrary() {
      if (!supabase.isConfigured || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('reading_list')
        .select(`
          status,
          novel:novels (
            id,
            title,
            cover_url,
            synopsis,
            author_name_override,
            author:profiles(display_name)
          )
        `)
        .eq('user_id', user.id);

      if (!error && data) {
        // Estructuramos y limpiamos la respuesta relacional de Supabase
        const formattedItems = data.map((item) => ({
          status: item.status,
          ...item.novel,
          author_name: item.novel?.author?.display_name || item.novel?.author_name_override || 'Anónimo',
        }));
        setItems(formattedItems);
      }
      setLoading(false);
    }

    fetchLibrary();
  }, [user]);

  // Si Supabase no está configurado o no hay sesión activa
  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center font-sans">
        <div className="bg-white dark:bg-neutral-900 border border-pink-100 dark:border-neutral-800 rounded-3xl p-8 shadow-sm max-w-md mx-auto">
          <FolderHeart size={48} className="mx-auto text-pink-400 mb-4" />
          <h1 className="text-xl font-bold text-neutral-800 dark:text-neutral-100">Tu biblioteca personal</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 mb-6">
            Inicia sesión en la plataforma para guardar tus novelas favoritas y organizar tu progreso de lectura de forma personalizada.
          </p>
          <Link to="/" className="inline-block px-6 py-2.5 bg-pink-500 text-white font-bold rounded-full text-sm hover:bg-pink-600 transition">
            Volver al catálogo principal
          </Link>
        </div>
      </main>
    );
  }

  // Filtrar las novelas según la pestaña seleccionada
  const filteredNovels = items.filter((item) => item.status === activeTab);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 font-sans text-neutral-800 dark:text-neutral-200 animate-fadeIn">
      
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <FolderHeart className="text-pink-500" size={26} /> Mi Biblioteca Estantería
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Organiza tus lecturas y retoma tus aventuras en cualquier momento.</p>
      </div>

      {/* Sistema de Pestañas / Tabs Responsivo */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-2 overflow-x-auto pb-px mb-6 scrollbar-none">
        {TABS.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm whitespace-nowrap transition-all border-b-2 -mb-px ${
                isActive
                  ? 'border-pink-500 text-pink-600 dark:text-pink-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
              }`}
            >
              <IconComponent size={16} className={isActive ? tab.color : 'text-neutral-400'} />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-pink-100 dark:bg-pink-950 text-pink-600' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                {items.filter((item) => item.status === tab.id).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenedor de Resultados */}
      {loading ? (
        <div className="text-center py-12 text-pink-500 font-medium animate-pulse">
          Organizando tus estantes digitales...
        </div>
      ) : filteredNovels.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl text-neutral-400 text-sm">
          No tienes ninguna novela en la sección de "{TABS.find(t => t.id === activeTab)?.label}".
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredNovels.map((novel) => (
            <Link
              key={novel.id}
              to={`/novel/${novel.id}`}
              className="group bg-white dark:bg-neutral-900 rounded-2xl border border-pink-50/40 dark:border-neutral-800/40 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full"
            >
              <div className="aspect-[2/3] w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
                <img
                  src={novel.cover_url || '/placeholder-cover.png'}
                  alt={novel.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2 group-hover:text-pink-500 transition-colors">
                    {novel.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5">
                    Por {novel.author_name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}