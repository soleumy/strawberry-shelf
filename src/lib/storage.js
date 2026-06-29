import { supabase } from './supabase';

/** Upload a File object to a storage bucket and return its public URL */
export async function uploadFile({ bucket = 'uploads', userId, file }) {
  if (!file) return { error: new Error('No file provided') };
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { data, error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (uploadError) return { error: uploadError };

  // Get public URL
  const { data: urlData, error: urlError } = supabase.storage.from(bucket).getPublicUrl(data.path);
  if (urlError) return { error: urlError };

  return { url: urlData?.publicUrl || urlData?.public_url || null, path: data.path };
}

export async function removeFile({ bucket = 'uploads', path }) {
  if (!path) return { error: new Error('No path provided') };
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error };
}
