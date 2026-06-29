import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { mergeNovels, sortNovels } from '../lib/novelUtils';
import { BookOpen, TrendingUp, Clock, Search } from 'lucide-react';
import { SEO } from '../components/SEO';

export function HomePage() {
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);
      let remoteNovels = [];

      try {
        if (supabase.isConfigured) {
          const { data, error } = await supabase
            .from('novels')
            .select('*, author:profiles(display_name, username)')
            .eq('status', 'approved');
          
          if (!error && data) {
            remoteNovels = data;
          }
        }
      } catch (err) {
        console.warn('Error accediendo a Supabase, usando respaldo local:', err);
      }

      // Mezclamos con los datos locales de data.js de forma transparente
      const combined = mergeNovels(remoteNovels);
      setNovels(combined);
      setLoading(false);
    }

    loadHomeData();
  }, []);

  // Segmentamos secciones en base al orden dinámico
  const featuredNovels = sortNovels(novels, 'views').slice(0, 4);
  const recentNovels = sortNovels(novels, 'recent').slice(0, 8);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="animate-pulse text-pink-500 font-medium">Cargando catálogo principal...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans pb-12 text-neutral-800 dark:text-neutral-200">
      <SEO title="Inicio · Biblioteca de Novelas Ligeras" description="Explora y lee novelas ligeras en tu estantería digital." />

      {/* Banner de Bienvenida / Hero Section */}
      <section className="bg-gradient-to-r from-pink-500 to-rose-400 text-white py-12 px-6 rounded-b-[2.5rem] shadow-sm mb-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px]" />
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Tu Estantería de Novelas Ligeras</h1>
          <p className="text-pink-100 text-sm md:text-base max-w-xl">
            Descubre mundos e historias fascinantes totalmente en español de forma fluida y personalizable.
          </p>
          <Link 
            to="/search" 
            className="mt-2 inline-flex items-center gap-2 bg-white text-pink-600 font-bold px-6 py-2.5 rounded-full shadow-md hover:bg-pink-50 transition transform hover:scale-[1.02]"
          >
            <Search size={18} /> Ir al Buscador Avanzado
          </Link>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-10">
        
        {/* Sección 1: Novelas Populares / Destacadas */}
        {featuredNovels.length > 0 && (
          <section className="animate-fadeIn">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-neutral-900 dark:text-white">
              <TrendingUp className="text-pink-500" size={22} /> Novelas Populares
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredNovels.map((novel) => (
                <Link 
                  key={novel.id} 
                  to={`/novel/${novel.id}`}
                  className="group bg-white dark:bg-neutral-900 rounded-2xl border border-pink-50/60 dark:border-neutral-800/40 p-3 shadow-sm flex gap-4 hover:shadow-md transition"
                >
                  <div className="w-20 aspect-[2/3] rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                    <img src={novel.cover_url} alt={novel.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                  </div>
                  <div className="flex flex-col justify-between py-1 min-w-0">
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-pink-500 transition-colors">
                        {novel.title}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                        Por {novel.author?.display_name || novel.author_name_override || 'Anónimo'}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md w-max">
                      ★ {novel.views_count || 0} vistas
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sección 2: Últimas Actualizaciones */}
        <section className="animate-fadeIn">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-neutral-900 dark:text-white">
            <Clock className="text-pink-500" size={22} /> Últimas Actualizaciones
          </h2>
          {recentNovels.length === 0 ? (
            <p className="text-sm text-neutral-400 py-6">No hay novelas disponibles por el momento.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {recentNovels.map((novel) => (
                <Link 
                  key={novel.id} 
                  to={`/novel/${novel.id}`} 
                  className="group bg-white dark:bg-neutral-900 border border-pink-50/40 dark:border-neutral-800/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col h-full"
                >
                  <div className="aspect-[2/3] w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
                    <img 
                      src={novel.cover_url} 
                      alt={novel.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2 group-hover:text-pink-500 transition-colors">
                        {novel.title}
                      </h3>
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 line-clamp-1 mt-0.5">
                        {novel.author?.display_name || novel.author_name_override || 'Anónimo'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 border-t border-neutral-50 dark:border-neutral-800/60 pt-2">
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} className="text-pink-400" /> {novel.chapters?.length || 0} caps
                      </span>
                      <span className="capitalize">{novel.language || 'es'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
