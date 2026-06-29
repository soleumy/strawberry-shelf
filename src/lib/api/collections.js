import { supabase } from '../supabase';

export async function createCollection(payload) {
  const { data, error } = await supabase.from('collections').insert(payload).select().single();
  return { data, error };
}

export async function updateCollection(id, changes) {
  const { data, error } = await supabase.from('collections').update(changes).eq('id', id).select().single();
  return { data, error };
}

export async function deleteCollection(id) {
  const { data, error } = await supabase.from('collections').delete().eq('id', id);
  return { data, error };
}

export async function getCollection(id) {
  const { data, error } = await supabase.from('collections').select('*').eq('id', id).maybeSingle();
  return { data, error };
}

export async function listUserCollections(userId) {
  const { data, error } = await supabase.from('collections').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
  return { data, error };
}

export async function addItemToCollection(collectionId, novelId) {
  const { data, error } = await supabase.from('collection_items').insert({ collection_id: collectionId, novel_id: novelId }).select().single();
  return { data, error };
}

export async function removeItemFromCollection(collectionId, novelId) {
  const { data, error } = await supabase.from('collection_items').delete().match({ collection_id: collectionId, novel_id: novelId });
  return { data, error };
}
