import { supabase } from '../supabase';

export async function createActivity({ user_id, type, reference_id = null, metadata = {} }) {
  const { data, error } = await supabase.from('activity').insert({ user_id, type, reference_id, metadata }).select().single();
  return { data, error };
}

export async function getRecentActivity(limit = 50) {
  const { data, error } = await supabase.from('activity').select('*').order('created_at', { ascending: false }).limit(limit);
  return { data, error };
}

export async function getFeedForUser(userId, limit = 50) {
  // fetch following ids
  const { data: following } = await supabase.from('followers').select('following_id').eq('follower_id', userId);
  const ids = (following || []).map((r) => r.following_id).filter(Boolean);
  if (ids.length === 0) {
    return getRecentActivity(limit);
  }
  const { data, error } = await supabase.from('activity').select('*').in('user_id', ids).order('created_at', { ascending: false }).limit(limit);
  return { data, error };
}
