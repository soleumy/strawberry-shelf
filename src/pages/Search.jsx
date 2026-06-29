import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { searchNovels, getNovelsWithRatings, getTrendingNovels, getNovelsByGenre } from '../lib/api/search';
import { Link } from 'react-router-dom';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ language: '', status: 'approved', sortBy: 'created_at' });
  const [view, setView] = useState('results'); // results, trending, top-rated

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setView('results');
    const { data } = await searchNovels(query, { ...filters, status: 'approved' });
    setResults(data || []);
    setLoading(false);
  }

  async function loadTrending() {
    setLoading(true);
    setView('trending');
    const { data } = await getTrendingNovels(7, 50);
    setResults(data || []);
    setLoading(false);
  }

  async function loadTopRated() {
    setLoading(true);
    setView('top-rated');
    const { data } = await getNovelsWithRatings(50);
    setResults(data || []);
    setLoading(false);
  }

  return (
    <main className="detail-page">
      <section className="reader-card">
        <p className="reader-novel">Búsqueda</p>
        <h1>Explorar novelas</h1>

        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Buscar por título, autor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="primary-action"><Search size={17} /></button>
            <button type="button" className="secondary-action" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={17} /> Filtros
            </button>
          </div>

          {showFilters && (
            <div className="filter-panel">
              <label>Idioma
                <select value={filters.language} onChange={(e) => setFilters({ ...filters, language: e.target.value })}>
                  <option value="">Todos</option>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="pt">Portugués</option>
                </select>
              </label>
              <label>Ordenar por
                <select value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}>
                  <option value="created_at">Más reciente</option>
                  <option value="views">Más leído</option>
                  <option value="average_rating">Mejor calificado</option>
                </select>
              </label>
            </div>
          )}
        </form>

        <div className="search-tabs">
          <button className={view === 'results' ? 'active' : ''} onClick={() => setView('results')}>Resultados de búsqueda</button>
          <button onClick={loadTrending}>Tendencias</button>
          <button onClick={loadTopRated}>Mejor calificados</button>
        </div>

        {loading && <p>Buscando...</p>}

        {!loading && results.length === 0 && <div className="empty-state">No se encontraron resultados.</div>}

        <div className="novel-grid">
          {results.map((novel) => (
            <Link key={novel.id} to={`/novel/${novel.id}`} className="novel-card">
              <div className="cover-frame">
                <img src={novel.cover_url || '/placeholder-cover.png'} alt={novel.title} loading="lazy" />
              </div>
              <div className="novel-body">
                <h3>{novel.title}</h3>
                <p>{novel.author || 'Sin autor'}</p>
                {novel.average_rating > 0 && <span className="rating">⭐ {novel.average_rating}</span>}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
