import { supabase } from '../supabase';

export async function rateNovel(userId, novelId, score) {
  // Check if user already rated
  const { data: existing } = await supabase.from('ratings').select('id').eq('user_id', userId).eq('novel_id', novelId).maybeSingle();
  if (existing) {
    return updateRating(existing.id, score);
  }
  const { data, error } = await supabase.from('ratings').insert({ user_id: userId, novel_id: novelId, score }).select().single();
  return { data, error };
}

export async function updateRating(ratingId, score) {
  const { data, error } = await supabase.from('ratings').update({ score, created_at: new Date() }).eq('id', ratingId).select().single();
  return { data, error };
}

export async function removeRating(userId, novelId) {
  const { data, error } = await supabase.from('ratings').delete().eq('user_id', userId).eq('novel_id', novelId);
  return { data, error };
}

export async function getAverageRating(novelId) {
  const { data, error } = await supabase.from('ratings').select('score').eq('novel_id', novelId);
  if (error || !data || data.length === 0) return { average: 0, count: 0, error };
  const sum = data.reduce((a, b) => a + b.score, 0);
  const average = (sum / data.length).toFixed(2);
  return { average: parseFloat(average), count: data.length, error };
}

export async function getUserRating(userId, novelId) {
  const { data, error } = await supabase.from('ratings').select('score').eq('user_id', userId).eq('novel_id', novelId).maybeSingle();
  return { data, error };
}

export async function rateChapter(userId, chapterId, score) {
  const { data: existing } = await supabase.from('ratings').select('id').eq('user_id', userId).eq('chapter_id', chapterId).maybeSingle();
  if (existing) {
    return updateRating(existing.id, score);
  }
  const { data, error } = await supabase.from('ratings').insert({ user_id: userId, chapter_id: chapterId, score }).select().single();
  return { data, error };
}
