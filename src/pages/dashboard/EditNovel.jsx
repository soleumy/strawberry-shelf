import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, Image, Save, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

function makeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `novela-${Date.now()}`;
}

function getMissingColumn(error) {
  const message = error?.message || '';
  const match = message.match(/Could not find the '(.+?)' column/);
  return match?.[1] || null;
}

async function insertWithFallback(payload) {
  let nextPayload = { ...payload };

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await supabase
      .from('novels')
      .insert(nextPayload)
      .select('id')
      .single();

    if (!result.error) return result;

    const missingColumn = getMissingColumn(result.error);
    if (!missingColumn || !(missingColumn in nextPayload)) return result;

    delete nextPayload[missingColumn];
  }

  return {
    data: null,
    error: new Error('No se pudo guardar la novela por columnas incompatibles.'),
  };
}

async function updateWithFallback(novelId, payload) {
  let nextPayload = { ...payload };

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await supabase
      .from('novels')
      .update(nextPayload)
      .eq('id', novelId)
      .select('id')
      .single();

    if (!result.error) return result;

    const missingColumn = getMissingColumn(result.error);
    if (!missingColumn || !(missingColumn in nextPayload)) return result;

    delete nextPayload[missingColumn];
  }

  return {
    data: null,
    error: new Error('No se pudo actualizar la novela por columnas incompatibles.'),
  };
}

export function EditNovel() {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const novelId = params.novelId || params.id || null;
  const isNew = !novelId || novelId === 'new';

  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [language, setLanguage] = useState('es');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }

    async function loadNovelData() {
      if (!supabase.isConfigured || !novelId) {
        setMessage('No se pudo cargar la novela.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('novels')
        .select('*')
        .eq('id', novelId)
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setTitle(data.title || '');
        setSynopsis(data.synopsis || data.description || data.summary || '');
        setCoverUrl(data.cover_url || data.cover || '');
        setLanguage(data.language || 'es');
      }

      setLoading(false);
    }

    loadNovelData();
  }, [novelId, isNew]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (!user?.id) {
      setMessage('Necesitas iniciar sesion para guardar novelas.');
      return;
    }

    if (!supabase.isConfigured) {
      setMessage('Supabase no esta configurado.');
      return;
    }

    if (!title.trim()) {
      setMessage('El titulo es obligatorio.');
      return;
    }

    setSaving(true);

    const finalCoverUrl =
      coverUrl.trim() ||
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600';

    const slug = `${makeSlug(title)}-${Date.now()}`;

    const novelPayload = {
      title: title.trim(),
      slug,
      synopsis: synopsis.trim(),
      description: synopsis.trim(),
      summary: synopsis.trim(),
      cover_url: finalCoverUrl,
      cover: finalCoverUrl,
      language,
      status: 'approved',
      author_id: user.id,
    };

    const result = isNew
      ? await insertWithFallback(novelPayload)
      : await updateWithFallback(novelId, novelPayload);

    if (result.error) {
      setMessage(result.error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    navigate('/dashboard/novels');
  }

  if (loading) {
    return (
      <div className="empty-state">
        Recuperando el manuscrito de la novela...
      </div>
    );
  }

  return (
    <div className="animate-fadeIn font-sans max-w-2xl mx-auto">
      <Link to="/dashboard/novels" className="back-link">
        <ArrowLeft size={16} /> Volver al listado
      </Link>

      <section className="reader-card">
        <p className="reader-novel">Panel creativo</p>

        <h1>
          <Sparkles size={24} /> {isNew ? 'Registrar nueva obra' : 'Modificar obra'}
        </h1>

        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Titulo de la novela
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej: El retorno del heroe legendario"
            />
          </label>

          <label>
            <Image size={15} /> URL de portada
            <input
              type="url"
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
              placeholder="https://ejemplo.com/portada.jpg"
            />
          </label>

          <label>
            <Globe size={15} /> Idioma
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="es">Espanol</option>
              <option value="en">English</option>
              <option value="jp">Japones</option>
            </select>
          </label>

          <label>
            Sinopsis
            <textarea
              rows={6}
              value={synopsis}
              onChange={(event) => setSynopsis(event.target.value)}
              placeholder="Escribe una breve introduccion..."
            />
          </label>

          <button type="submit" className="primary-action" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar novela'} <Save size={18} />
          </button>

          {message && <p className="form-message">{message}</p>}
        </form>
      </section>
    </div>
  );
}