import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { safeFileName } from '../../lib/novelUtils';

export function SettingsPage() {
  const { session, profile, refresh } = useAuth();
  const [form, setForm] = useState({
    display_name: '',
    email: '',
    theme: 'light',
    language: 'es',
    privacy: 'public',
  });
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        email: profile.email || session?.user?.email || '',
        theme: profile.settings?.theme || 'light',
        language: profile.settings?.language || 'es',
        privacy: profile.settings?.privacy || 'public',
      });
    }
  }, [profile, session]);

  async function uploadFile(bucket, file) {
    const path = `${session.user.id}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const updates = {
        display_name: form.display_name,
        settings: { theme: form.theme, language: form.language, privacy: form.privacy },
        updated_at: new Date().toISOString(),
      };

      if (avatarFile) updates.avatar_url = await uploadFile('avatars', avatarFile);
      if (bannerFile) updates.banner_url = await uploadFile('banners', bannerFile);

      const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id);
      if (error) throw error;

      if (password.length >= 6) {
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) throw pwError;
        setPassword('');
      }

      await refresh();
      setMessage('Configuración guardada.');
    } catch (error) {
      setMessage(error.message);
    }

    setSaving(false);
  }

  return (
    <section className="reader-card">
      <p className="reader-novel"><Settings size={16} /> Configuración</p>
      <h1>Ajustes de cuenta</h1>

      <form className="profile-form" onSubmit={save}>
        <label>
          Nombre
          <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        </label>

        <label>
          Correo
          <input value={form.email} readOnly disabled />
        </label>

        <label>
          Nueva contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
          />
        </label>

        <label>
          Avatar
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
        </label>

        <label>
          Banner
          <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
        </label>

        <label>
          Tema
          <select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="auto">Automático</option>
          </select>
        </label>

        <label>
          Idioma
          <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>

        <label>
          Privacidad del perfil
          <select value={form.privacy} onChange={(e) => setForm({ ...form, privacy: e.target.value })}>
            <option value="public">Público</option>
            <option value="private">Privado</option>
          </select>
        </label>

        <button type="submit" className="primary-action" disabled={saving}>
          <Save size={17} /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <Link to="/profile/edit" className="secondary-action">Editar perfil completo</Link>

        {message && <p className="form-message">{message}</p>}
      </form>
    </section>
  );
}
