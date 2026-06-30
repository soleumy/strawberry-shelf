import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, Edit3, Heart, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SiteLayout } from '../components/SiteLayout';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';

function getDisplayName(profile) {
  return profile?.display_name || profile?.full_name || profile?.username || 'Usuario';
}

function getAuthorName(novel, profile) {
  return novel?.author || getDisplayName(profile) || 'Comunidad';
}

export function UserProfile() {
  const { id } = useParams();
  const { userId } = useAuth();

  const [profile, setProfile] = useState(null);
  const [novels, setNovels] = useState([]);
  const [stats, setStats] = useState({ novels: 0, chapters: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadProfile() {
    setLoading(true);
    setMessage('');

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (profileError) {
      setMessage(profileError.message);
      setLoading(false);
      return;
    }

    setProfile(profileData || null);

    const { data: novelsData, error: novelsError } = await supabase
      .from('novels')
      .select('id, title, author, synopsis, cover_url, status, created_at')
      .eq('author_id', id)
      .order('created_at', { ascending: false });

    if (novelsError) {
      setMessage(novelsError.message);
      setNovels([]);
      setLoading(false);
      return;
    }

    const userNovels = novelsData || [];
    setNovels(userNovels);

    let chapterCount = 0;

    if (userNovels.length > 0) {
      const novelIds = userNovels.map((novel) => novel.id);

      const { count } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .in('novel_id', novelIds);

      chapterCount = count || 0;
    }

    setStats({
      novels: userNovels.length,
      chapters: chapterCount,
    });

    setLoading(false);
  }

  useEffect(() => {
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <SiteLayout>
        <main className="detail-page">
          <section className="reader-card">Cargando perfil...</section>
        </main>
      </SiteLayout>
    );
  }

  if (!profile) {
    return (
      <SiteLayout>
        <main className="detail-page">
          <section className="reader-card">
            <h1>Perfil no encontrado</h1>
            <Link to="/" className="secondary-action">
              <ArrowLeft size={16} /> Volver al catálogo
            </Link>
          </section>
        </main>
      </SiteLayout>
    );
  }

  const social = profile.social_links || {};
  const isOwnProfile = userId === id;

  return (
    <SiteLayout>
      <SEO title={getDisplayName(profile)} description={profile.bio} image={profile.avatar_url} />

      <main className="detail-page">
        <section className="profile-page">
          <div
            className="profile-banner-large"
            style={{ backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined }}
          />

          <div className="profile-header">
            <div className="profile-avatar-large">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={getDisplayName(profile)} />
              ) : (
                <UserRound size={52} />
              )}
            </div>

            <div className="profile-header-info">
              <span className="detail-pill">@{profile.username || 'usuario'}</span>
              <h1>{getDisplayName(profile)}</h1>

              <p className="detail-meta">
                {profile.country || 'Sin país'}
              </p>

              {profile.created_at && (
                <p className="profile-joined">
                  <Calendar size={14} /> Miembro desde {new Date(profile.created_at).toLocaleDateString('es')}
                </p>
              )}

              <div className="profile-actions">
                {isOwnProfile && (
                  <Link to="/profile/edit" className="primary-action">
                    <Edit3 size={16} /> Editar perfil
                  </Link>
                )}

                <Link to="/library" className="secondary-action">
                  <Heart size={16} /> Biblioteca
                </Link>
              </div>
            </div>
          </div>

          {message && <p className="form-message">{message}</p>}

          <p className="detail-synopsis">
            {profile.bio || 'Este usuario todavía no tiene biografía.'}
          </p>

          {(social.website || social.instagram || social.twitter || social.tiktok) && (
            <div className="profile-social-links">
              {social.website && <a href={social.website} target="_blank" rel="noreferrer">Web</a>}
              {social.instagram && <a href={social.instagram} target="_blank" rel="noreferrer">Instagram</a>}
              {social.twitter && <a href={social.twitter} target="_blank" rel="noreferrer">X</a>}
              {social.tiktok && <a href={social.tiktok} target="_blank" rel="noreferrer">TikTok</a>}
            </div>
          )}

          <div className="profile-stats">
            <div>
              <strong>{stats.novels}</strong>
              <span>Novelas</span>
            </div>

            <div>
              <strong>{stats.chapters}</strong>
              <span>Capítulos</span>
            </div>
          </div>

          <section className="profile-section">
            <h2><BookOpen size={20} /> Novelas creadas</h2>

            {novels.length === 0 ? (
              <div className="empty-state">Este perfil todavía no tiene novelas publicadas.</div>
            ) : (
              <div className="kawaii-grid">
                {novels.map((novel) => (
                  <Link key={novel.id} to={`/novel/${novel.id}`} className="kawaii-novel-card">
                    <div className="kawaii-cover">
                      <img
                        src={novel.cover_url || '/placeholder-cover.png'}
                        alt={novel.title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.src = '/placeholder-cover.png';
                        }}
                      />
                      <span>{novel.status === 'approved' ? 'Publicada' : 'Pendiente'}</span>
                    </div>

                    <div>
                      <h3>{novel.title}</h3>
                      <p>{getAuthorName(novel, profile)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </SiteLayout>
  );
}

export default UserProfile;