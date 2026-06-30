import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Bookmark, CheckCircle, PauseCircle, FolderHeart, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { findLocalNovel, mergeNovels } from '../lib/novelUtils';
import { getLocalReadingList } from '../lib/localInteractions';

const TABS = [
  { id: 'my_novels', label: 'Mis obras', icon: PenLine },
  { id: 'reading', label: 'Leyendo', icon: BookOpen },
  { id: 'want_to_read', label: 'Por leer', icon: Bookmark },
  { id: 'completed', label: 'Completadas', icon: CheckCircle },
  { id: 'paused', label: 'En pausa', icon: PauseCircle },
];

function getAuthorName(novel) {
  return novel?.author?.display_name || novel?.author?.username || novel?.author_name_override || novel?.author || 'Comunidad';
}

export function Library() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my_novels');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchLibrary() {
    setLoading(true);

    let remoteItems = [];
    let remoteNovels = [];
    let myNovels = [];

    if (supabase.isConfigured !== false && user) {
      const { data: readingData } = await supabase
        .from('reading_list')
        .select(`
          status,
          novel_id,
          novel:novels (
            id,
            title,
            cover_url,
            synopsis,
            author,
            author_name_override,
            author_id,
            status,
            chapters(id),
            author_profile:profiles(display_name, username)
          )
        `)
        .eq('user_id', user.id);

      remoteItems = (readingData || [])
        .filter((item) => item.novel)
        .map((item) => ({
          ...item.novel,
          id: String(item.novel.id),
          library_status: item.status,
          author_name: getAuthorName({
            ...item.novel,
            author: item.novel.author_profile || item.novel.author,
          }),
        }));

      const { data: myNovelData } = await supabase
        .from('novels')
        .select('id, title, cover_url, synopsis, author, author_id, status, chapters(id)')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      myNovels = (myNovelData || []).map((novel) => ({
        ...novel,
        id: String(novel.id),
        library_status: 'my_novels',
        author_name: getAuthorName(novel),
      }));

      remoteNovels = [...remoteItems, ...myNovels];
    }

    const allNovels = mergeNovels(remoteNovels);

    const localItems = getLocalReadingList(user?.id)
      .map((item) => {
        const novel =
          allNovels.find((candidate) => String(candidate.id) === String(item.novel_id)) ||
          findLocalNovel(item.novel_id);

        if (!novel) return null;

        return {
          ...novel,
          id: String(novel.id),
          library_status: item.status,
          author_name: getAuthorName(novel),
        };
      })
      .filter(Boolean);

    const byId = new Map();

    [...myNovels, ...remoteItems, ...localItems].forEach((item) => {
      byId.set(`${item.library_status}:${item.id}`, item);
    });

    setItems([...byId.values()]);
    setLoading(false);
  }

  useEffect(() => {
    fetchLibrary();
    window.addEventListener('strawberry:library-updated', fetchLibrary);

    return () => window.removeEventListener('strawberry:library-updated', fetchLibrary);
  }, [user?.id]);

  const filteredNovels = items.filter((item) => item.library_status === activeTab);

  return (
    <main className="library-page kawaii-dashboard-content">
      <section className="reader-card">
        <div className="page-header-row">
          <div>
            <p className="reader-novel"><FolderHeart size={18} /> Mi biblioteca</p>
            <h1>Mi estantería</h1>
            <p className="muted">Organiza tus lecturas, tus obras y retoma tus novelas cuando quieras.</p>
          </div>

          <Link to="/" className="secondary-action">Volver al catálogo</Link>
        </div>

        <div className="library-tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                className={isActive ? 'active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
                <span>{items.filter((item) => item.library_status === tab.id).length}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="empty-state">Organizando tus estantes...</div>
        ) : filteredNovels.length === 0 ? (
          <div className="empty-state">
            No tienes novelas en "{TABS.find((tab) => tab.id === activeTab)?.label}".
          </div>
        ) : (
          <div className="kawaii-grid">
            {filteredNovels.map((novel) => (
              <Link key={`${novel.library_status}-${novel.id}`} to={`/novel/${novel.id}`} className="kawaii-novel-card">
                <div className="kawaii-cover">
                  <img src={novel.cover_url || novel.cover || '/placeholder-cover.png'} alt={novel.title} loading="lazy" />
                  <span>{novel.chapters?.length || 0} caps</span>
                </div>

                <div>
                  <h3>{novel.title}</h3>
                  <p>{novel.author_name}</p>
                  {novel.library_status === 'my_novels' && (
                    <p>{novel.status === 'approved' ? 'Publicada' : 'Pendiente'}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}