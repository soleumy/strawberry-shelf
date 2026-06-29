import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, Search, Send, Sparkles, Upload, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { AdvancedSearch } from '../components/AdvancedSearch';
import { ContinueReading } from '../components/ContinueReading';
import { UploadNovel } from '../components/UploadNovel';
import { Pagination } from '../components/Pagination';
import { NovelGridSkeleton } from '../components/Skeleton';
import { SEO } from '../components/SEO';
import { WHATSAPP_URL, HOME_SECTIONS, NOVELS_PER_PAGE } from '../lib/constants';
import { mergeNovels, filterNovels, sortNovels, paginate, getLocalNovels } from '../lib/novelUtils';

function scrollToSection(id) {
  if (id === 'inicio') window.scrollTo({ top: 0, behavior: 'smooth' });
  else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function AuthBox() {
  const { session, profile, refresh } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (result.data?.user) {
      await supabase.from('profiles').upsert({
        id: result.data.user.id,
        email: result.data.user.email,
        display_name: result.data.user.email?.split('@')[0] || 'Lector',
        username: result.data.user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') || null,
      });
    }

    setMessage(mode === 'login' ? 'Sesión iniciada.' : 'Cuenta creada.');
    refresh();
  }

  async function logout() {
    await supabase.auth.signOut();
    refresh();
  }

  if (session) {
    return (
      <div className="auth-card">
        <span className="section-pill"><UserRound size={16} /> Sesión activa</span>
        <h3>{session.user.email}</h3>
        <p>{profile?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
        <Link to="/dashboard" className="secondary-action">Mi Panel</Link>
        <button type="button" className="secondary-action" onClick={logout}>Cerrar sesión</button>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <span className="section-pill">Iniciar sesión</span>
      <label>Correo<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
      <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></label>
      <button type="submit" className="primary-action">{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
      <button type="button" className="text-button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
      </button>
      {message && <p className="form-message">{message}</p>}
    </form>
  );
}

function NovelCard({ novel }) {
  return (
    <Link to={`/novel/${novel.id}`} className="novel-card hover-float">
      <div className="cover-frame">
        <img src={novel.cover_url || novel.cover || '/placeholder-cover.png'} alt={novel.title} loading="lazy" />
        <span>{novel.chapters?.length || 1} cap.</span>
      </div>
      <div className="novel-body">
        <h3>{novel.title}</h3>
        <p>{novel.author || 'Sin autor'}</p>
        {(novel.genres || novel.tags)?.length > 0 && (
          <div className="tag-row">
            {(novel.genres || novel.tags).slice(0, 2).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function CatalogSection({ title, novels }) {
  if (!novels.length) return null;

  return (
    <section className="catalog-section fade-in">
      <h3>{title}</h3>
      <div className="novel-grid novel-grid-scroll">
        {novels.slice(0, 8).map((novel) => (
          <NovelCard key={novel.id} novel={novel} />
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const { profile } = useAuth();
  const [novels, setNovels] = useState(getLocalNovels());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ query: '', sort: 'recent' });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('sections');

  useEffect(() => {
    async function loadNovels() {
      const { data, error } = await supabase
        .from('novels')
        .select('*, chapters(*)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (!error) setNovels(mergeNovels(data || []));
      setLoading(false);
    }

    loadNovels();
  }, []);

  const filtered = useMemo(() => {
    const result = filterNovels(novels, filters);
    return sortNovels(result, filters.sort);
  }, [novels, filters]);

  const paginated = useMemo(() => paginate(filtered, page, NOVELS_PER_PAGE), [filtered, page]);

  const sectionNovels = useMemo(() => {
    const today = new Date().toDateString();

    return HOME_SECTIONS.reduce((acc, section) => {
      if (section.genre) {
        acc[section.id] = sortNovels(filterNovels(novels, { genre: section.genre }), 'recent');
      } else if (section.filter === 'updated_today') {
        acc[section.id] = novels.filter((n) => n.updated_at && new Date(n.updated_at).toDateString() === today);
      } else if (section.filter === 'views') {
        acc[section.id] = sortNovels(novels, 'views');
      } else if (section.filter === 'favorites') {
        acc[section.id] = sortNovels(novels, 'favorites');
      } else if (section.filter === 'rating') {
        acc[section.id] = sortNovels(novels, 'rating');
      } else {
        acc[section.id] = sortNovels(novels, 'recent');
      }
      return acc;
    }, {});
  }, [novels]);

  const featured = filtered[0];
  const hasActiveSearch = filters.query || filters.author || filters.genre || filters.tag;

  return (
    <div className="site-shell min-h-screen overflow-hidden">
      <SEO />
      <div className="sparkle-field" />

      <header className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <nav className="nav-bubble">
          <button type="button" className="brand" onClick={() => scrollToSection('inicio')}>
            <span className="brand-mark">🍓</span>
            <span className="brand-title">strawberry shelf</span>
          </button>

          <div className="nav-links">
            <button type="button" className="active" onClick={() => scrollToSection('inicio')}>Inicio</button>
            <button type="button" onClick={() => scrollToSection('sobre-mi')}>Sobre mí</button>
            <button type="button" onClick={() => scrollToSection('catalogo')}>Catálogo</button>
            <button type="button" onClick={() => scrollToSection('subir-novela')}>Subir novela</button>
            {profile?.role === 'admin' && <Link to="/admin">Admin</Link>}
            <Link to="/dashboard">Mi Panel</Link>
            <Link to="/library">Biblioteca</Link>
          </div>

          <a className="quote-button" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Contáctame <Heart size={16} fill="currentColor" />
          </a>
        </nav>
      </header>

      <main id="inicio" className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <section className="hero-grid">
          <div className="hero-copy">
            <div className="love-pill"><Sparkles size={15} /> Novelas recopiladas</div>
            <h1>Historias que merecen brillar</h1>
            <p>Soy Uriel. Las traducciones son recompiladas de otras personas en PDF o texto.</p>
            <div className="hero-actions">
              <button type="button" className="primary-action" onClick={() => scrollToSection('catalogo')}>
                Ver catálogo <BookOpen size={18} />
              </button>
            </div>
            <div className="stats-strip">
              <div><strong>{novels.length}</strong><span>novelas</span></div>
              <div><strong>PDF</strong><span>y texto</span></div>
              <div><strong>♥</strong><span>comunidad</span></div>
            </div>
          </div>

          {featured && (
            <Link to={`/novel/${featured.id}`} className="hero-card hover-float">
              <div className="speech-bubble">Cada historia en buenas manos ♡</div>
              <div className="featured-cover-wrap">
                <img src={featured.cover_url || featured.cover || '/placeholder-cover.png'} alt={featured.title} />
              </div>
              <div className="featured-info">
                <span>★ Destacada</span>
                <h2>{featured.title}</h2>
                <p>{featured.author || 'Sin autor'}</p>
              </div>
            </Link>
          )}
        </section>

        <ContinueReading className="continue-reading-banner" />

        <section id="sobre-mi" className="about-panel">
          <div className="about-photo"><img src="/about/uriel.jpg" alt="Foto de Uriel" /></div>
          <div className="about-content">
            <span className="section-pill"><UserRound size={16} /> Sobre mí</span>
            <h2>Hola, soy Uriel</h2>
            <p>Esta página reúne novelas traducidas y recompiladas por otras personas.</p>
            <a className="primary-action" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Contáctame <Send size={18} />
            </a>
          </div>
        </section>

        <section id="catalogo" className="catalog-panel">
          <div className="catalog-heading">
            <div>
              <span>Índice de novelas</span>
              <h2>Elige tu próxima lectura</h2>
            </div>
            <AdvancedSearch onSearch={(f) => { setFilters(f); setPage(1); setViewMode(f.query || f.genre ? 'search' : 'sections'); }} />
          </div>

          <div className="view-toggle">
            <button type="button" className={viewMode === 'sections' ? 'active' : ''} onClick={() => setViewMode('sections')}>
              Secciones
            </button>
            <button type="button" className={viewMode === 'search' ? 'active' : ''} onClick={() => setViewMode('search')}>
              <Search size={16} /> Buscar
            </button>
          </div>

          {loading && <NovelGridSkeleton count={8} />}

          {!loading && viewMode === 'sections' && !hasActiveSearch && (
            <div className="catalog-sections">
              {HOME_SECTIONS.map((section) => (
                <CatalogSection key={section.id} title={section.label} novels={sectionNovels[section.id] || []} />
              ))}
            </div>
          )}

          {!loading && (viewMode === 'search' || hasActiveSearch) && (
            <>
              <div className="novel-grid">
                {paginated.items.map((novel) => (
                  <NovelCard key={novel.id} novel={novel} />
                ))}
              </div>
              {paginated.items.length === 0 && <div className="empty-state">No se encontraron novelas.</div>}
              <Pagination page={page} totalPages={paginated.totalPages} onPageChange={setPage} />
            </>
          )}
        </section>

        <section id="subir-novela" className="upload-panel">
          <div className="upload-copy">
            <span className="section-pill"><Upload size={16} /> Comunidad</span>
            <h2>Sube tu novela traducida</h2>
            <p>Inicia sesión y sube tu contenido. Quedará pendiente hasta aprobación.</p>
          </div>
          <div className="upload-stack">
            <AuthBox />
            <UploadNovel />
          </div>
        </section>
      </main>
    </div>
  );
}
