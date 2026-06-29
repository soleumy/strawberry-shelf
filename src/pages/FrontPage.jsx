import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrendingNovels, getNovelsWithRatings } from '../lib/api/search';
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [
        { data: trendingData },
        { data: topData },
        { data: recentData },
      ] = await Promise.all([
        getTrendingNovels(7, 12),
        getNovelsWithRatings(12),
        supabase.from('novels').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(12),
      ]);
      setTrending(trendingData || []);
      setTopRated(topData || []);
      setRecent(recentData || []);
      setLoading(false);
    }
    load();
  }, []);

  function NovelGrid({ novels }) {
    return (
      <div className="novel-grid">
        {novels.map((n) => (
          <Link key={n.id} to={`/novel/${n.id}`} className="novel-card">
            <div className="cover-frame">
              <img src={n.cover_url || '/placeholder-cover.png'} alt={n.title} loading="lazy" />
            </div>
            <div className="novel-body">
              <h3>{n.title}</h3>
              <p>{n.author || 'Sin autor'}</p>
              {n.average_rating > 0 && <span className="rating">⭐ {n.average_rating}</span>}
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <main className="homepage">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Bienvenido a Strawberry Shelf</h1>
          <p>Descubre novelas originales, novelas publicadas, y conecta con autores.</p>
          <div className="hero-cta">
            <Link to="/search" className="primary-action">Explorar novelas</Link>
            <Link to="/feed" className="secondary-action">Ver actividad</Link>
          </div>
        </div>
      </section>

      <section className="content-section">
        <h2>📈 Tendencias esta semana</h2>
        {loading ? <p>Cargando...</p> : <NovelGrid novels={trending} />}
      </section>

      <section className="content-section">
        <h2>⭐ Mejor calificados</h2>
        {loading ? <p>Cargando...</p> : <NovelGrid novels={topRated} />}
      </section>

      <section className="content-section">
        <h2>🆕 Novelas recientes</h2>
        {loading ? <p>Cargando...</p> : <NovelGrid novels={recent} />}
      </section>
    </main>
  );
}
