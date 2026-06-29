import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Sparkles, Image, Globe } from 'lucide-react';

export function EditNovel() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [language, setLanguage] = useState('es');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew || !supabase.isConfigured) return;

    async function loadNovelData() {
      const { data, error } = await supabase
        .from('novels')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setTitle(data.title || '');
        setSynopsis(data.synopsis || '');
        setCoverUrl(data.cover_url || '');
        setLanguage(data.language || 'es');
      }
      setLoading(false);
    }

    loadNovelData();
  }, [id, isNew]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    // Validación de respaldo estético para portadas vacías
    const finalCoverUrl = coverUrl.trim() || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600';

    const novelPayload = {
      title: title.trim(),
      synopsis: synopsis.trim(),
      cover_url: finalCoverUrl,
      language,
      author_id: user?.id,
      status: 'approved' // Auto-aprobado para desarrollo; cambiar a 'pending' en producción si hay moderación estricta
    };

    try {
      if (isNew) {
        await supabase.from('novels').insert([novelPayload]);
      } else {
        await supabase.from('novels').update(novelPayload).eq('id', id);
      }
      navigate('/dashboard/novels');
    } catch (err) {
      console.error('Error guardando la novela:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-pink-500 font-medium animate-pulse text-xs">
        Recuperando el manuscrito de la novela...
      </div>
    );
  }

  return (
    <div className="animate-fadeIn font-sans max-w-2xl mx-auto">
      {/* Botón de retorno */}
      <Link 
        to="/dashboard/novels" 
        className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-xs font-bold mb-5 transition"
      >
        <ArrowLeft size={14} /> Volver al listado
      </Link>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 shadow-xs">
        <h1 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-6">
          <Sparkles className="text-pink-500" size={20} />
          {isNew ? 'Registrar una Nueva Obra' : 'Modificar Datos de la Obra'}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Título de la Novela</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: El Retorno del Héroe Legendario"
              className="w-full px-4 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 transition"
            />
          </div>

          {/* Enlace de Portada e Idioma */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Image size={13} /> URL de la Portada
              </label>
              <input 
                type="url" 
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://ejemplo.com/portada.jpg"
                className="w-full px-4 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <Globe size={13} /> Idioma
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 font-bold transition"
              >
                <option value="es">Español (es)</option>
                <option value="en">English (en)</option>
                <option value="jp">日本語 (jp)</option>
              </select>
            </div>
          </div>

          {/* Sinopsis */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Sinopsis o Resumen</label>
            <textarea 
              rows={5}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Escribe una breve introducción que atrape a los lectores..."
              className="w-full px-4 py-3 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 leading-relaxed resize-none transition"
            />
          </div>

          {/* Botonera de Envío */}
          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full flex items-center justify-center gap-2 bg-pink-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs hover:bg-pink-600 transition disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Guardando cambios...' : 'Guardar Ficha de la Obra'}
          </button>
        </form>
      </div>
    </div>
  );
}