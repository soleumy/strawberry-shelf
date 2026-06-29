import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Heart, LibraryBig } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NOVELS } from '../utils/data';

const STATUS_LABELS = {
  reading: 'Leyendo',
  want_to_read: 'Quiero leer',
  completed: 'Terminadas',
  paused: 'En pausa',
};

const STATUS_TABS = [
  { id: 'favorites', label: 'Favoritos', icon: Heart },
  { id: 'reading', label: 'Leyendo', icon: BookOpen },
  { id: 'want_to_read', label: 'Quiero leer', icon: LibraryBig },
  { id: 'completed', label: 'Terminadas', icon: BookOpen },
  { id: 'paused', label: 'En pausa', icon: Clock },
  { id: 'history', label: 'Historial', icon: Clock },
];

function normalizeLocalNovel(novel) {
  return {
    id: String(novel.id),
    title: novel.title,
    author: novel.author,
    cover_url: novel.cover,
    chapters: novel.chapters || [],
  };
}

const LOCAL_NOVELS = NOVELS.map(normalizeLocalNovel);

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function findLocalNovel(id) {
  return LOCAL_NOVELS.find((novel) => novel.id === String(id));
}

function LibraryItem({ item }) {
  const novel = item.novel;
  const title = novel?.title || 'Novela no encontrada';
  const author = novel?.author || 'Sin autor';
  const cover = novel?.cover_url || novel?.cover || '/placeholder-cover.png';

  return (
    <Link to={`/novel/${item.novel_id}`} className="library-item">
      <img src={cover} alt={title} />

      <div>
        <h3>{title}</h3>
        <p>{author}</p>

        {item.status && (
          <span>{STATUS_LABELS[item.status] || item.status}</span>
        )}

        {item.progress_percent !== undefined && (
          <span>{item.progress_percent || 0}% leído</span>
        )}
      </div>
    </Link>
  );
}

export function Library() {
  const [activeTab, setActiveTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [readingList, setReadingList] = useState([]);
  const [history, setHistory] = useState([]);
  const [remoteNovels, setRemoteNovels] = useState([]);
  const [loading, setLoading] = useState(true);

  const novelMap = useMemo(() => {
    const map = new Map();

    LOCAL_NOVELS.forEach((novel) => {
      map.set(String(novel.id), novel);
    });

    remoteNovels.forEach((novel) => {
      map.set(String(novel.id), {
        ...novel,
        cover_url: novel.cover_url || novel.cover,
      });
    });

    return map;
  }, [remoteNovels]);

  async function loadLibrary() {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session?.user) {
      setFavorites([]);
      setReadingList([]);
      setHistory([]);
      setLoading(false);
      return;
    }

    const userId = sessionData.session.user.id;

    const [{ data: favoriteRows }, { data: readingRows }, { data: historyRows }] = await Promise.all([
      supabase.from('favorites').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('reading_list').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
      supabase.from('reading_history').select('*').eq('user_id', userId).order('updated_at', { ascending: false }),
    ]);

    const ids = [
      ...(favoriteRows || []).map((item) => item.novel_id),
      ...(readingRows || []).map((item) => item.novel_id),
      ...(historyRows || []).map((item) => item.novel_id),
    ];

    const remoteIds = [...new Set(ids.filter((id) => isUuid(String(id))))];

    if (remoteIds.length > 0) {
      const { data: novelsData } = await supabase
        .from('novels')
        .select('*')
        .in('id', remoteIds);

      setRemoteNovels(novelsData || []);
    } else {
      setRemoteNovels([]);
    }

    setFavorites(favoriteRows || []);
    setReadingList(readingRows || []);
    setHistory(historyRows || []);
    setLoading(false);
  }

  useEffect(() => {
    loadLibrary();
  }, []);

  const visibleItems = useMemo(() => {
    if (activeTab === 'favorites') {
      return favorites.map((item) => ({
        ...item,
        novel: novelMap.get(String(item.novel_id)),
      }));
    }

    if (activeTab === 'history') {
      return history.map((item) => ({
        ...item,
        novel: novelMap.get(String(item.novel_id)),
      }));
    }

    return readingList
      .filter((item) => item.status === activeTab)
      .map((item) => ({
        ...item,
        novel: novelMap.get(String(item.novel_id)),
      }));
  }, [activeTab, favorites, readingList, history, novelMap]);

  return (
    <main className="detail-page">
      <section className="reader-card">
        <p className="reader-novel">Biblioteca personal</p>
        <h1>Mis lecturas</h1>

        <div className="library-tabs">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading && <p className="form-message">Cargando biblioteca...</p>}

        {!loading && visibleItems.length === 0 && (
          <div className="empty-state">
            Todavía no hay novelas en esta sección.
          </div>
        )}

        <div className="library-list">
          {visibleItems.map((item) => (
            <LibraryItem
              key={`${activeTab}-${item.novel_id}-${item.id}`}
              item={item}
            />
          ))}
        </div>
      </section>
    </main>
  );
}