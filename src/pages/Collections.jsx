import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mergeNovels } from '../lib/novelUtils';
import { Link } from 'react-router-dom';
import { Layers, Bookmark, User, ChevronRight } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollections() {
      setLoading(true);
      let loadedCollections = [];

      try {
        if (supabase.isConfigured) {
          // Consultamos colecciones públicas creadas por usuarios o administradores
          const { data, error } = await supabase
            .from('collections')
            .select(`
              id,
              name,
              description,
              created_at,
              user:profiles(display_name)
            `)
            .order('created_at', { ascending: false });

          if (!error && data) {
            loadedCollections = data.map(col => ({
              ...col,
              author: col.user?.display_name || 'Comunidad',
              count: 0 // Nota: Se puede complementar mapeando los items vinculados si es necesario
            }));
          }
        }
      } catch (err) {
        console.warn('Error cargando colecciones de Supabase, usando respaldo local:', err);
      }

      // Respaldo estático elegante si no hay datos remotos configurados
      if (loadedCollections.length === 0) {
        const totalLocalNovels = mergeNovels([]).length;
        loadedCollections = [
          {
            id: 'local-col-1',
            name: 'Recomendaciones Destacadas',
            description: 'Una cuidada selección de historias inmersivas ideales para comenzar tus maratones de lectura.',
            author: 'Staff',
            count: totalLocalNovels
          },
          {
            id: 'local-col-2',
            name: 'Joyas Ocultas',
            description: 'Obras fascinantes, únicas y con propuestas narrativas que merecen una oportunidad en tu estantería.',
            author: 'Editor',
            count: Math.min(2, totalLocalNovels)
          }
        ];
      }

      setCollections(loadedCollections);
      setLoading(false);
    }

    loadCollections();
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 font-sans text-neutral-800 dark:text-neutral-200 animate-fadeIn">
      <SEO title="Colecciones Temáticas · Estantería" description="Explora listas de lectura y antologías creadas por la comunidad." />

      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Layers className="text-pink-500" size={24} /> Colecciones de la Comunidad
        </h1>
        <p className="text-xs text-neutral-500 mt-1">Antologías temáticas y listas de obras recomendadas por lectores y traductores.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-pink-500 font-medium animate-pulse">
          Estructurando las estanterías temáticas...
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-neutral-400 text-sm">
          No se han creado colecciones públicas todavía.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map((collection) => (
            <div 
              key={collection.id}
              className="bg-white dark:bg-neutral-900 border border-pink-50/50 dark:border-neutral-800/60 p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:border-pink-200 dark:hover:border-neutral-700 transition group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-pink-500 transition-colors">
                    {collection.name}
                  </h2>
                  <span className="text-[11px] font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded-md flex items-center gap-1 flex-shrink-0">
                    <Bookmark size={11} /> {collection.count} obras
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
                  {collection.description}
                </p>
              </div>

              <div className="border-t border-neutral-50 dark:border-neutral-800/60 pt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <User size={13} className="text-neutral-400" />
                  <span>Por <span className="font-semibold text-neutral-600 dark:text-neutral-300">{collection.author}</span></span>
                </div>
                
                {/* Enlace dinámico: las colecciones locales redirigen al catálogo general por conveniencia */}
                <Link 
                  to={collection.id.toString().startsWith('local') ? '/' : `/collections/${collection.id}`}
                  className="text-xs font-bold text-neutral-400 group-hover:text-pink-500 transition-colors flex items-center gap-0.5"
                >
                  Explorar listado <ChevronRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}