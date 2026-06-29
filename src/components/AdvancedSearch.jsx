import React, { useState } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { GENRES, TAGS, LANGUAGES, SORT_OPTIONS, NOVEL_STATUSES } from '../lib/constants';

export function AdvancedSearch({ onSearch, initialFilters = {} }) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({
    query: initialFilters.query || '',
    author: '',
    translator: '',
    genre: '',
    tag: '',
    status: '',
    language: '',
    sort: 'recent',
    ...initialFilters,
  });

  function update(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function apply(event) {
    event?.preventDefault();
    onSearch(filters);
  }

  function reset() {
    const clean = { query: '', author: '', translator: '', genre: '', tag: '', status: '', language: '', sort: 'recent' };
    setFilters(clean);
    onSearch(clean);
  }

  return (
    <div className="advanced-search">
      <form className="search-box" onSubmit={apply}>
        <input
          value={filters.query}
          onChange={(e) => update('query', e.target.value)}
          placeholder="Buscar título, autor..."
        />
        <button type="submit" aria-label="Buscar"><Search size={18} /></button>
        <button type="button" className="filter-toggle" onClick={() => setOpen(!open)} aria-label="Filtros">
          <Filter size={18} />
        </button>
      </form>

      {open && (
        <div className="search-filters fade-in">
          <div className="filter-grid">
            <label>
              Autor
              <input value={filters.author} onChange={(e) => update('author', e.target.value)} />
            </label>
            <label>
              Traductor
              <input value={filters.translator} onChange={(e) => update('translator', e.target.value)} />
            </label>
            <label>
              Género
              <select value={filters.genre} onChange={(e) => update('genre', e.target.value)}>
                <option value="">Todos</option>
                {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>
            <label>
              Etiqueta
              <select value={filters.tag} onChange={(e) => update('tag', e.target.value)}>
                <option value="">Todas</option>
                {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              Estado
              <select value={filters.status} onChange={(e) => update('status', e.target.value)}>
                <option value="">Todos</option>
                {Object.entries(NOVEL_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>
              Idioma
              <select value={filters.language} onChange={(e) => update('language', e.target.value)}>
                <option value="">Todos</option>
                {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </label>
            <label>
              Ordenar
              <select value={filters.sort} onChange={(e) => update('sort', e.target.value)}>
                {SORT_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>

          <div className="filter-actions">
            <button type="button" className="primary-action" onClick={apply}>Aplicar filtros</button>
            <button type="button" className="text-button" onClick={reset}><X size={16} /> Limpiar</button>
          </div>
        </div>
      )}
    </div>
  );
}
