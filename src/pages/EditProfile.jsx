import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getProfile, upsertProfile } from '../lib/api/profiles';
import { uploadFile } from '../lib/storage';

function cleanUsername(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function EditProfile() {
  const { userId } = useAuth();
  const [profile, setProfile] = useState({
    display_name: '',
    username: '',
    avatar_url: '',
    banner_url: '',
    bio: '',
    country: '',
    social_links: { instagram: '', tiktok: '', twitter: '', website: '' },
  });

  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!userId) { setLoading(false); return; }
      const { data } = await getProfile(userId);
      if (data) {
        setProfile((p) => ({ ...p, ...data }));
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateSocial(field, value) {
    setProfile((current) => ({ ...current, social_links: { ...current.social_links, [field]: value } }));
  }

  async function handleFileChange(e, bucket, field) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setMessage('Subiendo archivo...');
    const { url, error } = await uploadFile({ bucket, userId, file });
    if (error) {
      setMessage(`Error subiendo archivo: ${error.message}`);
      return;
    }
    setProfile((current) => ({ ...current, [field]: url }));
    setMessage('Archivo subido.');
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!userId) { setMessage('Necesitas iniciar sesión.'); return; }
    setSaving(true);
    setMessage('');

    const username = cleanUsername(profile.username || profile.display_name || `user_${userId.substring(0,8)}`);

    const payload = {
      id: userId,
      username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      banner_url: profile.banner_url,
      bio: profile.bio,
      country: profile.country,
      social: profile.social_links,
    };

    const { data, error } = await upsertProfile(payload);
    if (error) {
      setMessage(error.message.includes('duplicate') ? 'Ese username ya está usado.' : error.message);
      setSaving(false);
      return;
    }

    setMessage('Perfil guardado.');
    setSaving(false);
    navigate(`/user/${userId}`);
  }

  if (loading) return (<main className="detail-page"><section className="reader-card">Cargando perfil...</section></main>);

  return (
    <main className="detail-page">
      <Link to="/dashboard" className="back-link"><ArrowLeft size={18} /> Volver al panel</Link>

      <section className="reader-card">
        <p className="reader-novel">Perfil</p>
        <h1>Editar perfil</h1>

        <div className="profile-preview">
          <div className="profile-banner" style={{ backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined }} />
          <div className="profile-avatar">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.display_name || 'Avatar'} /> : <UserRound size={44} />}
          </div>
          <h2>{profile.display_name || 'Tu nombre'}</h2>
          <p>@{profile.username || 'username'}</p>
        </div>

        <form className="profile-form" onSubmit={saveProfile}>
          <label>Nombre público
            <input value={profile.display_name} onChange={(e) => updateField('display_name', e.target.value)} placeholder="Tu nombre" />
          </label>

          <label>Username
            <input value={profile.username} onChange={(e) => updateField('username', e.target.value)} placeholder="username" />
          </label>

          <label>Avatar (archivo)
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'avatars', 'avatar_url')} />
          </label>

          <label>Banner (archivo)
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banners', 'banner_url')} />
          </label>

          <label>País
            <input value={profile.country || ''} onChange={(e) => updateField('country', e.target.value)} placeholder="País" />
          </label>

          <label>Biografía
            <textarea value={profile.bio || ''} onChange={(e) => updateField('bio', e.target.value)} rows={5} />
          </label>

          <div className="profile-social-grid">
            <label>Instagram
              <input value={profile.social_links.instagram} onChange={(e) => updateSocial('instagram', e.target.value)} />
            </label>
            <label>TikTok
              <input value={profile.social_links.tiktok} onChange={(e) => updateSocial('tiktok', e.target.value)} />
            </label>
            <label>Twitter / X
              <input value={profile.social_links.twitter} onChange={(e) => updateSocial('twitter', e.target.value)} />
            </label>
            <label>Web
              <input value={profile.social_links.website} onChange={(e) => updateSocial('website', e.target.value)} />
            </label>
          </div>

          <button type="submit" className="primary-action" disabled={saving}>{saving ? 'Guardando...' : 'Guardar perfil'} <Save size={18} /></button>

          <Link to={`/user/${userId}`} className="secondary-action">Ver mi perfil público</Link>

          {message && <p className="form-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}