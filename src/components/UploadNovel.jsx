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
      const coverUrl = await uploadFile('covers', coverFile);
      const fileUrl = await uploadFile('novel-files', novelFile);

      const { data: novel, error: novelError } = await supabase
        .from('novels')
        .insert({
          title,
          author,
          synopsis,
          status: 'pending',
          cover_url: coverUrl,
          source_type: novelFile ? getFileType(novelFile) : 'text',
          created_by: session.user.id,
        })
        .select()
        .single();

      if (novelError) throw novelError;

      const { error: chapterError } = await supabase.from('chapters').insert({
        novel_id: novel.id,
        title: chapterTitle || 'Capítulo único',
        content: content || null,
        file_url: fileUrl,
        file_type: novelFile ? getFileType(novelFile) : 'text',
        chapter_order: 1,
      });

      if (chapterError) throw chapterError;

      setMessage('Novela enviada. Quedará pendiente hasta aprobación.');
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
      <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
      <label>Autor / traductor<input value={author} onChange={(e) => setAuthor(e.target.value)} /></label>
      <label>Sinopsis<textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows="3" /></label>
      <label>Portada<input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} /></label>
      <label>Título del capítulo<input value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} /></label>
      <label>PDF o TXT<input type="file" accept=".pdf,.txt" onChange={(e) => setNovelFile(e.target.files?.[0] || null)} /></label>
      <label>O escribe aquí<textarea value={content} onChange={(e) => setContent(e.target.value)} rows="8" /></label>
      <button type="submit" className="primary-action" disabled={saving}>
        {saving ? 'Enviando...' : 'Enviar novela'} <Upload size={18} />
      </button>
      {message && <p className="form-message">{message}</p>}
    </form>
  );
}
