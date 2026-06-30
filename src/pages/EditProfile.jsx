import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Save, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../lib/storage';

function cleanUsername(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function getDefaultProfile(userId) {
  return {
    id: userId,
    display_name: '',
    username: `user_${String(userId || '').slice(0, 8)}`,
    avatar_url: '',
    banner_url: '',
    bio: '',
    country: '',
    social_links: {
      instagram: '',
      tiktok: '',
      twitter: '',
      website: '',
    },
  };
}

export function EditProfile() {
  const { userId, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(getDefaultProfile(userId));
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const fallbackUsername = cleanUsername(user?.email?.split('@')[0] || `user_${userId.slice(0, 8)}`);

    setProfile({
      ...getDefaultProfile(userId),
      ...(data || {}),
      username: data?.username || fallbackUsername,
      social_links: {
        instagram: '',
        tiktok: '',
        twitter: '',
        website: '',
        ...(data?.social_links || {}),
      },
    });

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, [userId]);

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateSocial(field, value) {
    setProfile((current) => ({
      ...current,
      social_links: {
        ...current.social_links,
        [field]: value,
      },
    }));
  }

  async function handleFileChange(event, bucket, field) {
    const file = event.target.files?.[0];

    if (!file || !userId) return;

    setMessage('Subiendo imagen...');

    const { url, error } = await uploadFile({ bucket, userId, file });

    if (error) {
      setMessage(`Error subiendo imagen: ${error.message}`);
      return;
    }

    setProfile((current) => ({ ...current, [field]: url }));
    setMessage('Imagen subida. Ahora guarda el perfil.');
  }

  async function saveProfile(event) {
    event.preventDefault();

    if (!userId) {
      setMessage('Necesitas iniciar sesión.');
      return;
    }

    const username = cleanUsername(profile.username || profile.display_name || `user_${userId.slice(0, 8)}`);

    if (!username) {
      setMessage('El username no puede quedar vacío.');
      return;
    }

    setSaving(true);
    setMessage('');

    const payload = {
      id: userId,
      username,
      display_name: profile.display_name || username,
      avatar_url: profile.avatar_url || null,
      banner_url: profile.banner_url || null,
      bio: profile.bio || null,
      country: profile.country || null,
      social_links: profile.social_links || {},
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      setMessage(error.message.includes('duplicate') ? 'Ese username ya está usado.' : error.message);
      setSaving(false);
      return;
    }

    setMessage('Perfil guardado.');
    setSaving(false);
    navigate(`/user/${userId}`);
  }

  if (authLoading || loading) {
    return (
      <main className="detail-page">
        <section className="reader-card">Cargando perfil...</section>
      </main>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="detail-page">
      <Link to="/dashboard" className="back-link">
        <ArrowLeft size={18} /> Volver al panel
      </Link>

      <section className="reader-card">
        <p className="reader-novel">Perfil</p>
        <h1>Editar perfil</h1>

        <div className="profile-preview">
          <div
            className="profile-banner"
            style={{ backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined }}
          />

          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name || 'Avatar'} />
            ) : (
              <UserRound size={44} />
            )}
          </div>

          <h2>{profile.display_name || 'Tu nombre'}</h2>
          <p>@{profile.username || 'username'}</p>
        </div>

        <form className="profile-form" onSubmit={saveProfile}>
          <label>
            Nombre público
            <input
              value={profile.display_name || ''}
              onChange={(event) => updateField('display_name', event.target.value)}
              placeholder="Tu nombre"
            />
          </label>

          <label>
            Username
            <input
              value={profile.username || ''}
              onChange={(event) => updateField('username', event.target.value)}
              placeholder="username"
            />
          </label>

          <label>
            Avatar
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(event, 'avatars', 'avatar_url')}
            />
          </label>

          <label>
            Banner
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(event, 'banners', 'banner_url')}
            />
          </label>

          <label>
            País
            <input
              value={profile.country || ''}
              onChange={(event) => updateField('country', event.target.value)}
              placeholder="País"
            />
          </label>

          <label>
            Biografía
            <textarea
              value={profile.bio || ''}
              onChange={(event) => updateField('bio', event.target.value)}
              rows={5}
              placeholder="Cuenta algo sobre ti..."
            />
          </label>

          <div className="profile-social-grid">
            <label>
              Instagram
              <input
                value={profile.social_links.instagram || ''}
                onChange={(event) => updateSocial('instagram', event.target.value)}
                placeholder="https://instagram.com/..."
              />
            </label>

            <label>
              TikTok
              <input
                value={profile.social_links.tiktok || ''}
                onChange={(event) => updateSocial('tiktok', event.target.value)}
                placeholder="https://tiktok.com/@..."
              />
            </label>

            <label>
              Twitter / X
              <input
                value={profile.social_links.twitter || ''}
                onChange={(event) => updateSocial('twitter', event.target.value)}
                placeholder="https://x.com/..."
              />
            </label>

            <label>
              Web
              <input
                value={profile.social_links.website || ''}
                onChange={(event) => updateSocial('website', event.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>

          <button type="submit" className="primary-action" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar perfil'} <Save size={18} />
          </button>

          <Link to={`/user/${userId}`} className="secondary-action">
            Ver perfil público <Eye size={16} />
          </Link>

          {message && <p className="form-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}

export default EditProfile;