import React, { useEffect, useState } from 'react';
import { Eye, Heart, MessageCircle, Star, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function NovelStats({ novelId }) {
  const [stats, setStats] = useState({ views: 0, favorites: 0, comments: 0, rating: 0, followers: 0 });

  useEffect(() => {
    async function load() {
      const [
        { count: favCount },
        { count: commentCount },
        { data: ratings },
      ] = await Promise.all([
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('novel_id', String(novelId)),
        supabase.from('comments').select('*', { count: 'exact', head: true }).eq('novel_id', String(novelId)),
        supabase.from('ratings').select('score').eq('novel_id', String(novelId)),
      ]);

      const scores = ratings || [];
      const avg = scores.length ? scores.reduce((s, r) => s + r.score, 0) / scores.length : 0;

      setStats({
        favorites: favCount || 0,
        comments: commentCount || 0,
        rating: Math.round(avg * 10) / 10,
        views: 0,
        followers: 0,
      });
    }

    load();
  }, [novelId]);

  return (
    <div className="novel-stats">
      <span><Eye size={14} /> {stats.views} lecturas</span>
      <span><Heart size={14} /> {stats.favorites} favoritos</span>
      <span><MessageCircle size={14} /> {stats.comments} comentarios</span>
      <span><Star size={14} /> {stats.rating || '—'} valoración</span>
      <span><Users size={14} /> {stats.followers} seguidores</span>
    </div>
  );
}
