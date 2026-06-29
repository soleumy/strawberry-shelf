import React, { useEffect, useState } from 'react';
import { getRecentActivity, getFeedForUser } from '../lib/api/activity';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

function Avatar({ src, alt }) {
  if (src) return <img className="avatar-xs" src={src} alt={alt} />;
  return <div className="avatar-xs placeholder">{(alt || '?')[0]}</div>;
}

function ActivityItem({ item, profiles }) {
  const text = {
    new_chapter: 'nuevo capítulo',
    new_novel: 'nueva novela',
    favorite: 'marcó como favorito',
    follow: 'comenzó a seguir',
    comment: 'comentó',
  }[item.type] || item.type;

  const profile = profiles?.get(item.user_id);
  const display = profile ? (profile.display_name || profile.username) : item.user_id;

  return (
    <article className="activity-item">
      <div className="activity-left">
        <Avatar src={profile?.avatar_url} alt={profile?.display_name || profile?.username} />
      </div>
      <div className="activity-body">
        <div><strong>{display}</strong> {text}</div>
        <div className="muted">{new Date(item.created_at).toLocaleString()}</div>
      </div>
      {item.reference_id && <Link to={`/${item.type === 'new_novel' ? 'novel' : 'novel'}/${item.reference_id}`}>ver</Link>}
    </article>
  );
}

export default function FeedPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        const userId = sessionData.session.user.id;
        const { data } = await getFeedForUser(userId);
        setItems(data || []);
      } else {
        const { data } = await getRecentActivity();
        setItems(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  // fetch profile info for user ids in items
  useEffect(() => {
    async function loadProfiles() {
      const ids = [...new Set((items || []).map((i) => i.user_id).filter(Boolean))];
      if (ids.length === 0) return setProfilesMap(new Map());
      const { data } = await supabase.from('profiles').select('id,username,display_name,avatar_url').in('id', ids);
      const map = new Map();
      (data || []).forEach((p) => map.set(p.id, p));
      setProfilesMap(map);
    }
    loadProfiles();
  }, [items]);

  const [profilesMap, setProfilesMap] = useState(new Map());

  return (
    <main className="detail-page">
      <section className="reader-card">
        <p className="reader-novel">Feed</p>
        <h1>Actividad</h1>

        {loading && <p>Cargando actividad...</p>}

        {!loading && items.length === 0 && <div className="empty-state">No hay actividad reciente.</div>}

        <div className="activity-list">
          {items.map((it) => <ActivityItem key={it.id} item={it} profiles={profilesMap} />)}
        </div>
      </section>
    </main>
  );
}
