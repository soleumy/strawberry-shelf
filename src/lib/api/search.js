import { supabase } from '../supabase';

export async function searchNovels(query, filters = {}) {
  let dbQuery = supabase.from('novels').select('*');
  
  // Text search
  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }
  
  // Filter by author
  if (filters.authorId) {
    dbQuery = dbQuery.eq('created_by', filters.authorId);
  }
  
  // Filter by genres
  if (filters.genres && filters.genres.length > 0) {
    dbQuery = dbQuery.contains('genres', filters.genres);
  }
  
  // Filter by language
  if (filters.language) {
    dbQuery = dbQuery.eq('language', filters.language);
  }
  
  // Filter by status
  if (filters.status) {
    dbQuery = dbQuery.eq('status', filters.status);
  }
  
  // Sort
  const sortBy = filters.sortBy || 'created_at';
  const ascending = filters.ascending !== false;
  dbQuery = dbQuery.order(sortBy, { ascending });
  
  // Pagination
  const limit = filters.limit || 20;
  const offset = filters.offset || 0;
  dbQuery = dbQuery.range(offset, offset + limit - 1);
  
  const { data, error, count } = await dbQuery;
  return { data, error, count };
}

export async function searchProfiles(query, limit = 20) {
  const { data, error } = await supabase.from('profiles').select('*').or(`username.ilike.%${query}%,display_name.ilike.%${query}%`).limit(limit);
  return { data, error };
}

export async function getNovelsWithRatings(limit = 20, offset = 0) {
  const { data, error } = await supabase.from('novels').select('*').order('average_rating', { ascending: false }).range(offset, offset + limit - 1);
  return { data, error };
}

export async function getTrendingNovels(daysBack = 7, limit = 20) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const { data, error } = await supabase.from('novels').select('*').gte('updated_at', cutoffDate.toISOString()).order('views', { ascending: false }).limit(limit);
  return { data, error };
}

export async function getNovelsByGenre(genre, limit = 20, offset = 0) {
  const { data, error } = await supabase.from('novels').select('*').contains('genres', [genre]).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  return { data, error };
}
