import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { listUserCollections } from '../lib/api/collections';

export default function CollectionsPage() {
  const { userId } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) { setLoading(false); return; }
      const { data } = await listUserCollections(userId);
      setCollections(data || []);
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) return <div className="page"><div className="card">Cargando colecciones...</div></div>;

  return (
    <main className="collections-page">
      <div className="page-header-row">
        <div>
          <p className="reader-novel">Colecciones</p>
          <h1>Mis colecciones</h1>
        </div>
        <Link to="/dashboard/collections" className="primary-action">Administrar colecciones</Link>
      </div>

      {collections.length === 0 && <div className="empty-state">No tienes colecciones aún.</div>}

      <div className="collection-grid">
        {collections.map((c) => (
          <article key={c.id} className="collection-card">
            {c.cover_url && <img src={c.cover_url} alt={c.name} />}
            <h3>{c.name}</h3>
            <p>{c.description}</p>
            <div className="card-actions">
              <Link to={`/collection/${c.id}`} className="button">Ver</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
