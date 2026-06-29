import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mergeNovels, sortNovels } from '../lib/novelUtils';
import { Link } from 'react-router-dom';
import { Rss, MessageSquare, BookOpen, Sparkles } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function FeedPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      let feedItems = [];

      try {
        if (supabase.isConfigured) {
          // Consultamos las novelas más recientes aprobadas en la base de datos
          const { data: recentNovels, error } = await supabase
            .from('novels')
            .select('id, title, created_at, cover_url, author:profiles(display_name)')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(10);

          if (!error && recentNovels) {
            feedItems = recentNovels.map(novel => ({
              id: `novel-${novel.id}`,
              type: 'novel',
              title: 'Nueva obra publicada',
              description: `Se ha añadido "${novel.title}" al catálogo de la estantería.`,
              date: novel.created_at,
              link: `/novel/${novel.id}`,
              meta: novel.author?.display_name || 'Anónimo'
            }));
          }
        }
      } catch (err) {
        console.warn('Error cargando feed de Supabase, usando respaldo local:', err);
      }

      // Si no hay datos remotos o falla, generamos un feed dinámico usando el respaldo local
      if (feedItems.length === 0) {
        const localNovels = sortNovels(mergeNovels([]), 'recent').slice(0, 5);
        feedItems = localNovels.map(novel => ({
          id: `local-${novel.id}`,
          type: 'novel',
          title: 'Actualización de obra',
          description: `¡"${novel.title}" ya está disponible para su lectura!`,
          date: new Date().toISOString(),
          link: `/novel/${novel.id}`,
          meta: novel.author_name_override || 'Comunidad'
        }));
      }

      setActivities(feedItems);
      setLoading(false);
    }

    loadFeed();
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 font-sans text-neutral-800 dark:text-neutral-200 animate-fadeIn">
      <SEO title="Feed de Actividad · Comunidad" description="Entérate de las últimas novedades y capítulos añadidos a la plataforma." />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Rss className="text-pink-500" size={24} /> Feed de la Comunidad
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Sigue el pulso de las últimas traducciones, publicaciones y novedades.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-pink-500 font-medium animate-pulse">
          Sintonizando las frecuencias del feed...
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-neutral-400 text-sm">
          No hay actividad reciente en el servidor por el momento.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activities.map((item) => (
            <div 
              key={item.id} 
              className="bg-white dark:bg-neutral-900 border border-pink-50/50 dark:border-neutral-800/60 p-4 rounded-2xl shadow-sm flex gap-4 items-start hover:border-pink-200 dark:hover:border-neutral-700 transition"
            >
              <div className="p-2.5 bg-pink-50 dark:bg-neutral-950 rounded-xl text-pink-500 flex-shrink-0">
                {item.type === 'novel' ? <Sparkles size={20} /> : <BookOpen size={20} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {item.title}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mt-1">
                  {item.description}
                </p>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Contribución: <span className="font-semibold text-neutral-600 dark:text-neutral-300">{item.meta}</span>
                  </span>
                  <Link 
                    to={item.link} 
                    className="text-xs font-bold text-pink-500 hover:text-pink-600 transition"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}