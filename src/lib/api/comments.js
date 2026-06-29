import { supabase } from '../supabase';

export async function createComment({ novelId, chapterId, userId, content, parentId = null }) {
  const { data, error } = await supabase.from('comments').insert({
    novel_id: novelId,
    chapter_id: chapterId,
    user_id: userId,
    content,
    parent_id: parentId,
  }).select().single();
  return { data, error };
}

export async function getComments(novelId, chapterId = null, limit = 50) {
  let query = supabase.from('comments').select('*').eq('novel_id', novelId);
  if (chapterId) query = query.eq('chapter_id', chapterId);
  else query = query.is('chapter_id', null);
  query = query.order('created_at', { ascending: false }).limit(limit);
  const { data, error } = await query;
  return { data, error };
}

export async function getReplies(parentId) {
  const { data, error } = await supabase.from('comments').select('*').eq('parent_id', parentId).order('created_at', { ascending: true });
  return { data, error };
}

export async function updateComment(commentId, content) {
  const { data, error } = await supabase.from('comments').update({ content, is_edited: true, updated_at: new Date() }).eq('id', commentId).select().single();
  return { data, error };
}

export async function deleteComment(commentId) {
  const { data, error } = await supabase.from('comments').delete().eq('id', commentId);
  return { data, error };
}

export async function reportComment(commentId, reason) {
  const { data, error } = await supabase.from('comments').update({ is_reported: true }).eq('id', commentId);
  return { data, error };
}
