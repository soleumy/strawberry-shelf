import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Edit, Eye, GripVertical, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export function ChapterManager() {
  const { novelId } = useParams();
  const { session } = useAuth();
  const [novel, setNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState(null);

  async function load() {
    const { data: novelData } = await supabase
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .maybeSingle();

    const { data: chapterData } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .order('chapter_order', { ascending: true });

    setNovel(novelData);
    setChapters(chapterData || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [novelId]);

  async function deleteChapter(id) {
    if (!confirm('¿Eliminar este capítulo?')) return;
    await supabase.from('chapters').delete().eq('id', id);
    load();
  }

  async function duplicateChapter(chapter) {
    const maxOrder = chapters.reduce((max, c) => Math.max(max, c.chapter_order), 0);

    await supabase.from('chapters').insert({
      novel_id: novelId,
      title: `${chapter.title} (copia)`,
      content: chapter.content,
      file_url: chapter.file_url,
      file_type: chapter.file_type,
      chapter_order: maxOrder + 1,
      is_draft: true,
    });

    load();
  }

  async function saveOrder(newChapters) {
    setChapters(newChapters);

    await Promise.all(
      newChapters.map((chapter, index) =>
        supabase.from('chapters').update({ chapter_order: index + 1 }).eq('id', chapter.id)
      )
    );
  }

  function handleDragStart(index) {
    setDragIndex(index);
  }

  function handleDragOver(event, index) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const reordered = [...chapters];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setDragIndex(index);
    saveOrder(reordered);
  }

  if (loading) return <section className="reader-card">Cargando...</section>;
  if (!novel) return <section className="reader-card">Novela no encontrada.</section>;

  return (
    <section className="reader-card">
      <Link to="/dashboard/novels" className="back-link">
        <ArrowLeft size={18} /> Mis novelas
      </Link>

      <p className="reader-novel">{novel.title}</p>
      <h1>Gestión de capítulos</h1>

      <Link to={`/dashboard/novels/${novelId}/chapters/new`} className="primary-action">
        <Plus size={17} /> Nuevo capítulo
      </Link>

      <div className="chapter-manager-list">
        {chapters.map((chapter, index) => (
          <article
            key={chapter.id}
            className="chapter-manager-item"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
          >
            <GripVertical size={18} className="drag-handle" />

            <div className="chapter-manager-info">
              <strong>Capítulo {chapter.chapter_order}</strong>
              <span>{chapter.title}</span>
              {chapter.is_draft && <span className="detail-pill">Borrador</span>}
            </div>

            <div className="admin-actions">
              <Link to={`/dashboard/novels/${novelId}/chapters/${chapter.id}/edit`}>
                <Edit size={16} /> Editar
              </Link>
              <Link to={`/novel/${novelId}/chapter/${chapter.id}`}>
                <Eye size={16} /> Vista previa
              </Link>
              <button type="button" onClick={() => duplicateChapter(chapter)}>
                <Copy size={16} /> Duplicar
              </button>
              <button type="button" onClick={() => deleteChapter(chapter.id)}>
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ChapterEditor() {
  const { novelId, chapterId } = useParams();
  const { session } = useAuth();
  const isNew = chapterId === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDraft, setIsDraft] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isNew) return;

    async function load() {
      const { data } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .maybeSingle();

      if (data) {
        setTitle(data.title);
        setContent(data.content || '');
        setIsDraft(data.is_draft);
      }
    }

    load();
  }, [chapterId, isNew]);

  async function save(publish = false) {
    if (!session?.user) return;

    setSaving(true);
    setMessage('');

    const payload = {
      novel_id: novelId,
      title: title || 'Sin título',
      content,
      is_draft: publish ? false : isDraft,
      published_at: publish ? new Date().toISOString() : null,
      word_count: content.split(/\s+/).filter(Boolean).length,
      updated_at: new Date().toISOString(),
    };

    if (isNew) {
      const { data: existing } = await supabase
        .from('chapters')
        .select('chapter_order')
        .eq('novel_id', novelId)
        .order('chapter_order', { ascending: false })
        .limit(1);

      payload.chapter_order = (existing?.[0]?.chapter_order || 0) + 1;
      payload.file_type = 'text';

      const { error } = await supabase.from('chapters').insert(payload);
      if (error) setMessage(error.message);
      else setMessage('Capítulo creado.');
    } else {
      const { error } = await supabase.from('chapters').update(payload).eq('id', chapterId);
      if (error) setMessage(error.message);
      else setMessage(publish ? 'Capítulo publicado.' : 'Capítulo guardado.');
    }

    setSaving(false);
  }

  return (
    <section className="reader-card chapter-editor">
      <Link to={`/dashboard/novels/${novelId}/chapters`} className="back-link">
        <ArrowLeft size={18} /> Capítulos
      </Link>

      <h1>{isNew ? 'Nuevo capítulo' : 'Editar capítulo'}</h1>

      <label>
        Título
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label>
        Contenido
        <textarea
          className="chapter-editor-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="20"
          placeholder="Escribe el capítulo aquí..."
        />
      </label>

      <label className="checkbox-label">
        <input type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} />
        Guardar como borrador
      </label>

      <div className="editor-actions">
        <button type="button" className="secondary-action" onClick={() => save(false)} disabled={saving}>
          <Save size={17} /> {saving ? 'Guardando...' : 'Guardar borrador'}
        </button>
        <button type="button" className="primary-action" onClick={() => save(true)} disabled={saving}>
          Publicar capítulo
        </button>
      </div>

      {message && <p className="form-message">{message}</p>}
    </section>
  );
}
