import React, { useMemo, useState } from 'react';
import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { BookOpen, Heart, Search, Sparkles, Star, Wand2 } from 'lucide-react';
import { NOVELS } from './utils/data';
import { AppProvider } from './context/AppContext';
import { NovelDetails } from './pages/NovelDetails';
import { Reader } from './pages/Reader';

const CATEGORIES = ['All', 'Romance', 'Fantasy', 'Villainess', 'Comedy', 'Reincarnation'];

function cleanText(value) {
  return String(value || '')
    .replace(/Ã³/g, 'ó')
    .replace(/Ã­/g, 'í')
    .replace(/Ã©/g, 'é')
    .replace(/Ã¡/g, 'á')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/â€¢/g, '•')
    .replace(/â•¹/g, ':')
    .replace(/ÃƒÂ³/g, 'ó')
    .replace(/ÃƒÂ­/g, 'í')
    .replace(/ÃƒÂ©/g, 'é')
    .replace(/ÃƒÂ¡/g, 'á')
    .replace(/ÃƒÂº/g, 'ú')
    .replace(/ÃƒÂ±/g, 'ñ')
    .trim();
}

function scrollToSection(id) {
  if (id === 'inicio') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function HomePage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNovels = useMemo(() => {
    return NOVELS.filter((novel) => {
      const title = cleanText(novel.title).toLowerCase();
      const author = cleanText(novel.author).toLowerCase();
      const query = searchQuery.toLowerCase();

      return (
        (activeTab === 'All' || novel.tags.includes(activeTab)) &&
        (title.includes(query) || author.includes(query))
      );
    });
  }, [activeTab, searchQuery]);

  const featured = filteredNovels[0] || NOVELS[0];
  const totalChapters = NOVELS.reduce((sum, novel) => sum + Number(novel.chaptersCount || 0), 0);

  return (
    <div className="site-shell min-h-screen overflow-hidden">
      <div className="sparkle-field" />

      <header className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <nav className="nav-bubble">
          <button type="button" className="brand" onClick={() => scrollToSection('inicio')}>
            <span className="brand-mark">🍓</span>
            <span className="brand-title">strawberry shelf</span>
          </button>

          <div className="nav-links">
            <button type="button" className="active" onClick={() => scrollToSection('inicio')}>Inicio</button>
            <button type="button" onClick={() => scrollToSection('catalogo')}>Catálogo</button>
            <button type="button" onClick={() => scrollToSection('servicios')}>Servicios</button>
            <button type="button" onClick={() => scrollToSection('contacto')}>Contacto</button>
          </div>

          <button type="button" className="quote-button" onClick={() => scrollToSection('contacto')}>
            Pedir presupuesto <Heart size={16} fill="currentColor" />
          </button>
        </nav>
      </header>

      <main id="inicio" className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="hero-grid">
          <div className="hero-copy">
            <div className="love-pill">
              <Sparkles size={15} /> Traducciones hechas con amor
            </div>

            <h1>Historias que merecen brillar</h1>

            <p>
              Cada palabra traducida con cariño. Explora una biblioteca dulce y ordenada para tus novelas,
              manhwas y lecturas favoritas.
            </p>

            <div className="hero-actions">
              <button type="button" className="primary-action" onClick={() => scrollToSection('catalogo')}>
                Ver catálogo <BookOpen size={18} />
              </button>
              <span className="soft-note">{NOVELS.length} novelas disponibles</span>
            </div>

            <div className="stats-strip">
              <div><strong>{NOVELS.length}</strong><span>novelas</span></div>
              <div><strong>{totalChapters}</strong><span>capítulos</span></div>
              <div><strong>100%</strong><span>hecho por mí</span></div>
            </div>
          </div>

          <Link to={`/novel/${featured.id}`} className="hero-card">
            <div className="speech-bubble">Cada historia en buenas manos ♡</div>

            <div className="featured-cover-wrap">
              <img src={featured.cover} alt={cleanText(featured.title)} />
            </div>

            <div className="featured-info">
              <span><Star size={14} fill="currentColor" /> Destacada</span>
              <h2>{cleanText(featured.title)}</h2>
              <p>{cleanText(featured.author)} · {featured.chaptersCount} capítulos</p>
            </div>
          </Link>
        </section>

        <section id="servicios" className="service-row">
          {[
            ['Traducción de novelas', 'Textos cuidados para que la historia fluya natural.'],
            ['Manhwa y manga', 'Diálogos claros, expresivos y listos para leer.'],
            ['Corrección y edición', 'Ortografía, estilo y consistencia en cada capítulo.'],
            ['Proyectos personalizados', 'Un espacio bonito para organizar tus traducciones.'],
          ].map(([title, text]) => (
            <article className="service-card" key={title}>
              <Wand2 size={20} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section id="catalogo" className="catalog-panel">
          <div className="catalog-heading">
            <div>
              <span>Índice de novelas</span>
              <h2>Elige tu próxima lectura</h2>
            </div>

            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar novela o autor..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <Search size={18} />
            </div>
          </div>

          <div className="category-tabs">
            {CATEGORIES.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? 'selected' : ''}
              >
                {tab === 'All' ? 'Todo' : tab}
              </button>
            ))}
          </div>

          <div className="novel-grid">
            {filteredNovels.map((novel) => (
              <Link key={novel.id} to={`/novel/${novel.id}`} className="novel-card">
                <div className="cover-frame">
                  <img src={novel.cover} alt={cleanText(novel.title)} loading="lazy" />
                  <span>{novel.chaptersCount} cap.</span>
                </div>

                <div className="novel-body">
                  <h3 title={cleanText(novel.title)}>{cleanText(novel.title)}</h3>
                  <p>{cleanText(novel.author)}</p>

                  <div className="tag-row">
                    {novel.tags.slice(0, 2).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredNovels.length === 0 && (
            <div className="empty-state">No encontré novelas con ese filtro.</div>
          )}
        </section>

        <section id="contacto" className="contact-panel">
          <h2>Contacto</h2>
          <p>Tu historia en buenas manos. Escríbeme para presupuestos o proyectos personalizados.</p>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/novel/:id" element={<NovelDetails />} />
          <Route path="/novel/:novelId/chapter/:chapterId" element={<Reader />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}