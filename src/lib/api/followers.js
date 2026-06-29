import { supabase } from '../supabase';

export async function followUser(followerId, followingId) {
  const { data, error } = await supabase.from('followers').insert({ follower_id: followerId, following_id: followingId }).select().single();
  if (!error) {
    // create activity record
    await supabase.from('activity').insert({ user_id: followerId, type: 'follow', reference_id: followingId, metadata: { following_id: followingId } });
    // notify the followed user
    await supabase.from('notifications').insert({ user_id: followingId, actor_id: followerId, type: 'follow', data: { follower_id: followerId }, is_read: false });
  }
  return { data, error };
}

export async function unfollowUser(followerId, followingId) {
  const { data, error } = await supabase.from('followers').delete().match({ follower_id: followerId, following_id: followingId });
  return { data, error };
}

export async function getFollowers(userId) {
  const { data, error } = await supabase.from('followers').select('follower_id').eq('following_id', userId);
  return { data, error };
}

export async function getFollowing(userId) {
  const { data, error } = await supabase.from('followers').select('following_id').eq('follower_id', userId);
  return { data, error };
}

export async function isFollowing(followerId, followingId) {
  const { data, error } = await supabase.from('followers').select('*').match({ follower_id: followerId, following_id: followingId }).maybeSingle();
  return { data, error };
}
