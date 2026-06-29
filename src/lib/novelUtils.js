import { NOVELS } from '../utils/data';

/**
 * Normaliza las novelas locales del archivo estático data.js 
 * para que tengan exactamente la misma estructura de la base de datos.
 */
export function normalizeLocalNovel(novel) {
  if (!novel) return null;
  return {
    id: String(novel.id),
    title: novel.title || 'Sin título',
    synopsis: novel.synopsis || novel.description || '',
    cover_url: novel.cover || '/placeholder-cover.png',
    author: { display_name: novel.author || 'Anónimo', username: 'local' },
    author_name_override: novel.author || null,
    translator: novel.translator || null,
    genres: novel.genres || novel.tags || [],
    tags: novel.tags || [],
    status: novel.status || 'approved',
    language: novel.language || 'es',
    views_count: novel.views || 0,
    created_at: novel.created_at || new Date('2026-01-01').toISOString(),
    chapters: (novel.chapters || []).map((ch, idx) => ({
      id: String(ch.id),
      title: ch.title || `Capítulo ${idx + 1}`,
      chapter_order: idx + 1,
      file_url: ch.file || null,
      file_type: ch.file?.endsWith('.pdf') ? 'pdf' : 'text'
    }))
  };
}

/**
 * Busca de forma segura una novela dentro del archivo local data.js por su ID.
 */
export function findLocalNovel(id) {
  const found = NOVELS.find((n) => String(n.id) === String(id));
  return found ? normalizeLocalNovel(found) : null;
}

/**
 * Mezcla de manera inteligente las novelas que vienen de Supabase con las locales,
 * garantizando que no existan duplicados si comparten el mismo ID.
 */
export function mergeNovels(remoteNovels) {
  const localNormalized = (NOVELS || []).map(normalizeLocalNovel);
  const combined = [...(remoteNovels || [])];

  localNormalized.forEach((local) => {
    if (!combined.some((remote) => String(remote.id) === String(local.id))) {
      combined.push(local);
    }
  });
  return combined;
}

/**
 * Filtro avanzado multicriterio para el buscador (Requisito 21).
 * Soporta búsquedas combinadas de texto, géneros y estados de publicación.
 */
export function filterNovels(novels, filters) {
  return novels.filter((novel) => {
    if (!novel) return false;
    
    // Filtrado por texto (Título, Autor o Traductor)
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matchTitle = novel.title?.toLowerCase().includes(q);
      const matchAuthor = novel.author?.display_name?.toLowerCase().includes(q) || novel.author_name_override?.toLowerCase().includes(q);
      const matchTranslator = novel.translator?.toLowerCase().includes(q);
      if (!matchTitle && !matchAuthor && !matchTranslator) return false;
    }
    
    // Filtros categóricos exactos
    if (filters.genre && !novel.genres?.includes(filters.genre)) return false;
    if (filters.tag && !novel.tags?.includes(filters.tag)) return false;
    if (filters.language && novel.language !== filters.language) return false;
    if (filters.status && novel.status !== filters.status) return false;
    
    return true;
  });
}

/**
 * Ordena las novelas según las preferencias elegidas en el buscador.
 */
export function sortNovels(novels, sortBy) {
  return [...novels].sort((a, b) => {
    if (sortBy === 'A-Z') return a.title.localeCompare(b.title);
    if (sortBy === 'Z-A') return b.title.localeCompare(a.title);
    if (sortBy === 'views') return (b.views_count || 0) - (a.views_count || 0);
    // Por defecto: Más recientes primero
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

/**
 * Segmentación de paginación ligera para el frontend (Requisito 23 y 34).
 */
export function paginate(items, page, perPage) {
  const offset = (page - 1) * perPage;
  const paginatedItems = items.slice(offset, offset + perPage);
  return {
    items: paginatedItems,
    totalPages: Math.ceil(items.length / perPage) || 1
  };
}