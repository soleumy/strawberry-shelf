import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { mergeNovels, filterNovels, sortNovels, paginate } from '../lib/novelUtils';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Filter, SlidersHorizontal } from 'lucide-react';
import { SiteLayout } from '../components/SiteLayout'; // Ajusta la ruta si tu contenedor principal se llama diferente

const GENRES = ['Romance', 'Acción', 'Fantasía', 'Drama', 'Comedia', 'Terror', 'Aventura', 'Misterio', 'Sci-Fi', 'Histórico', 'BL', 'GL'];
const STATUSES = ['draft', 'pending', 'approved', 'paused', 'completed', 'cancelled'];

export default function SearchPage() {
  const [allNovels, setAllNovels] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Estados de los filtros reactivos
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);

  // Carga inicial unificada (Supabase + Local)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      let remoteData = [];
      
      if (supabase.isConfigured) {
        const { data } = await supabase
          .from('novels')
          .select('*, author:profiles(display_name, username)')
          .eq('status', 'approved');
        remoteData = data || [];
      }
      
      const merged = mergeNovels(remoteData);
      setAllNovels(merged);
      setLoading(false);
    }
    loadData();
  }, []);

  // Efecto que procesa los filtros y el orden en tiempo real
  useEffect(() => {
    let result = filterNovels(allNovels, { query, genre, status });
    result = sortNovels(result, sortBy);
    setFiltered(result);
    setPage(1); // Reiniciar a la primera página cada vez que se filtra
  }, [query, genre, status, sortBy, allNovels]);

  // Paginación de 12 elementos por página
  const { items: paginatedItems, totalPages } = paginate(filtered, page, 12);

  return (
    <SiteLayout>
      <main className="max-w-6xl mx-auto px-4 py-6 font-sans text-neutral-800 dark:text-neutral-200">
        
        {/* Encabezado y Barra de Búsqueda Principal */}
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-2xl font-bold text-pink-600 dark:text-pink-400 flex items-center gap-2">
            <SearchIcon size={24} /> Buscador Avanzado
          </h1>

          <div className="flex gap-2 w-full">
            <div className="relative flex-1">
              <input 
                type="text"
                placeholder="Buscar por título, autor o traductor..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-pink-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm focus:outline-none focus:border-pink-400 text-sm"
              />
              <SearchIcon className="absolute left-3.5 top-3.5 text-neutral-400" size={18} />
            </div>
            
            {/* Botón Filtros Móvil */}
            <button 
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="p-2.5 bg-pink-50 dark:bg-neutral-900 text-pink-600 dark:text-pink-400 rounded-full border border-pink-100 dark:border-neutral-800 md:hidden flex items-center justify-center transition hover:scale-105"
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>

          {/* Panel de Filtros (Desplegable en móvil, fijo en escritorio) */}
          <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-col md:flex-row gap-4 p-4 bg-pink-50/40 dark:bg-neutral-900/40 rounded-2xl border border-pink-100 dark:border-neutral-800/60 transition-all duration-200`}>
            
            {/* Selector de Género */}
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Género</label>
              <select 
                value={genre} 
                onChange={(e) => setGenre(e.target.value)} 
                className="p-2 rounded-xl border border-pink-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-pink-400"
              >
                <option value="">Todos los géneros</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Selector de Estado */}
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Estado</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="p-2 rounded-xl border border-pink-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-pink-400"
              >
                <option value="">Cualquier estado</option>
                <option value="approved">Aprobada/Publicada</option>
                <option value="paused">En Pausa</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>

            {/* Ordenamiento */}
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Ordenar por</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="p-2 rounded-xl border border-pink-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:border-pink-400"
              >
                <option value="recent">Más recientes</option>
                <option value="A-Z">A - Z</option>
                <option value="Z-A">Z - A</option>
                <option value="views">Más vistas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de Contenido */}
        {loading ? (
          <div className="text-center py-12 text-pink-500 font-medium animate-pulse">Buscando en la estantería de fresas...</div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">No se encontraron novelas con los filtros seleccionados.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-fadeIn">
                {paginatedItems.map((novel) => (
                  <Link 
                    key={novel.id} 
                    to={`/novel/${novel.id}`} 
                    className="group bg-white dark:bg-neutral-900 rounded-2xl border border-pink-50/60 dark:border-neutral-800/50 shadow-sm overflow-hidden hover:shadow-md hover:scale-[1.01] transition duration-200 flex flex-col h-full"
                  >
                    <div className="aspect-[2/3] w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
                      <img 
                        src={novel.cover_url} 
                        alt={novel.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 line-clamp-2 group-hover:text-pink-500 transition-colors">
                          {novel.title}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-1">
                          Por {novel.author?.display_name || novel.author_name_override || 'Anónimo'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button 
                  type="button"
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-1.5 bg-white dark:bg-neutral-900 border border-pink-200 dark:border-neutral-700 text-pink-600 dark:text-pink-400 font-medium rounded-full text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pink-50 dark:hover:bg-neutral-800 transition"
                >
                  Anterior
                </button>
                <span className="text-sm font-bold text-neutral-500">Página {page} de {totalPages}</span>
                <button 
                  type="button"
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-1.5 bg-white dark:bg-neutral-900 border border-pink-200 dark:border-neutral-700 text-pink-600 dark:text-pink-400 font-medium rounded-full text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-pink-50 dark:hover:bg-neutral-800 transition"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </SiteLayout>
  );
}