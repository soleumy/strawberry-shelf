import { supabase } from '../supabase';

export async function addFavorite(userId, novelId) {
  const { data, error } = await supabase.from('favorites').insert({ user_id: userId, novel_id: novelId }).select().single();
  return { data, error };
}

export async function removeFavorite(userId, novelId) {
  const { data, error } = await supabase.from('favorites').delete().match({ user_id: userId, novel_id: novelId });
  return { data, error };
}

export async function isFavorited(userId, novelId) {
  const { data, error } = await supabase.from('favorites').select('*').match({ user_id: userId, novel_id: novelId }).maybeSingle();
  return { data, error };
}

export async function setReadingStatus(userId, novelId, status) {
  const { data, error } = await supabase.from('reading_list').upsert({ user_id: userId, novel_id: novelId, status }).select().single();
  return { data, error };
}

export async function getReadingList(userId) {
  const { data, error } = await supabase.from('reading_list').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  return { data, error };
}
