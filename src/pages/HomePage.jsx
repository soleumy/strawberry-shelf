import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, LayoutDashboard, LogIn, Search, Sparkles } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { mergeNovels } from '../lib/novelUtils';

function cleanText(value) {
  return String(value || '')
    .replace(/ÃƒÂ¡/g, 'á')
    .replace(/ÃƒÂ©/g, 'é')
    .replace(/ÃƒÂ­/g, 'í')
    .replace(/ÃƒÂ³/g, 'ó')
    .replace(/ÃƒÂº/g, 'ú')
    .replace(/ÃƒÂ±/g, 'ñ')
    .replace(/ÃƒÂ/g, 'Á')
    .replace(/Ãƒâ€°/g, 'É')
    .replace(/ÃƒÂ/g, 'Í')
    .replace(/Ãƒâ€œ/g, 'Ó')
    .replace(/ÃƒÅ¡/g, 'Ú')
    .replace(/Ãƒâ€˜/g, 'Ñ');
}

function getCover(novel) {
  return novel.cover_url || novel.cover || '/placeholder-cover.png';
}

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

function getChaptersCount(novel) {
  if (typeof novel.chapters_count === 'number') return novel.chapters_count;
  if (Array.isArray(novel.chapters)) return novel.chapters.length;
  return novel.chaptersCount || 0;
}

function NovelCard({ novel }) {
  return (
    <Link to={`/novel/${novel.id}`} className="kawaii-novel-card">
      <div className="kawaii-cover">
        <img
          src={getCover(novel)}
          alt={cleanText(novel.title)}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = '/placeholder-cover.png';
          }}
        />
        <span>{getChaptersCount(novel)} caps</span>
      </div>

      <div>
        <h3>{cleanText(novel.title || 'Sin título')}</h3>
        <p>{cleanText(getAuthorName(novel))}</p>
      </div>
    </Link>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [novels, setNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  const perPage = 24;

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  useEffect(() => {
    let active = true;

    async function loadNovels() {
      setLoading(true);

      let remoteNovels = [];

      try {
        if (supabase.isConfigured !== false) {
          const { data: novelsData, error: novelsError } = await supabase
            .from('novels')
            .select('*')
            .order('created_at', { ascending: false });

          if (novelsError) throw novelsError;

          const novelList = novelsData || [];
          const novelIds = novelList.map((novel) => novel.id);
          let chapters = [];

          if (novelIds.length > 0) {
            const { data: chaptersData } = await supabase
              .from('chapters')
              .select('id, novel_id')
              .in('novel_id', novelIds);

            chapters = chaptersData || [];
          }

          remoteNovels = novelList.map((novel) => ({
            ...novel,
            id: String(novel.id),
            chapters_count: chapters.filter((chapter) => String(chapter.novel_id) === String(novel.id)).length,
          }));
        }
      } catch {
        remoteNovels = [];
      }

      if (active) {
        setNovels(mergeNovels(remoteNovels));
        setLoading(false);
      }
    }

    loadNovels();

    return () => {
      active = false;
    };
  }, []);

  const filteredNovels = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!text) return novels;

    return novels.filter((novel) => {
      const title = cleanText(novel.title).toLowerCase();
      const author = cleanText(getAuthorName(novel)).toLowerCase();
      const tags = Array.isArray(novel.tags) ? novel.tags.join(' ').toLowerCase() : '';

      return title.includes(text) || author.includes(text) || tags.includes(text);
    });
  }, [novels, query]);

  const totalPages = Math.max(1, Math.ceil(filteredNovels.length / perPage));

  const paginatedNovels = filteredNovels.slice(
    (page - 1) * perPage,
    page * perPage
  );

  useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <div className="kawaii-page">
      <SEO
        title="Strawberry Shelf"
        description="Traducciones kawaii para historias que merecen brillar."
      />

      <header className="kawaii-header">
        <Link to="/" className="kawaii-logo">
          <span>🍓</span>
          <strong>strawberry<br />shelf</strong>
        </Link>

        <nav className="kawaii-nav">
          <button type="button" className="active" onClick={() => scrollToSection('inicio')}>
            Inicio
          </button>

          <button type="button" onClick={() => scrollToSection('catalogo')}>
            Catálogo
          </button>

          <Link to="/search">Buscar</Link>
          <Link to="/library">Biblioteca</Link>
          <Link to="/dashboard">Mi panel</Link>
        </nav>

        {user ? (
          <Link to="/dashboard" className="kawaii-login-button">
            Mi panel <LayoutDashboard size={16} />
          </Link>
        ) : (
          <Link to="/login" className="kawaii-login-button">
            Iniciar sesión <LogIn size={16} />
          </Link>
        )}
      </header>

      <main id="inicio" className="kawaii-main">
        <section className="kawaii-hero">
          <div className="hero-copy">
            <span className="kawaii-pill">
              <Heart size={15} /> Traducciones hechas con amor
            </span>

            <h1>strawberry shelf</h1>

            <p>
              Traducciones y recopilaciones kawaii para historias que merecen brillar.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="primary-action"
                onClick={() => scrollToSection('catalogo')}
              >
                Ver catálogo <BookOpen size={18} />
              </button>

              <Link to="/search" className="secondary-action">
                Búsqueda avanzada
              </Link>
            </div>

            <div className="kawaii-badges">
              <span>🍓 Lectura cómoda</span>
              <span>🎀 Biblioteca personal</span>
              <span>♡ Hecho con amor</span>
            </div>
          </div>

          <div className="hero-mascots" aria-hidden="true">
            <div className="mascot cat">🎀</div>
            <div className="mascot bear">🍓</div>
            <div className="mascot bunny">♡</div>
            <p>Cada palabra, traducida con cariño ♡</p>
          </div>
        </section>

        <section className="kawaii-services">
          <article>
            <span>🍓</span>
            <h3>Traducciones</h3>
            <p>Catálogo organizado para leer sin perderte.</p>
          </article>

          <article>
            <span>🎀</span>
            <h3>Biblioteca</h3>
            <p>Guarda favoritas y continúa donde quedaste.</p>
          </article>

          <article>
            <span>💌</span>
            <h3>Comunidad</h3>
            <p>Comenta, califica y comparte tus lecturas.</p>
          </article>

          <article>
            <span>✨</span>
            <h3>Lector bonito</h3>
            <p>Un espacio suave, rosado y fácil de leer.</p>
          </article>
        </section>

        <section id="catalogo" className="kawaii-catalog">
          <div className="catalog-title">
            <span><Sparkles size={16} /> Catálogo</span>
            <h2>Elige tu próxima lectura</h2>

            <label className="catalog-search">
              <Search size={17} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar novela..."
              />
            </label>
          </div>

          {loading ? (
            <div className="empty-state">Cargando novelas...</div>
          ) : filteredNovels.length === 0 ? (
            <div className="empty-state">No encontré novelas con esa búsqueda.</div>
          ) : (
            <>
              <div className="catalog-results-bar">
                <h3 className="shelf-title">Todas las novelas</h3>
                <span>{filteredNovels.length} novelas</span>
              </div>

              <div className="kawaii-grid">
                {paginatedNovels.map((novel) => (
                  <NovelCard key={novel.id} novel={novel} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="catalog-pagination">
                  <button
                    type="button"
                    className="secondary-action"
                    disabled={page === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Anterior
                  </button>

                  <span>Página {page} de {totalPages}</span>

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
    </div>
  );
}