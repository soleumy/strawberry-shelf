import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Home } from 'lucide-react';
import { supabase } from './lib/supabase';
import { getNovelAuthorName, enrichNovelAuthors } from './lib/novelUtils';
import { CustomCursor } from './components/CustomCursor';
import { MobileNav } from './components/MobileNav';
import { FavoriteButton } from './components/FavoriteButton';
import { ReadingStatusButton } from './components/ReadingStatusButton';
import { ContinueReading } from './components/ContinueReading';
import { RatingStars } from './components/RatingStars';
import { NovelStats } from './components/NovelStats';
import { CommentsSection } from './components/CommentsSection';
import { ReaderSettings, useReaderSettings } from './components/ReaderSettings';
import { ReportButton } from './components/ReportButton';
import { SEO } from './components/SEO';
import { findLocalNovel } from './lib/novelUtils';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const Library = lazy(() => import('./pages/Library').then((m) => ({ default: m.Library })));
const UserProfile = lazy(() => import('./pages/UserProfile').then((m) => ({ default: m.UserProfile })));
const EditProfile = lazy(() => import('./pages/EditProfile').then((m) => ({ default: m.EditProfile })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout').then((m) => ({ default: m.DashboardLayout })));
const MyNovels = lazy(() => import('./pages/dashboard/MyNovels').then((m) => ({ default: m.MyNovels })));
const EditNovel = lazy(() => import('./pages/dashboard/EditNovel').then((m) => ({ default: m.EditNovel })));
const ChapterManager = lazy(() => import('./pages/dashboard/ChapterManager').then((m) => ({ default: m.ChapterManager })));
const ChapterEditor = lazy(() => import('./pages/dashboard/ChapterManager').then((m) => ({ default: m.ChapterEditor })));
const Collections = lazy(() => import('./pages/dashboard/Collections').then((m) => ({ default: m.Collections })));
const CollectionsPage = lazy(() => import('./pages/Collections').then((m) => ({ default: m.default })));
const FeedPage = lazy(() => import('./pages/Feed').then((m) => ({ default: m.default })));
const Notifications = lazy(() => import('./pages/dashboard/Notifications').then((m) => ({ default: m.Notifications })));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const Drafts = lazy(() => import('./pages/dashboard/Drafts').then((m) => ({ default: m.Drafts })));
const Messages = lazy(() => import('./pages/dashboard/Messages').then((m) => ({ default: m.Messages })));
const SearchPage = lazy(() => import('./pages/Search').then((m) => ({ default: m.default })));

function PageLoader() {
  return <div className="loading-screen">Cargando...</div>;
}

function NovelDetails() {
  const { id } = useParams();
  const [novel, setNovel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNovel() {
      const { data } = await supabase.from('novels').select('*, chapters(*), author:profiles(username, full_name)').eq('id', id).maybeSingle();
      const novel = data || findLocalNovel(id) || null;
      const finalNovel = novel && data ? (await enrichNovelAuthors([novel]))[0] : novel;
      setNovel(finalNovel || null);
      setLoading(false);
    }

    loadNovel();
  }, [id]);

  if (loading) return <div className="reader-page"><div className="reader-card">Cargando...</div></div>;
  if (!novel) return <div className="reader-page"><div className="reader-card"><h1>Novela no encontrada</h1><Link to="/" className="reader-button">Volver</Link></div></div>;

  const chapters = [...(novel.chapters || [])].sort((a, b) => a.chapter_order - b.chapter_order);

  return (
    <main className="detail-page">
      <SEO title={novel.title} description={novel.synopsis} image={novel.cover_url || novel.cover} />
      <Link to="/" className="back-link"><ArrowLeft size={18} /> Volver al catálogo</Link>

      <section className="detail-card">
        <div className="detail-cover">
          <img src={novel.cover_url || novel.cover || '/placeholder-cover.png'} alt={novel.title} />
        </div>

        <div className="detail-content">
          <span className="detail-pill">{novel.status || novel.publication_status}</span>
          <h1>{novel.title}</h1>
          <p className="detail-meta">{getNovelAuthorName(novel)}{novel.translator ? ` · Trad: ${novel.translator}` : ''}</p>
          <p className="detail-synopsis">{novel.synopsis || 'Sin sinopsis.'}</p>

          {(novel.genres || novel.tags)?.length > 0 && (
            <div className="tag-row">
              {(novel.genres || novel.tags).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          )}

          <RatingStars novelId={novel.id} />
          <NovelStats novelId={novel.id} />

          <div className="detail-actions">
            <FavoriteButton novelId={novel.id} />
            <ReadingStatusButton novelId={novel.id} />
            <ContinueReading novelId={novel.id} />
            <ReportButton targetType="novel" targetId={novel.id} />
          </div>

          <h2>Capítulos ({chapters.length})</h2>
          <div className="chapter-list">
            {chapters.map((chapter, index) => (
              <Link key={chapter.id} to={`/novel/${novel.id}/chapter/${chapter.id}`} className="chapter-link">
                <BookOpen size={17} />
                <span>{chapter.title || `Capítulo ${index + 1}`}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <MobileNav />
    </main>
  );
}

function Reader() {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const { settings, update } = useReaderSettings();

  const [novel, setNovel] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function loadReader() {
      const { data } = await supabase.from('novels').select('*, chapters(*), author:profiles(username, full_name)').eq('id', novelId).maybeSingle();
      const foundNovelRaw = data || findLocalNovel(novelId);
      const foundNovel = data ? (await enrichNovelAuthors([foundNovelRaw]))[0] : foundNovelRaw;
      const sorted = [...(foundNovel?.chapters || [])].sort((a, b) => a.chapter_order - b.chapter_order);
      const current = sorted.find((item) => String(item.id) === String(chapterId));

      setNovel(foundNovel || null);
      setChapters(sorted);
      setChapter(current || null);

      if (current?.content) {
        setText(current.content);
      } else if (current?.file_url && current.file_type !== 'pdf') {
        const response = await fetch(current.file_url);
        setText(await response.text());
      }

      setLoading(false);

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user && foundNovel && current) {
        const { data: historyData } = await supabase
          .from('reading_history')
          .select('*')
          .eq('user_id', sessionData.session.user.id)
          .eq('novel_id', foundNovel.id)
          .maybeSingle();

        if (historyData?.chapter_id === current.id && historyData.scroll_position > 0) {
          setTimeout(() => window.scrollTo({ top: historyData.scroll_position, behavior: 'smooth' }), 400);
        }
      }
    }

    loadReader();
  }, [novelId, chapterId]);

  useEffect(() => {
    function updateProgress() {
      const scrollTop = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(totalHeight <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((scrollTop / totalHeight) * 100))));
    }

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  useEffect(() => {
    async function saveHistory() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user || !novel || !chapter) return;

      await supabase.from('reading_history').upsert({
        user_id: sessionData.session.user.id,
        novel_id: novel.id,
        chapter_id: chapter.id,
        scroll_position: Math.floor(window.scrollY),
        progress_percent: progress,
        updated_at: new Date().toISOString(),
      });
    }

    if (!novel || !chapter) return;
    const interval = setInterval(saveHistory, 5000);
    return () => { clearInterval(interval); saveHistory(); };
  }, [novel, chapter, progress]);

  if (loading) return <div className="reader-page"><div className="reader-card">Cargando...</div></div>;
  if (!novel || !chapter) return <div className="reader-page"><div className="reader-card"><h1>Capítulo no encontrado</h1><Link to="/" className="reader-button">Volver</Link></div></div>;

  const index = chapters.findIndex((item) => String(item.id) === String(chapter.id));
  const previous = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;
  const chapterProgress = chapters.length ? Math.round(((index + progress / 100) / chapters.length) * 100) : progress;

  const readerStyle = {
    fontSize: `${settings.fontSize}px`,
    fontFamily: settings.fontFamily,
    maxWidth: `${settings.lineWidth}px`,
    padding: `${settings.margin}px`,
  };

  return (
    <main className={`reader-page ${settings.darkMode ? 'reader-dark' : ''} ${settings.pageMode ? 'reader-paged' : ''}`}>
      <SEO title={`${chapter.title} · ${novel.title}`} />

      <div className="reader-topbar">
        <Link to={`/novel/${novel.id}`}><ArrowLeft size={17} /> Índice</Link>
        <Link to="/"><Home size={17} /> Catálogo</Link>
        <ReaderSettings settings={settings} update={update} />
      </div>

      <article className="reader-card" style={readerStyle}>
        <p className="reader-novel">{novel.title}</p>
        <h1>{chapter.title}</h1>

        <div className="reading-progress">
          <span>Capítulo {index + 1} de {chapters.length}</span>
          <strong>{chapterProgress}%</strong>
          <div><i style={{ width: `${chapterProgress}%` }} /></div>
        </div>

        {chapter.file_type === 'pdf' && chapter.file_url ? (
          <iframe className="pdf-reader" src={chapter.file_url} title={chapter.title} />
        ) : (
          <div className="reader-text">{text}</div>
        )}
      </article>

      <CommentsSection novelId={novelId} chapterId={chapterId} />

      <div className="reader-navigation">
        <button type="button" disabled={!previous} onClick={() => navigate(`/novel/${novel.id}/chapter/${previous.id}`)}>Anterior</button>
        <button type="button" disabled={!next} onClick={() => navigate(`/novel/${novel.id}/chapter/${next.id}`)}>Siguiente</button>
      </div>

      <MobileNav />
    </main>
  );
}

export default function App() {
  return (
    <HashRouter>
      <CustomCursor />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/library" element={<Library />} />
          <Route path="/novel/:id" element={<NovelDetails />} />
          <Route path="/novel/:novelId/chapter/:chapterId" element={<Reader />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/admin" element={<AdminPage />} />

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="novels" element={<MyNovels />} />
            <Route path="novels/:novelId/edit" element={<EditNovel />} />
            <Route path="novels/:novelId/chapters" element={<ChapterManager />} />
            <Route path="novels/:novelId/chapters/:chapterId/edit" element={<ChapterEditor />} />
            <Route path="novels/new/edit" element={<EditNovel />} />
            <Route path="chapters" element={<MyNovels />} />
            <Route path="collections" element={<Collections />} />
            <Route path="drafts" element={<Drafts />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="messages" element={<Messages />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
