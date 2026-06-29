import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadFile, removeFile } from '../../lib/storage';
import { searchProfiles } from '../../lib/api/profiles';
import { useAuth } from '../../context/AuthContext';
import { GENRES, TAGS, LANGUAGES, NOVEL_STATUSES, PUBLICATION_STATUSES } from '../../lib/constants';
import { safeFileName } from '../../lib/novelUtils';

export function EditNovel() {
  const { novelId } = useParams();
  const { session } = useAuth();
  const isNew = !novelId || novelId === 'new';

  const [form, setForm] = useState({
    title: '',
    author: '',
    author_id: null,
    translator: '',
    synopsis: '',
    cover_url: '',
    cover_path: null,
    status: 'draft',
    publication_status: 'ongoing',
    language: 'es',
    genres: [],
    tags: [],
  });
  const [coverFile, setCoverFile] = useState(null);
  const [authorSuggestions, setAuthorSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isNew) return;

    async function load() {
      const { data } = await supabase.from('novels').select('*').eq('id', novelId).maybeSingle();
      if (data) {
        setForm({
          title: data.title || '',
          author: data.author || '',
          translator: data.translator || '',
          synopsis: data.synopsis || '',
          cover_url: data.cover_url || '',
          cover_path: data.cover_path || null,
          status: data.status || 'draft',
          publication_status: data.publication_status || 'ongoing',
          language: data.language || 'es',
          genres: data.genres || [],
          tags: data.tags || [],
        });
      }
    }

    load();
  }, [novelId, isNew]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAuthorInput(value) {
    updateField('author', value);
    updateField('author_id', null);
    if (value && value.length >= 2) {
      const { data } = await searchProfiles(value, 5);
      setAuthorSuggestions(data || []);
    } else {
      setAuthorSuggestions([]);
    }
  }

  function pickAuthor(profile) {
    setForm((current) => ({ ...current, author: profile.full_name || profile.username, author_id: profile.id }));
    setAuthorSuggestions([]);
  }

  function toggleArray(field, value) {
    setForm((current) => {
      const arr = current[field];
      return {
        ...current,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  async function uploadCover() {
    if (!coverFile || !session?.user) return form.cover_url;
    const { url, path, error } = await uploadFile({ bucket: 'covers', userId: session.user.id, file: coverFile });
    if (error) throw error;
    return { url, path };
  }

  async function deleteCover() {
    if (!form.cover_path) {
      setForm((c) => ({ ...c, cover_url: null, cover_path: null }));
      return;
    }

    const { error } = await removeFile({ bucket: 'covers', path: form.cover_path });
    if (error) {
      setMessage(`Error eliminando portada: ${error.message}`);
      return;
    }

    setForm((c) => ({ ...c, cover_url: null, cover_path: null }));
    setMessage('Portada eliminada.');
  }

  async function save(event) {
    event.preventDefault();
    if (!session?.user) return;

    setSaving(true);
    setMessage('');

    try {
      const coverResult = coverFile ? await uploadCover() : { url: form.cover_url, path: form.cover_path };
      const coverUrl = coverResult?.url || null;
      const coverPath = coverResult?.path || null;

      const payload = {
        ...form,
        author_id: form.author_id || null,
        cover_url: coverUrl,
        cover_path: coverPath,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        payload.created_by = session.user.id;
        payload.status = 'draft';
        const { error } = await supabase.from('novels').insert(payload);
        if (error) throw error;
        setMessage('Novela creada como borrador.');
      } else {
        const { error } = await supabase.from('novels').update(payload).eq('id', novelId);
        if (error) throw error;
        setMessage('Novela actualizada.');
      }
    } catch (error) {
      setMessage(error.message);
    }

    setSaving(false);
  }

  return (
    <section className="reader-card">
      <Link to="/dashboard/novels" className="back-link">
        <ArrowLeft size={18} /> Mis novelas
      </Link>

      <h1>{isNew ? 'Nueva novela' : 'Editar novela'}</h1>

      <form className="profile-form" onSubmit={save}>
        <label>
          Título
          <input value={form.title} onChange={(e) => updateField('title', e.target.value)} required />
        </label>

        <label>
          Autor
          <input value={form.author} onChange={(e) => handleAuthorInput(e.target.value)} />
          {authorSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {authorSuggestions.map((p) => (
                <li key={p.id} onClick={() => pickAuthor(p)}>
                  <img src={p.avatar_url || '/default-avatar.png'} alt={p.username} />
                  <span>{p.full_name || p.username} <small>@{p.username}</small></span>
                </li>
              ))}
            </ul>
          )}
        </label>

        <label>
          Traductor
          <input value={form.translator} onChange={(e) => updateField('translator', e.target.value)} />
        </label>

        <label>
          Sinopsis
          <textarea value={form.synopsis} onChange={(e) => updateField('synopsis', e.target.value)} rows="4" />
        </label>

        <label>
          Portada (archivo)
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
        </label>

        {form.cover_url && (
          <img src={form.cover_url} alt="Portada" className="edit-novel-cover-preview" />
        )}

        <label>
          Idioma
          <select value={form.language} onChange={(e) => updateField('language', e.target.value)}>
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>{lang.label}</option>
            ))}
          </select>
        </label>

        <label>
          Estado de publicación
          <select value={form.publication_status} onChange={(e) => updateField('publication_status', e.target.value)}>
            {Object.entries(PUBLICATION_STATUSES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </label>

        {!isNew && (
          <label>
            Estado de revisión
            <select value={form.status} onChange={(e) => updateField('status', e.target.value)}>
              {Object.entries(NOVEL_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </label>
        )}

        <fieldset className="tag-selector">
          <legend>Géneros</legend>
          <div className="tag-chips">
            {GENRES.map((genre) => (
              <button
                key={genre}
                type="button"
                className={form.genres.includes(genre) ? 'active' : ''}
                onClick={() => toggleArray('genres', genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="tag-selector">
          <legend>Etiquetas</legend>
          <div className="tag-chips">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={form.tags.includes(tag) ? 'active' : ''}
                onClick={() => toggleArray('tags', tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="primary-action" disabled={saving}>
          <Save size={17} /> {saving ? 'Guardando...' : 'Guardar novela'}
        </button>

        {message && <p className="form-message">{message}</p>}
      </form>
    </section>
  );
}
