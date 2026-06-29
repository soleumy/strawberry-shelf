import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, Calendar, Heart, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FollowButton } from '../components/FollowButton';
import { SiteLayout } from '../components/SiteLayout';
import { SEO } from '../components/SEO';
import { useAuth } from '../context/AuthContext';

export function UserProfile() {
  const { id } = useParams();
  const { userId: currentUserId } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({});
  const [novels, setNovels] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activity, setActivity] = useState([]);

  const loadProfileData = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    setProfile(data);

    if (!data) return;

    const [
      { count: novelCount },
      { count: followerCount },
      { count: followingCount },
      { data: userNovels },
      { data: userCollections },
      { data: userActivity },
    ] = await Promise.all([
      supabase.from('novels').select('*', { count: 'exact', head: true }).eq('created_by', id).eq('status', 'approved'),
      supabase.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', id),
      supabase.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', id),
      supabase.from('novels').select('*').eq('created_by', id).eq('status', 'approved').order('created_at', { ascending: false }).limit(12),
      supabase.from('collections').select('*').eq('owner_id', id).eq('is_public', true).limit(6),
      supabase.from('activity').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(10),
    ]);

    let chapterCount = 0;
    let favoriteCount = 0;

    if (userNovels?.length) {
      const novelIds = userNovels.map((n) => n.id);
      const [{ count: chapters }, { count: favs }] = await Promise.all([
        supabase.from('chapters').select('*', { count: 'exact', head: true }).in('novel_id', novelIds),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).in('novel_id', novelIds),
      ]);
      chapterCount = chapters || 0;
      favoriteCount = favs || 0;
    }

    setStats({
      novels: novelCount || 0,
      chapters: chapterCount,
      followers: followerCount || 0,
      following: followingCount || 0,
      favorites: favoriteCount,
    });

    setNovels(userNovels || []);
    setCollections(userCollections || []);
    setActivity(userActivity || []);
  }, [id]);

  useEffect(() => {
    loadProfileData();
  }, [id, loadProfileData]);

  useEffect(() => {
    function onFollowChanged(e) {
      try {
        const { targetId } = e.detail || {};
        if (targetId === id) {
          loadProfileData();
        }
      } catch (err) {
        // ignore
      }
    }

    window.addEventListener('follow-changed', onFollowChanged);
    return () => window.removeEventListener('follow-changed', onFollowChanged);
  }, [id, loadProfileData]);

  if (!profile) {
    return (
      <SiteLayout>
        <main className="detail-page"><section className="reader-card">Perfil no encontrado.</section></main>
      </SiteLayout>
    );
  }

  const social = profile.social_links || {};

  return (
    <SiteLayout>
      <SEO title={profile.display_name} description={profile.bio} image={profile.avatar_url} />

      <main className="detail-page">
        <section className="profile-page">
          <div
            className="profile-banner-large"
            style={{ backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined }}
          />

          <div className="profile-header">
            <div className="profile-avatar-large">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name} />
              ) : (
                <span>{(profile.display_name || '?')[0]}</span>
              )}
            </div>

            <div className="profile-header-info">
              <span className="detail-pill">@{profile.username || 'usuario'}</span>
              <h1>{profile.display_name || 'Usuario'}</h1>
              <p className="detail-meta">{profile.country || 'Sin país'}</p>

              {profile.created_at && (
                <p className="profile-joined">
                  <Calendar size={14} /> Miembro desde {new Date(profile.created_at).toLocaleDateString('es')}
                </p>
              )}

              <div className="profile-actions">
                <FollowButton userId={id} />
                {currentUserId === id && (
                  <Link to="/profile/edit" className="secondary-action">Editar perfil</Link>
                )}
              </div>
            </div>
          </div>

          <p className="detail-synopsis">{profile.bio || 'Este usuario todavía no tiene biografía.'}</p>

          {(social.instagram || social.twitter || social.tiktok || social.website) && (
            <div className="profile-social-links">
              {social.website && <a href={social.website} target="_blank" rel="noreferrer">Web</a>}
              {social.instagram && <a href={social.instagram} target="_blank" rel="noreferrer">Instagram</a>}
              {social.twitter && <a href={social.twitter} target="_blank" rel="noreferrer">X</a>}
              {social.tiktok && <a href={social.tiktok} target="_blank" rel="noreferrer">TikTok</a>}
            </div>
          )}

          <div className="profile-stats">
            <div><strong>{stats.novels}</strong><span>Novelas</span></div>
            <div><strong>{stats.chapters}</strong><span>Capítulos</span></div>
            <div><strong>{stats.followers}</strong><span>Seguidores</span></div>
            <div><strong>{stats.following}</strong><span>Siguiendo</span></div>
            <div><strong>{stats.favorites}</strong><span>Favoritos recibidos</span></div>
          </div>

          {novels.length > 0 && (
            <section className="profile-section">
              <h2><BookOpen size={20} /> Novelas</h2>
              <div className="novel-grid">
                {novels.map((novel) => (
                  <Link key={novel.id} to={`/novel/${novel.id}`} className="novel-card">
                    <div className="cover-frame">
                      <img src={novel.cover_url || '/placeholder-cover.png'} alt={novel.title} loading="lazy" />
                    </div>
                    <div className="novel-body">
                      <h3>{novel.title}</h3>
                      <p>{novel.author || 'Sin autor'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {collections.length > 0 && (
            <section className="profile-section">
              <h2><Heart size={20} /> Colecciones públicas</h2>
              <div className="collections-grid">
                {collections.map((col) => (
                  <article key={col.id} className="collection-card">
                    <h3>{col.name}</h3>
                    <p>{col.description}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activity.length > 0 && (
            <section className="profile-section">
              <h2><Users size={20} /> Actividad reciente</h2>
              <div className="activity-list">
                {activity.map((item) => (
                  <article key={item.id} className="activity-item">
                    <span className="detail-pill">{item.type}</span>
                    <time>{new Date(item.created_at).toLocaleDateString('es')}</time>
                  </article>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
    </SiteLayout>
  );
}
