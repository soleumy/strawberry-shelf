import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

function cleanUsername(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function EditProfile() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState({
    display_name: '',
    username: '',
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
  });

  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData.session || null;

      setSession(currentSession);

      if (!currentSession?.user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          username: data.username || '',
          avatar_url: data.avatar_url || '',
          banner_url: data.banner_url || '',
          bio: data.bio || '',
          country: data.country || '',
          social_links: {
            instagram: data.social_links?.instagram || '',
            tiktok: data.social_links?.tiktok || '',
            twitter: data.social_links?.twitter || '',
            website: data.social_links?.website || '',
          },
        });
      } else {
        setProfile((current) => ({
          ...current,
          display_name: currentSession.user.email?.split('@')[0] || '',
          username: cleanUsername(currentSession.user.email?.split('@')[0] || ''),
        }));
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  function updateField(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
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

  async function saveProfile(event) {
    event.preventDefault();

    if (!session?.user) {
      setMessage('Debes iniciar sesión para editar tu perfil.');
      return;
    }

    setSaving(true);
    setMessage('');

    const username = cleanUsername(profile.username);

    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      email: session.user.email,
      display_name: profile.display_name,
      username,
      avatar_url: profile.avatar_url,
      banner_url: profile.banner_url,
      bio: profile.bio,
      country: profile.country,
      social_links: profile.social_links,
    });

    if (error) {
      setMessage(error.message.includes('duplicate') ? 'Ese username ya está usado. Prueba otro.' : error.message);
      setSaving(false);
      return;
    }

    setProfile((current) => ({
      ...current,
      username,
    }));

    setMessage('Perfil guardado.');
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="detail-page">
        <section className="reader-card">Cargando perfil...</section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="detail-page">
        <section className="reader-card">
          <h1>Inicia sesión</h1>
          <p className="form-message">Necesitas iniciar sesión para editar tu perfil.</p>
          <Link to="/" className="reader-button">Volver al inicio</Link>
        </section>
      </main>
    );
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
            style={{
              backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined,
            }}
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
              value={profile.display_name}
              onChange={(event) => updateField('display_name', event.target.value)}
              placeholder="Uriel"
            />
          </label>

          <label>
            Username
            <input
              value={profile.username}
              onChange={(event) => updateField('username', event.target.value)}
              placeholder="uriel"
            />
          </label>

          <label>
            URL del avatar
            <input
              value={profile.avatar_url}
              onChange={(event) => updateField('avatar_url', event.target.value)}
              placeholder="https://..."
            />
          </label>

          <label>
            URL del banner
            <input
              value={profile.banner_url}
              onChange={(event) => updateField('banner_url', event.target.value)}
              placeholder="https://..."
            />
          </label>

          <label>
            País
            <input
              value={profile.country}
              onChange={(event) => updateField('country', event.target.value)}
              placeholder="España, México, Argentina..."
            />
          </label>

          <label>
            Biografía
            <textarea
              value={profile.bio}
              onChange={(event) => updateField('bio', event.target.value)}
              rows="5"
              placeholder="Cuéntale algo bonito a tus lectores..."
            />
          </label>

          <div className="profile-social-grid">
            <label>
              Instagram
              <input
                value={profile.social_links.instagram}
                onChange={(event) => updateSocial('instagram', event.target.value)}
                placeholder="https://instagram.com/..."
              />
            </label>

            <label>
              TikTok
              <input
                value={profile.social_links.tiktok}
                onChange={(event) => updateSocial('tiktok', event.target.value)}
                placeholder="https://tiktok.com/@..."
              />
            </label>

            <label>
              Twitter / X
              <input
                value={profile.social_links.twitter}
                onChange={(event) => updateSocial('twitter', event.target.value)}
                placeholder="https://x.com/..."
              />
            </label>

            <label>
              Web
              <input
                value={profile.social_links.website}
                onChange={(event) => updateSocial('website', event.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>

          <button type="submit" className="primary-action" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar perfil'} <Save size={18} />
          </button>

          <Link to={`/user/${session.user.id}`} className="secondary-action">
            Ver mi perfil público
          </Link>

          {message && <p className="form-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}