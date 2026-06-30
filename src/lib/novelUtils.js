import { NOVELS } from '../utils/data';

function normalizeStatus(status) {
  const value = String(status || 'approved').toLowerCase().trim();

  if (value === 'completed' || value === 'complete' || value === 'terminada') return 'completed';
  if (value === 'paused' || value === 'pause' || value === 'en pausa') return 'paused';
  if (value === 'cancelled' || value === 'canceled' || value === 'cancelada') return 'cancelled';
  if (value === 'draft' || value === 'borrador') return 'draft';
  if (value === 'pending' || value === 'pendiente') return 'pending';
  if (value === 'approved' || value === 'publicada') return 'approved';

  return 'approved';
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [value];
}

export function normalizeLocalNovel(novel) {
  if (!novel) return null;

  return {
    id: String(novel.id),
    title: novel.title || 'Sin titulo',
    synopsis: novel.synopsis || novel.description || '',
    cover_url: novel.cover_url || novel.cover || '/placeholder-cover.png',
    author: novel.author && typeof novel.author === 'object'
      ? novel.author
      : { display_name: novel.author || novel.author_name_override || 'Anonimo', username: 'local' },
    author_name_override: novel.author_name_override || (typeof novel.author === 'string' ? novel.author : null),
    translator: novel.translator || null,
    genres: toArray(novel.genres || novel.tags),
    tags: toArray(novel.tags || novel.genres),
    status: normalizeStatus(novel.status),
    language: novel.language || 'es',
    views_count: Number(novel.views_count || novel.views || 0),
    created_at: novel.created_at || new Date('2026-01-01').toISOString(),
    chapters: toArray(novel.chapters).map((ch, idx) => ({
      id: String(ch.id || idx + 1),
      title: ch.title || `Capitulo ${idx + 1}`,
      chapter_order: Number(ch.chapter_order || idx + 1),
      file_url: ch.file_url || ch.file || null,
      file_type: ch.file_type || (String(ch.file || ch.file_url || '').endsWith('.pdf') ? 'pdf' : 'text'),
      content: ch.content || '',
    })),
  };
}

export function findLocalNovel(id) {
  const found = NOVELS.find((novel) => String(novel.id) === String(id));
  return found ? normalizeLocalNovel(found) : null;
}

export function mergeNovels(remoteNovels = []) {
  const combined = new Map();

  toArray(remoteNovels).forEach((novel) => {
    const normalized = normalizeLocalNovel(novel);
    if (normalized?.id) combined.set(normalized.id, normalized);
  });

  toArray(NOVELS).forEach((novel) => {
    const normalized = normalizeLocalNovel(novel);
    if (normalized?.id && !combined.has(normalized.id)) {
      combined.set(normalized.id, normalized);
    }
  });

  return [...combined.values()];
}

export function filterNovels(novels, filters = {}) {
  return toArray(novels).filter((novel) => {
    if (!novel) return false;

    const query = String(filters.query || '').toLowerCase().trim();

    if (query) {
      const title = String(novel.title || '').toLowerCase();
      const author = String(novel.author?.display_name || novel.author?.username || novel.author_name_override || '').toLowerCase();
      const translator = String(novel.translator || '').toLowerCase();

      if (!title.includes(query) && !author.includes(query) && !translator.includes(query)) {
        return false;
      }
    }

    if (filters.genre) {
      const genres = toArray(novel.genres || novel.tags).map((item) => String(item).toLowerCase());
      if (!genres.includes(String(filters.genre).toLowerCase())) return false;
    }

    if (filters.tag) {
      const tags = toArray(novel.tags).map((item) => String(item).toLowerCase());
      if (!tags.includes(String(filters.tag).toLowerCase())) return false;
    }

    if (filters.language && novel.language !== filters.language) return false;
    if (filters.status && normalizeStatus(novel.status) !== normalizeStatus(filters.status)) return false;

    return true;
  });
}

export function sortNovels(novels, sortBy = 'recent') {
  return [...toArray(novels)].sort((a, b) => {
    const titleA = String(a?.title || '');
    const titleB = String(b?.title || '');

    if (sortBy === 'A-Z') return titleA.localeCompare(titleB);
    if (sortBy === 'Z-A') return titleB.localeCompare(titleA);
    if (sortBy === 'views') return Number(b?.views_count || 0) - Number(a?.views_count || 0);

    return new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime();
  });
}

export function paginate(items, page, perPage) {
  const safeItems = toArray(items);
  const safePage = Math.max(1, Number(page || 1));
  const offset = (safePage - 1) * perPage;

  return {
    items: safeItems.slice(offset, offset + perPage),
    totalPages: Math.ceil(safeItems.length / perPage) || 1,
  };
}