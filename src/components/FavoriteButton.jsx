import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function FavoriteButton({ novelId }) {
  const [session, setSession] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  async function loadSession() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session || null);
    return data.session || null;
  }

  async function loadFavorite(currentSession) {
    const { count: total } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId);

    setCount(total || 0);

    if (!currentSession?.user) {
      setIsFavorite(false);
      return;
    }

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('novel_id', novelId)
      .eq('user_id', currentSession.user.id)
      .maybeSingle();

    setIsFavorite(Boolean(data));
  }

  async function toggleFavorite() {
    const currentSession = session || await loadSession();

    if (!currentSession?.user) {
      alert('Inicia sesión para añadir favoritos.');
      return;
    }

    setLoading(true);

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('novel_id', novelId)
        .eq('user_id', currentSession.user.id);
    } else {
      await supabase.from('favorites').insert({
        novel_id: novelId,
        user_id: currentSession.user.id,
      });
    }

    await loadFavorite(currentSession);
    setLoading(false);
  }

  useEffect(() => {
    async function start() {
      const currentSession = await loadSession();
      await loadFavorite(currentSession);
    }

    start();
  }, [novelId]);

  return (
    <button type="button" className="secondary-action" onClick={toggleFavorite} disabled={loading}>
      <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
      {isFavorite ? 'En favoritos' : 'Añadir a favoritos'} · {count}
    </button>
  );
}