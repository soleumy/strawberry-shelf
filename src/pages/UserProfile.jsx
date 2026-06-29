import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      setProfile(data || null);
    }

    loadProfile();
  }, [id]);

  if (!profile) {
    return (
      <main className="detail-page">
        <section className="reader-card">
          Perfil no encontrado.
        </section>
      </main>
    );
  }

  return (
    <main className="detail-page">
      <section className="detail-card">
        <div className="detail-cover">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name} />
          ) : (
            <div className="empty-state"><UserRound size={48} /></div>
          )}
        </div>

        <div className="detail-content">
          <span className="detail-pill">@{profile.username || 'usuario'}</span>
          <h1>{profile.display_name || 'Usuario'}</h1>
          <p className="detail-meta">{profile.country || 'Sin país'}</p>
          <p className="detail-synopsis">{profile.bio || 'Este usuario todavía no tiene biografía.'}</p>
        </div>
      </section>
    </main>
  );
}