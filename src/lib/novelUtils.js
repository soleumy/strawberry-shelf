import { NOVELS } from '../utils/data';
import { supabase } from './supabase';

export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

export function safeFileName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase();
}

export function getFileType(file) {
  if (!file) return 'text';
  return file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'text';
}

export function normalizeLocalNovel(novel) {
  return {
    ...novel,
    id: String(novel.id),
    status: 'approved',
    cover_url: novel.cover,
    source_type: 'text',
    created_at: null,
    genres: novel.tags || [],
    tags: novel.tags || [],
    language: 'es',
    view_count: 0,
    chapters: (novel.chapters || []).map((chapter, index) => ({
      ...chapter,
      id: String(chapter.id),
      title: chapter.title || `Capítulo ${index + 1}`,
      chapter_order: index + 1,
      content: null,
      file_url: chapter.file,
      file_type: 'text',
      is_draft: false,
    })),
  };
}

const LOCAL_NOVELS = NOVELS.map(normalizeLocalNovel);

export function getLocalNovels() {
  return LOCAL_NOVELS;
}

export function findLocalNovel(id) {
  return LOCAL_NOVELS.find((novel) => novel.id === String(id));
}

export function mergeNovels(remoteNovels = []) {
  const normalizedRemote = remoteNovels.map((novel) => ({
    ...novel,
    id: String(novel.id),
    chapters: novel.chapters || [],
    genres: novel.genres || [],
    tags: novel.tags || novel.genres || [],
  }));

  const remoteIds = new Set(normalizedRemote.map((novel) => novel.id));
  const localOnly = LOCAL_NOVELS.filter((novel) => !remoteIds.has(novel.id));

  return [...normalizedRemote, ...localOnly];
}

export function getNovelAuthorName(novel) {
  if (!novel) return 'Sin autor';
  if (typeof novel.author === 'string' && novel.author.trim()) return novel.author;

  const candidate = novel.author && typeof novel.author === 'object'
    ? novel.author
    : novel.author_profile || novel.author_info || null;

  if (candidate) {
    return candidate.full_name?.trim() || candidate.display_name?.trim() || candidate.username?.trim() || 'Sin autor';
  }

  if (novel.author_id) {
    return novel.author_id;
  }

  return 'Sin autor';
}

export async function enrichNovelAuthors(novels = []) {
  const rows = Array.isArray(novels) ? novels : [novels];
  const ids = [...new Set(rows
    .filter((novel) => novel && !novel.author && novel.author_id)
    .map((novel) => novel.author_id))];

  if (!ids.length) return rows;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .in('id', ids);

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));

  return rows.map((novel) => {
    if (!novel) return novel;
    if (typeof novel.author === 'string' && novel.author.trim()) return novel;

    const profile = profileMap.get(novel.author_id);
    if (!profile) return novel;

    return {
      ...novel,
      author: profile.full_name || profile.username || novel.author || 'Sin autor',
    };
  });
}

export function sortNovels(novels, sortBy) {
  const list = [...novels];

  switch (sortBy) {
    case 'oldest':
      return list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    case 'az':
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'za':
      return list.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    case 'views':
      return list.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    case 'rating':
      return list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    case 'favorites':
      return list.sort((a, b) => (b.favorite_count || 0) - (a.favorite_count || 0));
    case 'recent':
    default:
      return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }
}

export function filterNovels(novels, filters = {}) {
  const query = (filters.query || '').toLowerCase();

  return novels.filter((novel) => {
    if (query) {
      const haystack = `${novel.title} ${novel.author} ${novel.translator || ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filters.author && !(novel.author || '').toLowerCase().includes(filters.author.toLowerCase())) {
      return false;
    }

    if (filters.translator && !(novel.translator || '').toLowerCase().includes(filters.translator.toLowerCase())) {
      return false;
    }

    if (filters.genre) {
      const genres = [...(novel.genres || []), ...(novel.tags || [])];
      if (!genres.some((g) => g.toLowerCase() === filters.genre.toLowerCase())) return false;
    }

    if (filters.tag) {
      const tags = novel.tags || novel.genres || [];
      if (!tags.some((t) => t.toLowerCase() === filters.tag.toLowerCase())) return false;
    }

    if (filters.status && novel.status !== filters.status && novel.publication_status !== filters.status) {
      return false;
    }

    if (filters.language && novel.language !== filters.language) return false;

    return true;
  });
}

export function paginate(items, page, perPage) {
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    totalPages: Math.ceil(items.length / perPage),
    total: items.length,
    page,
  };
}
