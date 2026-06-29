import { supabase } from '../supabase';

export async function createNovel(novel) {
  const { data, error } = await supabase.from('novels').insert(novel).select().single();
  return { data, error };
}

export async function updateNovel(id, changes) {
  const { data, error } = await supabase.from('novels').update(changes).eq('id', id).select().single();
  return { data, error };
}

export async function getNovel(id) {
  const { data, error } = await supabase.from('novels').select('*, chapters(*)').eq('id', id).maybeSingle();
  return { data, error };
}

export async function listNovels({ limit = 20, offset = 0, order = 'desc', orderBy = 'published_at' } = {}) {
  const { data, error } = await supabase.from('novels').select('*').order(orderBy, { ascending: order === 'asc' }).range(offset, offset + limit - 1);
  return { data, error };
}

// Chapters
export async function createChapter(chapter) {
  const { data, error } = await supabase.from('chapters').insert(chapter).select().single();
  return { data, error };
}

export async function updateChapter(id, changes) {
  const { data, error } = await supabase.from('chapters').update(changes).eq('id', id).select().single();
  return { data, error };
}

export async function deleteChapter(id) {
  const { data, error } = await supabase.from('chapters').delete().eq('id', id);
  return { data, error };
}

export async function reorderChapters(updates = []) {
  // updates: [{ id, chapter_index }, ...]
  const results = [];
  for (const u of updates) {
    // eslint-disable-next-line no-await-in-loop
    const res = await supabase.from('chapters').update({ chapter_order: u.chapter_order ?? u.chapter_index }).eq('id', u.id);
    results.push(res);
  }
  return results;
}

export async function getChaptersByNovel(novelId) {
  const { data, error } = await supabase.from('chapters').select('*').eq('novel_id', novelId).order('chapter_order', { ascending: true });
  return { data, error };
}
