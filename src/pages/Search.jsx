import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { filterNovels, mergeNovels, paginate, sortNovels } from '../lib/novelUtils';
import { SiteLayout } from '../components/SiteLayout';

const GENRES = ['Romance', 'Accion', 'Fantasia', 'Drama', 'Comedia', 'Terror', 'Aventura', 'Misterio', 'Sci-Fi', 'Historico', 'BL', 'GL'];

const STATUSES = [
  { value: 'approved', label: 'Publicada' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'paused', label: 'En pausa' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
];

function getAuthorName(novel) {
  if (novel?.author && typeof novel.author === 'object') {
    return novel.author.display_name || novel.author.username || 'Comunidad';
  }

  return novel?.author_name ||
    novel?.author_name_override ||
    novel?.author ||
    novel?.translator ||
    'Comunidad';
}

function NovelCard({ novel }) {
  return (
    <Link to={`/novel/${novel.id}`} className="kawaii-novel-card">
      <div className="kawaii-cover">
        <img
          src={novel.cover_url || novel.cover || '/placeholder-cover.png'}
          alt={novel.title || 'Novela'}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = '/placeholder-cover.png';
          }}
        />
        <span>{novel.chapters_count || novel.chapters?.length || 0} caps</span>
      </div>

      <div>
        <h3>{novel.title || 'Sin título'}</h3>
        <p>{getAuthorName(novel)}</p>
      </div>
    </Link>
  );
}

export default function SearchPage() {
  const [allNovels, setAllNovels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setMessage('');

      let remoteNovels = [];

      try {
        if (supabase.isConfigured !== false) {
          const { data: novelsData, error: novelsError } = await supabase
            .from('novels')
            .select('*')
            .order('created_at', { ascending: false });

          if (novelsError) throw novelsError;

          const novels = novelsData || [];
          const novelIds = novels.map((novel) => novel.id);
          let chapters = [];

          if (novelIds.length > 0) {
            const { data: chaptersData, error: chaptersError } = await supabase
              .from('chapters')
              .select('id, novel_id')
              .in('novel_id', novelIds);

            if (!chaptersError) {
              chapters = chaptersData || [];
            }
          }

          remoteNovels = novels.map((novel) => ({
            ...novel,
            id: String(novel.id),
            chapters_count: chapters.filter((chapter) => String(chapter.novel_id) === String(novel.id)).length,
          }));
        }
      } catch (error) {
        setMessage(error.message);
        remoteNovels = [];
      }

      if (active) {
        setAllNovels(mergeNovels(remoteNovels));
        setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const result = filterNovels(allNovels, { query, genre, status });
    return sortNovels(result, sortBy);
  }, [allNovels, query, genre, status, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [query, genre, status, sortBy]);

  const { items: paginatedItems, totalPages } = paginate(filtered, page, 12);

  return (
    <SiteLayout>
      <main className="search-page kawaii-main">
        <section className="kawaii-catalog search-catalog-panel">
          <div className="catalog-title search-title">
            <span><Sparkles size={16} /> Catálogo</span>
            <h1>Busca tu próxima lectura</h1>
            <p>Filtra por título, autora, género o estado sin salir de la estantería.</p>
          </div>

          <div className="search-toolbar">
            <label className="search-input-pill">
              <SearchIcon size={18} />
              <input
                type="search"
                placeholder="Buscar por título, autora o traductora..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="secondary-action filter-mobile-button"
              onClick={() => setShowFilters((open) => !open)}
            >
              <SlidersHorizontal size={17} /> Filtros
            </button>
          </div>

          <div className={`search-filters ${showFilters ? 'open' : ''}`}>
            <label>
              Género
              <select value={genre} onChange={(event) => setGenre(event.target.value)}>
                <option value="">Todos</option>
                {GENRES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            <label>
              Estado
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">Cualquier estado</option>
                {STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            <label>
              Orden
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="recent">Más recientes</option>
                <option value="A-Z">A - Z</option>
                <option value="Z-A">Z - A</option>
                <option value="views">Más vistas</option>
              </select>
            </label>
          </div>

          {message && <p className="form-message">{message}</p>}

          {loading ? (
            <div className="empty-state">Buscando en la estantería...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No encontré novelas con esos filtros.</div>
          ) : (
            <>
              <p className="search-count">{filtered.length} novelas encontradas</p>

              <div className="kawaii-grid">
                {paginatedItems.map((novel) => <NovelCard key={novel.id} novel={novel} />)}
              </div>

              {totalPages > 1 && (
                <div className="pagination strawberry-pagination">
                  <button
                    type="button"
                    className="secondary-action"
                    disabled={page === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Anterior
                  </button>

                  <span className="pagination-info">Página {page} de {totalPages}</span>

                  <button
                    type="button"
                    className="secondary-action"
                    disabled={page === totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </SiteLayout>
  );
}