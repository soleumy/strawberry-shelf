import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Settings, Save, User, AtSign, FileText, CheckCircle } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!supabase.isConfigured || !user) {
      setLoading(false);
      return;
    }

    async function loadProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, bio')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setUsername(data.username || '');
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
      }
      setLoading(false);
    }

    loadProfile();
  }, [user]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccessMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username.trim().toLowerCase(),
          display_name: displayName.trim(),
          bio: bio.trim(),
          updated_at: new Date().toISOString(),
        });

      if (!error) {
        setSuccessMessage('¡Perfil actualizado correctamente!');
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        console.error('Error al guardar el perfil:', error.message);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-pink-500 font-medium animate-pulse text-xs">
        Cargando tus configuraciones de autor...
      </div>
    );
  }

  return (
    <div className="animate-fadeIn font-sans max-w-xl mx-auto">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-6 shadow-xs">
        
        {/* Título de la sección */}
        <h1 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-1">
          <Settings className="text-pink-500" size={18} /> Ajustes del Perfil
        </h1>
        <p className="text-[11px] text-neutral-400 mb-6">Gestiona la información pública que verán tus lectores en el catálogo.</p>

        {/* Notificación de Éxito */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle size={14} /> {successMessage}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
          {/* Nombre de Visualización */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <User size={12} /> Nombre Público (Display Name)
            </label>
            <input 
              type="text" 
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej: Uriel Dev"
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 transition"
            />
          </div>

          {/* Nombre de Usuario / Handle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <AtSign size={12} /> Nombre de Usuario (Único)
            </label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))} // Evita espacios
              placeholder="ej: uriel_dev"
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 transition font-mono"
            />
          </div>

          {/* Biografía de Autor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <FileText size={12} /> Biografía / Descripción
            </label>
            <textarea 
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale a la comunidad sobre tus gustos, proyectos o itinerario de traducción..."
              className="w-full px-4 py-3 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 leading-relaxed resize-none transition"
            />
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-pink-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs hover:bg-pink-600 transition disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Guardando cambios...' : 'Actualizar Perfil'}
          </button>
        </form>
      </div>
    </div>
  );
}