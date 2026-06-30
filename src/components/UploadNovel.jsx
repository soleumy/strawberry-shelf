import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { safeFileName, getFileType } from '../lib/novelUtils';

export function UploadNovel({ onUploaded }) {
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [chapterTitle, setChapterTitle] = useState('Capítulo único');
  const [content, setContent] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [novelFile, setNovelFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function ensureProfile() {
    const user = session?.user;

    if (!user) {
      throw new Error('Debes iniciar sesión para subir una novela.');
    }

    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileCheckError) throw profileCheckError;
    if (existingProfile) return;

    const usernameBase =
      user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
      `user_${user.id.slice(0, 8)}`;

    const { error: profileInsertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: `${usernameBase}_${Date.now()}`,
      });

    if (profileInsertError) throw profileInsertError;
  }

  function slugify(value) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async function uploadFile(bucket, file) {
    if (!file) return null;

    const path = `${session.user.id}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    if (!session) {
      setMessage('Debes iniciar sesión para subir una novela.');
      return;
    }

    if (!novelFile && !content.trim()) {
      setMessage('Sube un PDF/TXT o escribe el contenido.');
      return;
    }

    setSaving(true);

    try {
      await ensureProfile();

      const coverUrl = await uploadFile('covers', coverFile);
      const fileUrl = await uploadFile('novel-files', novelFile);
      const cleanSlug = slugify(title) || 'novela';

      const { data: novel, error: novelError } = await supabase
        .from('novels')
        .insert({
          title,
          author,
          author_id: session.user.id,
          created_by: session.user.id,
          slug: `${cleanSlug}-${Date.now()}`,
          synopsis,
          status: 'approved',
          cover_url: coverUrl,
          source_type: novelFile ? getFileType(novelFile) : 'text',
        })
        .select()
        .single();

      if (novelError) throw novelError;

      const { error: chapterError } = await supabase.from('chapters').insert({
        novel_id: novel.id,
        author_id: session.user.id,
        title: chapterTitle || 'Capítulo único',
        content: content || null,
        file_url: fileUrl,
        file_type: novelFile ? getFileType(novelFile) : 'text',
        chapter_order: 1,
        is_draft: false,
      });

      if (chapterError) throw chapterError;

      setMessage('Novela publicada correctamente.');
      setTitle('');
      setAuthor('');
      setSynopsis('');
      setChapterTitle('Capítulo único');
      setContent('');
      setCoverFile(null);
      setNovelFile(null);
      event.target.reset();
      onUploaded?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={submit}>
      <label>
        Título
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>

      <label>
        Autor / traductor
        <input value={author} onChange={(event) => setAuthor(event.target.value)} />
      </label>

      <label>
        Sinopsis
        <textarea value={synopsis} onChange={(event) => setSynopsis(event.target.value)} rows="3" />
      </label>

      <label>
        Portada
        <input type="file" accept="image/*" onChange={(event) => setCoverFile(event.target.files?.[0] || null)} />
      </label>

      <label>
        Título del capítulo
        <input value={chapterTitle} onChange={(event) => setChapterTitle(event.target.value)} />
      </label>

      <label>
        PDF o TXT
        <input type="file" accept=".pdf,.txt" onChange={(event) => setNovelFile(event.target.files?.[0] || null)} />
      </label>

      <label>
        O escribe aquí
        <textarea value={content} onChange={(event) => setContent(event.target.value)} rows="8" />
      </label>

      <button type="submit" className="primary-action" disabled={saving}>
        {saving ? 'Publicando...' : 'Publicar novela'} <Upload size={18} />
      </button>

      {message && <p className="form-message">{message}</p>}
    </form>
  );
}