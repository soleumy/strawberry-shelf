import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mergeNovels, sortNovels } from '../lib/novelUtils';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Rss, Sparkles, Star } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function FeedPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function loadFeed() {
      setLoading(true);
      let feedItems = [];

      try {
        if (supabase.isConfigured) {
          // Novelas recientes
          const { data: recentNovels } = await supabase
            .from('novels')
            .select('id, title, created_at, cover_url, author:profiles(display_name)')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(10);

          if (recentNovels) {
            feedItems.push(...recentNovels.map(novel => ({
              id: `novel-${novel.id}`,
              type: 'novel',
              title: 'Nueva obra publicada',
              description: `Se ha añadido "${novel.title}" al catálogo.`,
              date: novel.created_at,
              link: `/novel/${novel.id}`,
              meta: novel.author?.display_name || 'Anónimo'
            })));
          }

          // Comentarios recientes
          const { data: recentComments } = await supabase
            .from('comments')
            .select('id, content, created_at, novel_id, user:profiles(display_name), novel:novels(title)')
            .order('created_at', { ascending: false })
            .limit(15);

          if (recentComments) {
            feedItems.push(...recentComments.map(comment => ({
              id: `comment-${comment.id}`,
              type: 'comment',
              title: 'Nuevo comentario',
              description: comment.content?.substring(0, 100) + (comment.content?.length > 100 ? '...' : ''),
              date: comment.created_at,
              link: `/novel/${comment.novel_id}`,
              meta: comment.user?.display_name || 'Usuario'
            })));
          }

          // Ratings recientes
          const { data: recentRatings } = await supabase
            .from('ratings')
            .select('id, score, created_at, novel_id, user:profiles(display_name), novel:novels(title)')
            .order('created_at', { ascending: false })
            .limit(15);

          if (recentRatings) {
            feedItems.push(...recentRatings.map(rating => ({
              id: `rating-${rating.id}`,
              type: 'rating',
              title: 'Nueva calificación',
              description: `Calificó "${rating.novel?.title || 'una novela'}" con ${rating.score} estrellas.`,
              date: rating.created_at,
              link: `/novel/${rating.novel_id}`,
              meta: rating.user?.display_name || 'Usuario',
              score: rating.score
            })));
          }

          // Favoritos recientes (si existe la tabla)
          const { data: recentFavorites } = await supabase
            .from('favorites')
            .select('id, created_at, novel_id, user:profiles(display_name), novel:novels(title)')
            .order('created_at', { ascending: false })
            .limit(15);

          if (recentFavorites) {
            feedItems.push(...recentFavorites.map(fav => ({
              id: `favorite-${fav.id}`,
              type: 'favorite',
              title: 'Nuevo favorito',
              description: `Añadió "${fav.novel?.title || 'una novela'}" a favoritos.`,
              date: fav.created_at,
              link: `/novel/${fav.novel_id}`,
              meta: fav.user?.display_name || 'Usuario'
            })));
          }
        }
      } catch (err) {
        console.warn('Error cargando feed de Supabase:', err);
      }

      // Ordenar por fecha
      feedItems.sort((a, b) => new Date(b.date) - new Date(a.date));

      // Si no hay datos, usar respaldo local
      if (feedItems.length === 0) {
        const localNovels = sortNovels(mergeNovels([]), 'recent').slice(0, 5);
        feedItems = localNovels.map(novel => ({
          id: `local-${novel.id}`,
          type: 'novel',
          title: 'Actualización de obra',
          description: `¡"${novel.title}" ya está disponible!`,
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

        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === 'all'
                ? 'bg-pink-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Todo
          </button>
          <button
            type="button"
            onClick={() => setFilter('novel')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === 'novel'
                ? 'bg-pink-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Novelas
          </button>
          <button
            type="button"
            onClick={() => setFilter('comment')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === 'comment'
                ? 'bg-pink-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Comentarios
          </button>
          <button
            type="button"
            onClick={() => setFilter('rating')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === 'rating'
                ? 'bg-pink-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Calificaciones
          </button>
          <button
            type="button"
            onClick={() => setFilter('favorite')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              filter === 'favorite'
                ? 'bg-pink-500 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            Favoritos
          </button>
        </div>
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
          {activities
            .filter(item => filter === 'all' || item.type === filter)
            .map((item) => (
            <div 
              key={item.id} 
              className="bg-white dark:bg-neutral-900 border border-pink-50/50 dark:border-neutral-800/60 p-4 rounded-2xl shadow-sm flex gap-4 items-start hover:border-pink-200 dark:hover:border-neutral-700 transition"
            >
              <div className="p-2.5 bg-pink-50 dark:bg-neutral-950 rounded-xl text-pink-500 flex-shrink-0">
                {item.type === 'novel' && <Sparkles size={20} />}
                {item.type === 'comment' && <MessageSquare size={20} />}
                {item.type === 'rating' && <Star size={20} />}
                {item.type === 'favorite' && <Heart size={20} />}
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
                    Por: <span className="font-semibold text-neutral-600 dark:text-neutral-300">{item.meta}</span>
                    {item.score && (
                      <span className="ml-2 flex items-center gap-1 text-yellow-500">
                        <Star size={12} fill="currentColor" /> {item.score}
                      </span>
                    )}
                  </span>
                  <Link 
                    to={item.link} 
                    className="text-xs font-bold text-pink-500 hover:text-pink-600 transition"
                  >
                    Ver →
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