import { supabase } from '../supabase';

/**
 * Get profile by id
 * @param {string} id
 */
export async function getProfile(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return { data, error };
}

export async function getProfileByUsername(username) {
  const { data, error } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle();
  return { data, error };
}

/**
 * Upsert profile. `profile` must include `id` (auth user id).
 */
export async function upsertProfile(profile) {
  const { data, error } = await supabase.from('profiles').upsert(profile, { returning: 'representation' });
  return { data, error };
}

export async function searchProfiles(query, limit = 10) {
  if (!query) return { data: [], error: null };
  const q = query.toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio')
    .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
    .limit(limit);
  return { data, error };
}

/**
 * Ensure a profile row exists for an authenticated user.
 * Call this after signup/login with the auth user object.
 */
export async function ensureProfileForUser(user, extra = {}) {
  if (!user || !user.id) return { data: null, error: new Error('Invalid user') };
  const fallback = {
    id: user.id,
    username: user.user_metadata?.username || `user_${user.id.substring(0,8)}`,
    full_name: user.user_metadata?.full_name || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    ...extra,
  };
  const { data, error } = await supabase.from('profiles').upsert(fallback, { returning: 'representation' });
  return { data, error };
}
