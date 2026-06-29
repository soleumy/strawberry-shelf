import { supabase } from '../supabase';

export async function saveReadingProgress(userId, novelId, chapterId, position = 0, percent = 0) {
  const { data: existing } = await supabase.from('reading_history').select('id').eq('user_id', userId).eq('novel_id', novelId).maybeSingle();
  if (existing) {
    const { data, error } = await supabase.from('reading_history').update({
      chapter_id: chapterId,
      position,
      percent,
      last_read_at: new Date(),
    }).eq('id', existing.id).select().single();
    return { data, error };
  }
  const { data, error } = await supabase.from('reading_history').insert({
    user_id: userId,
    novel_id: novelId,
    chapter_id: chapterId,
    position,
    percent,
    last_read_at: new Date(),
  }).select().single();
  return { data, error };
}

export async function getReadingProgress(userId, novelId) {
  const { data, error } = await supabase.from('reading_history').select('*').eq('user_id', userId).eq('novel_id', novelId).maybeSingle();
  return { data, error };
}

export async function getReadingHistory(userId, limit = 20) {
  const { data, error } = await supabase.from('reading_history').select('*').eq('user_id', userId).order('last_read_at', { ascending: false }).limit(limit);
  return { data, error };
}

export async function clearReadingHistory(userId, novelId) {
  const { data, error } = await supabase.from('reading_history').delete().eq('user_id', userId).eq('novel_id', novelId);
  return { data, error };
}
