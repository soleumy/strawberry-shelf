import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUp,
  Bookmark,
  BookmarkPlus,
  BookOpen,
  FileText,
  Home,
  Maximize2,
  Share2,
  Trash2,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { findLocalNovel } from './lib/novelUtils';
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

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Library = lazy(() => import('./pages/Library').then((m) => ({ default: m.Library })));
const UserProfile = lazy(() => import('./pages/UserProfile').then((m) => ({ default: m.UserProfile })));
const EditProfile = lazy(() => import('./pages/EditProfile').then((m) => ({ default: m.EditProfile })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout').then((m) => ({ default: m.DashboardLayout })));
const MyNovels = lazy(() => import('./pages/dashboard/MyNovels').then((m) => ({ default: m.MyNovels })));
const EditNovel = lazy(() => import('./pages/dashboard/EditNovel').then((m) => ({ default: m.EditNovel })));
const ChapterManager = lazy(() => import('./pages/dashboard/ManageChapters').then((m) => ({ default: m.ChapterManager })));
const ChapterEditor = lazy(() => import('./pages/dashboard/ManageChapters').then((m) => ({ default: m.ChapterEditor })));
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

async function loadRemoteNovel(novelId) {
  if (supabase.isConfigured === false) return null;

  const { data: novelData, error: novelError } = await supabase
    .from('novels')
    .select('*')
    .eq('id', novelId)
    .maybeSingle();

  if (novelError || !novelData) return null;

  const { data: chaptersData } = await supabase
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .order('chapter_order', { ascending: true });

  let authorProfile = null;

  if (novelData.author_id) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', novelData.author_id)
      .maybeSingle();

    authorProfile = profileData || null;
  }

  return {
    ...novelData,
    id: String(novelData.id),
    author_profile: authorProfile,
    chapters: chaptersData || [],
  };
}

function getAuthorName(novel) {
  return novel?.author_profile?.display_name ||
    novel?.author_profile?.username ||
    novel?.author?.display_name ||
    novel?.author?.username ||
    novel?.author_name_override ||
    novel?.author ||
    'Comunidad';
}

function NovelDetails() {
  const { id } = useParams();
  const [novel, setNovel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNovel() {
      setLoading(true);

      const remoteNovel = await loadRemoteNovel(id);
      const localNovel = findLocalNovel(id);
      const finalNovel = remoteNovel || localNovel || null;

      setNovel(finalNovel);
      setLoading(false);
    }

    loadNovel();
  }, [id]);

  if (loading) {
    return (
      <div className="reader-page">
        <div className="reader-card">Cargando...</div>
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="reader-page">
        <div className="reader-card">
          <h1>Novela no encontrada</h1>
          <Link to="/" className="reader-button">Volver</Link>
        </div>
      </div>
    );
  }

  const chapters = [...(novel.chapters || [])].sort((a, b) => Number(a.chapter_order || 0) - Number(b.chapter_order || 0));

  return (
    <main className="detail-page">
      <SEO title={novel.title} description={novel.synopsis} image={novel.cover_url || novel.cover} />

      <Link to="/" className="back-link">
        <ArrowLeft size={18} /> Volver al catálogo
      </Link>

      <section className="detail-card">
        <div className="detail-cover">
          <img src={novel.cover_url || novel.cover || '/placeholder-cover.png'} alt={novel.title} />
        </div>

        <div className="detail-content">
          <span className="detail-pill">{novel.status || novel.publication_status || 'approved'}</span>
          <h1>{novel.title}</h1>

          <p className="detail-meta">
            <span>{getAuthorName(novel)}</span>
            {novel.translator ? ` · Trad: ${novel.translator}` : ''}
          </p>

          <p className="detail-synopsis">{novel.synopsis || novel.description || 'Sin sinopsis.'}</p>

          {(novel.genres || novel.tags)?.length > 0 && (
            <div className="tag-row">
              {(novel.genres || novel.tags).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          )}

          <div className="detail-stats-box">
            <RatingStars novelId={novel.id} />
            <NovelStats novelId={novel.id} />
          </div>

          <div className="detail-actions">
            <FavoriteButton novelId={novel.id} />
            <ReadingStatusButton novelId={novel.id} />
            <ContinueReading novelId={novel.id} />
            <ReportButton targetType="novel" targetId={novel.id} />
          </div>

          <h2>Capítulos ({chapters.length})</h2>

          <div className="chapter-list">
            {chapters.length === 0 ? (
              <p className="muted">Esta novela todavía no tiene capítulos.</p>
            ) : (
              chapters.map((chapter, index) => (
                <Link key={chapter.id} to={`/novel/${novel.id}/chapter/${chapter.id}`} className="chapter-link">
                  <BookOpen size={17} />
                  <span>{chapter.title || `Capítulo ${index + 1}`}</span>
                </Link>
              ))
            )}
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
  const [restoredScroll, setRestoredScroll] = useState(null);
  const [readerNotice, setReaderNotice] = useState('');
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [highlightsOpen, setHighlightsOpen] = useState(false);
  const [highlightColor, setHighlightColor] = useState('pink');
  const [savingBookmark, setSavingBookmark] = useState(false);
  const [deletingBookmark, setDeletingBookmark] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState(null);
  const [savingHighlight, setSavingHighlight] = useState(false);
  const [deletingHighlight, setDeletingHighlight] = useState(null);

  function showNotice(message) {
    setReaderNotice(message);
    window.setTimeout(() => setReaderNotice(''), 2800);
  }

  function openBookmarks() {
    setBookmarksOpen(true);
    setNotesOpen(false);
    setHighlightsOpen(false);
  }

  function openNotes() {
    setNotesOpen(true);
    setBookmarksOpen(false);
    setHighlightsOpen(false);
  }

  function openHighlights() {
    setHighlightsOpen(true);
    setBookmarksOpen(false);
    setNotesOpen(false);
  }

  function closeAllPanels() {
    setBookmarksOpen(false);
    setNotesOpen(false);
    setHighlightsOpen(false);
  }

  useEffect(() => {
    let active = true;

    async function getSavedProgress(foundNovel, sortedChapters) {
      if (supabase.isConfigured === false) return null;

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;

      if (!currentUser) return null;

      const { data } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('novel_id', String(foundNovel.id))
        .maybeSingle();

      if (!data?.chapter_id) return data || null;

      const savedChapterExists = sortedChapters.some((item) => String(item.id) === String(data.chapter_id));

      if (savedChapterExists && String(data.chapter_id) !== String(chapterId)) {
        navigate(`/novel/${foundNovel.id}/chapter/${data.chapter_id}`, { replace: true });
        return 'redirected';
      }

      return data;
    }

    async function loadReader() {
      setLoading(true);
      setText('');
      setRestoredScroll(null);
      closeAllPanels();

      const remoteNovel = await loadRemoteNovel(novelId);
      const localNovel = findLocalNovel(novelId);
      const foundNovel = remoteNovel || localNovel;

      const sorted = [...(foundNovel?.chapters || [])].sort((a, b) => Number(a.chapter_order || 0) - Number(b.chapter_order || 0));
      const current = sorted.find((item) => String(item.id) === String(chapterId));

      if (!foundNovel || !current) {
        if (active) {
          setNovel(foundNovel || null);
          setChapters(sorted);
          setChapter(current || null);
          setLoading(false);
        }

        return;
      }

      const savedProgress = await getSavedProgress(foundNovel, sorted);

      if (savedProgress === 'redirected') return;

      let chapterText = '';

      if (current.content) {
        chapterText = current.content;
      } else if (current.file_url && current.file_type !== 'pdf') {
        const response = await fetch(current.file_url);
        chapterText = await response.text();
      }

      if (active) {
        setNovel(foundNovel);
        setChapters(sorted);
        setChapter(current);
        setText(chapterText);
        setProgress(Number(savedProgress?.progress_percent || 0));
        setRestoredScroll(Number(savedProgress?.scroll_position || 0));
        setLoading(false);
      }
    }

    loadReader();

    return () => {
      active = false;
    };
  }, [novelId, chapterId, navigate]);

  useEffect(() => {
    if (loading || restoredScroll === null) return undefined;

    const timer = window.setTimeout(() => {
      window.scrollTo({
        top: restoredScroll,
        behavior: restoredScroll > 0 ? 'smooth' : 'auto',
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loading, restoredScroll]);

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
    async function saveProgress() {
      if (supabase.isConfigured === false || !novel || !chapter) return;

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;

      if (!currentUser) return;

      await supabase.from('reading_progress').upsert({
        user_id: currentUser.id,
        novel_id: String(novel.id),
        chapter_id: String(chapter.id),
        scroll_position: Math.floor(window.scrollY),
        progress_percent: progress,
        last_read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,novel_id',
      });
    }

    if (!novel || !chapter) return undefined;

    const interval = window.setInterval(saveProgress, 5000);

    function saveBeforeClose() {
      saveProgress();
    }

    window.addEventListener('beforeunload', saveBeforeClose);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', saveBeforeClose);
      saveProgress();
    };
  }, [novel, chapter, progress]);

  useEffect(() => {
    if (!novel) return;
    loadBookmarks();
    loadNotes();
    loadHighlights();
  }, [novel]);

  async function getCurrentUserOrRedirect(message) {
    if (supabase.isConfigured === false) {
      showNotice('Supabase no está configurado.');
      return null;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user;

    if (!currentUser) {
      showNotice(message || 'Inicia sesión para usar esta función.');
      navigate('/login');
      return null;
    }

    return currentUser;
  }

  async function loadBookmarks() {
    if (supabase.isConfigured === false || !novel) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user;

    if (!currentUser) return;

    const { data, error } = await supabase
      .from('reader_bookmarks')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('novel_id', String(novel.id))
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      showNotice('No se pudieron cargar los marcadores.');
      return;
    }

    setBookmarks(data || []);
  }

  async function saveBookmark() {
    if (!novel || !chapter || savingBookmark) return;

    const currentUser = await getCurrentUserOrRedirect('Inicia sesión para guardar marcadores.');
    if (!currentUser) return;

    setSavingBookmark(true);

    const { error } = await supabase.from('reader_bookmarks').insert({
      user_id: currentUser.id,
      novel_id: String(novel.id),
      chapter_id: String(chapter.id),
      label: chapter.title || 'Marcador',
      scroll_position: Math.floor(window.scrollY),
      progress_percent: progress,
    });

    setSavingBookmark(false);

    if (error) {
      console.error(error);
      showNotice('No se pudo guardar el marcador.');
      return;
    }

    showNotice('Marcador guardado.');
    loadBookmarks();
  }

  async function deleteBookmark(bookmarkId) {
    if (!window.confirm('¿Seguro que quieres borrar este marcador?')) return;
    if (deletingBookmark) return;

    setDeletingBookmark(bookmarkId);

    const currentUser = await getCurrentUserOrRedirect();
    if (!currentUser) {
      setDeletingBookmark(null);
      return;
    }

    const { error } = await supabase
      .from('reader_bookmarks')
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', currentUser.id);

    setDeletingBookmark(null);

    if (error) {
      console.error(error);
      showNotice('No se pudo borrar el marcador.');
      return;
    }

    setBookmarks((current) => current.filter((item) => item.id !== bookmarkId));
    showNotice('Marcador borrado.');
  }

  function goToBookmark(bookmark) {
    const targetPath = `/novel/${novel.id}/chapter/${bookmark.chapter_id}`;

    if (String(bookmark.chapter_id) !== String(chapter.id)) {
      navigate(targetPath);
      return;
    }

    window.scrollTo({
      top: Number(bookmark.scroll_position || 0),
      behavior: 'smooth',
    });
  }

  async function loadNotes() {
    if (supabase.isConfigured === false || !novel) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user;

    if (!currentUser) return;

    const { data, error } = await supabase
      .from('reader_notes')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('novel_id', String(novel.id))
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      showNotice('No se pudieron cargar las notas.');
      return;
    }

    setNotes(data || []);
  }

  async function saveNote() {
    if (!novel || !chapter || savingNote) return;

    const cleanNote = noteDraft.trim();

    if (!cleanNote) {
      showNotice('Escribe una nota primero.');
      return;
    }

    const currentUser = await getCurrentUserOrRedirect('Inicia sesión para guardar notas.');
    if (!currentUser) return;

    setSavingNote(true);

    const selectedText = window.getSelection?.().toString().trim() || null;

    const { error } = await supabase.from('reader_notes').insert({
      user_id: currentUser.id,
      novel_id: String(novel.id),
      chapter_id: String(chapter.id),
      note: cleanNote,
      selected_text: selectedText,
      scroll_position: Math.floor(window.scrollY),
      progress_percent: progress,
    });

    setSavingNote(false);

    if (error) {
      console.error(error);
      showNotice('No se pudo guardar la nota.');
      return;
    }

    setNoteDraft('');
    showNotice('Nota guardada.');
    loadNotes();
  }

  async function deleteNote(noteId) {
    if (!window.confirm('¿Seguro que quieres borrar esta nota?')) return;
    if (deletingNote) return;

    setDeletingNote(noteId);

    const currentUser = await getCurrentUserOrRedirect();
    if (!currentUser) {
      setDeletingNote(null);
      return;
    }

    const { error } = await supabase
      .from('reader_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', currentUser.id);

    setDeletingNote(null);

    if (error) {
      console.error(error);
      showNotice('No se pudo borrar la nota.');
      return;
    }

    setNotes((current) => current.filter((item) => item.id !== noteId));
    showNotice('Nota borrada.');
  }

  function goToNote(note) {
    const targetPath = `/novel/${novel.id}/chapter/${note.chapter_id}`;

    if (String(note.chapter_id) !== String(chapter.id)) {
      navigate(targetPath);
      return;
    }

    window.scrollTo({
      top: Number(note.scroll_position || 0),
      behavior: 'smooth',
    });
  }

  async function loadHighlights() {
    if (supabase.isConfigured === false || !novel) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user;

    if (!currentUser) return;

    const { data, error } = await supabase
      .from('reader_highlights')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('novel_id', String(novel.id))
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      showNotice('No se pudieron cargar las frases favoritas.');
      return;
    }

    setHighlights(data || []);
  }

  async function saveHighlight() {
    if (!novel || !chapter || savingHighlight) return;

    const selectedText = window.getSelection?.().toString().trim();

    if (!selectedText) {
      showNotice('Selecciona texto primero para guardar como frase favorita.');
      return;
    }

    const currentUser = await getCurrentUserOrRedirect('Inicia sesión para guardar frases favoritas.');
    if (!currentUser) return;

    setSavingHighlight(true);

    const { error } = await supabase.from('reader_highlights').insert({
      user_id: currentUser.id,
      novel_id: String(novel.id),
      chapter_id: String(chapter.id),
      selected_text: selectedText,
      color: highlightColor,
      scroll_position: Math.floor(window.scrollY),
      progress_percent: progress,
    });

    setSavingHighlight(false);

    if (error) {
      console.error(error);
      showNotice('No se pudo guardar la frase favorita.');
      return;
    }

    window.getSelection?.().removeAllRanges();
    showNotice('Frase favorita guardada.');
    loadHighlights();
  }

  async function deleteHighlight(highlightId) {
    if (!window.confirm('¿Seguro que quieres borrar esta frase favorita?')) return;
    if (deletingHighlight) return;

    setDeletingHighlight(highlightId);

    const currentUser = await getCurrentUserOrRedirect();
    if (!currentUser) {
      setDeletingHighlight(null);
      return;
    }

    const { error } = await supabase
      .from('reader_highlights')
      .delete()
      .eq('id', highlightId)
      .eq('user_id', currentUser.id);

    setDeletingHighlight(null);

    if (error) {
      console.error(error);
      showNotice('No se pudo borrar la frase favorita.');
      return;
    }

    setHighlights((current) => current.filter((item) => item.id !== highlightId));
    showNotice('Frase favorita borrada.');
  }

  function goToHighlight(highlight) {
    const targetPath = `/novel/${novel.id}/chapter/${highlight.chapter_id}`;

    if (String(highlight.chapter_id) !== String(chapter.id)) {
      navigate(targetPath);
      return;
    }

    window.scrollTo({
      top: Number(highlight.scroll_position || 0),
      behavior: 'smooth',
    });
  }

  async function shareChapter() {
    const shareUrl = window.location.href;
    const shareText = `${chapter?.title || 'Capítulo'} · ${novel?.title || 'Strawberry Shelf'}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareText,
          text: shareText,
          url: shareUrl,
        });
        showNotice('Capítulo compartido.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showNotice('Enlace copiado.');
        return;
      }

      showNotice('Copia el enlace desde la barra del navegador.');
    } catch {
      showNotice('No se pudo compartir ahora.');
    }
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        showNotice('Pantalla completa activada.');
        return;
      }

      await document.exitFullscreen?.();
      showNotice('Pantalla completa desactivada.');
    } catch {
      showNotice('El navegador no permitió pantalla completa.');
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  if (loading) {
    return (
      <div className="reader-page">
        <div className="reader-card">Cargando...</div>
      </div>
    );
  }

  if (!novel || !chapter) {
    return (
      <div className="reader-page">
        <div className="reader-card">
          <h1>Capítulo no encontrado</h1>
          <Link to={`/novel/${novelId}`} className="reader-button">Volver</Link>
        </div>
      </div>
    );
  }

  const index = chapters.findIndex((item) => String(item.id) === String(chapter.id));
  const previous = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;
  const chapterProgress = chapters.length ? Math.round(((index + progress / 100) / chapters.length) * 100) : progress;

  const readerStyle = {
    fontSize: `${settings.fontSize}px`,
    fontFamily: settings.fontFamily,
    maxWidth: `${settings.lineWidth}px`,
    lineHeight: settings.lineHeight,
    padding: `${settings.margin}px`,
  };

  return (
    <main className={`reader-page reader-theme-${settings.theme} ${settings.darkMode ? 'reader-dark' : ''} ${settings.pageMode ? 'reader-paged' : ''}`}>
      <SEO title={`${chapter.title} · ${novel.title}`} />

      <div className="reader-topbar">
        <Link to={`/novel/${novel.id}`}>
          <ArrowLeft size={17} /> Índice
        </Link>

        <Link to="/">
          <Home size={17} /> Catálogo
        </Link>

        <ReaderSettings settings={settings} update={update} />
      </div>

      <article className="reader-card" style={readerStyle}>
        <div className="reader-toolbar">
          <button
            type="button"
            onClick={saveBookmark}
            title="Guardar marcador"
            aria-label="Guardar marcador"
            disabled={savingBookmark}
          >
            {savingBookmark ? <span className="reader-spinner" /> : <BookmarkPlus size={18} />}
          </button>

          <button
            type="button"
            onClick={bookmarksOpen ? closeAllPanels : openBookmarks}
            title="Ver marcadores"
            aria-label="Ver marcadores"
            className={bookmarksOpen ? 'reader-toolbar-active' : ''}
          >
            <Bookmark size={18} />
            {bookmarks.length > 0 && <span className="reader-badge">{bookmarks.length}</span>}
          </button>

          <button
            type="button"
            onClick={notesOpen ? closeAllPanels : openNotes}
            title="Notas privadas"
            aria-label="Notas privadas"
            className={notesOpen ? 'reader-toolbar-active' : ''}
          >
            <FileText size={18} />
            {notes.length > 0 && <span className="reader-badge">{notes.length}</span>}
          </button>

          <button
            type="button"
            onClick={highlightsOpen ? closeAllPanels : openHighlights}
            title="Frases favoritas"
            aria-label="Frases favoritas"
            className={highlightsOpen ? 'reader-toolbar-active' : ''}
          >
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>✦</span>
            {highlights.length > 0 && <span className="reader-badge">{highlights.length}</span>}
          </button>

          <button type="button" onClick={shareChapter} title="Compartir capítulo" aria-label="Compartir capítulo">
            <Share2 size={18} />
          </button>

          <button type="button" onClick={toggleFullscreen} title="Pantalla completa" aria-label="Pantalla completa">
            <Maximize2 size={18} />
          </button>
        </div>

        {readerNotice && (
          <div className="reader-notice" role="status">
            {readerNotice}
          </div>
        )}

        {bookmarksOpen && (
          <div className="reader-bookmarks-panel">
            <div className="reader-bookmarks-head">
              <strong>Marcadores</strong>
              <button type="button" onClick={loadBookmarks}>Actualizar</button>
            </div>

            {bookmarks.length === 0 ? (
              <p>No tienes marcadores en esta novela.</p>
            ) : (
              <div className="reader-bookmarks-list">
                {bookmarks.map((bookmark) => (
                  <article key={bookmark.id} className="reader-bookmark-item">
                    <button type="button" onClick={() => goToBookmark(bookmark)}>
                      <span>{bookmark.label || 'Marcador'}</span>
                      <small>
                        Capítulo {bookmark.chapter_id} · {Math.round(Number(bookmark.progress_percent || 0))}%
                      </small>
                    </button>

                    <button
                      type="button"
                      className="reader-bookmark-delete"
                      onClick={() => deleteBookmark(bookmark.id)}
                      aria-label="Borrar marcador"
                      title="Borrar marcador"
                      disabled={deletingBookmark === bookmark.id}
                    >
                      {deletingBookmark === bookmark.id ? <span className="reader-spinner" /> : <Trash2 size={16} />}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {notesOpen && (
          <div className="reader-notes-panel">
            <div className="reader-bookmarks-head">
              <strong>Notas privadas</strong>
              <button type="button" onClick={loadNotes}>Actualizar</button>
            </div>

            <div className="reader-note-form">
              <textarea
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Escribe una nota privada sobre este momento de la lectura..."
              />

              <button type="button" onClick={saveNote} disabled={savingNote}>
                {savingNote ? 'Guardando...' : 'Guardar nota'}
              </button>
            </div>

            {notes.length === 0 ? (
              <p>No tienes notas en esta novela.</p>
            ) : (
              <div className="reader-bookmarks-list">
                {notes.map((note) => (
                  <article key={note.id} className="reader-note-item">
                    <button type="button" onClick={() => goToNote(note)}>
                      {note.selected_text && <small>"{note.selected_text}"</small>}
                      <span>{note.note}</span>
                      <small>
                        Capítulo {note.chapter_id} · {Math.round(Number(note.progress_percent || 0))}%
                      </small>
                    </button>

                    <button
                      type="button"
                      className="reader-bookmark-delete"
                      onClick={() => deleteNote(note.id)}
                      aria-label="Borrar nota"
                      title="Borrar nota"
                      disabled={deletingNote === note.id}
                    >
                      {deletingNote === note.id ? <span className="reader-spinner" /> : <Trash2 size={16} />}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {highlightsOpen && (
          <div className="reader-highlights-panel">
            <div className="reader-bookmarks-head">
              <strong>Frases favoritas</strong>
              <button type="button" onClick={loadHighlights}>Actualizar</button>
            </div>

            <div className="reader-highlight-actions">
              <span>Selecciona texto del capítulo y elige un color:</span>
              <div className="highlight-color-picker">
                <button
                  type="button"
                  className={`highlight-pink ${highlightColor === 'pink' ? 'active' : ''}`}
                  onClick={() => setHighlightColor('pink')}
                  aria-label="Color rosa"
                />
                <button
                  type="button"
                  className={`highlight-yellow ${highlightColor === 'yellow' ? 'active' : ''}`}
                  onClick={() => setHighlightColor('yellow')}
                  aria-label="Color amarillo"
                />
                <button
                  type="button"
                  className={`highlight-mint ${highlightColor === 'mint' ? 'active' : ''}`}
                  onClick={() => setHighlightColor('mint')}
                  aria-label="Color menta"
                />
                <button
                  type="button"
                  className={`highlight-lavender ${highlightColor === 'lavender' ? 'active' : ''}`}
                  onClick={() => setHighlightColor('lavender')}
                  aria-label="Color lavanda"
                />
              </div>
              <button type="button" onClick={saveHighlight} disabled={savingHighlight}>
                {savingHighlight ? 'Guardando...' : 'Guardar frase favorita'}
              </button>
            </div>

            {highlights.length === 0 ? (
              <p>No tienes frases favoritas en esta novela.</p>
            ) : (
              <div className="reader-bookmarks-list">
                {highlights.map((highlight) => (
                  <article key={highlight.id} className="reader-highlight-item">
                    <button type="button" onClick={() => goToHighlight(highlight)}>
                      <span className={`highlight-text-${highlight.color || 'pink'}`}>
                        "{highlight.selected_text}"
                      </span>
                      <small>
                        Capítulo {highlight.chapter_id} · {Math.round(Number(highlight.progress_percent || 0))}%
                      </small>
                    </button>

                    <button
                      type="button"
                      className="reader-bookmark-delete"
                      onClick={() => deleteHighlight(highlight.id)}
                      aria-label="Borrar frase favorita"
                      title="Borrar frase favorita"
                      disabled={deletingHighlight === highlight.id}
                    >
                      {deletingHighlight === highlight.id ? <span className="reader-spinner" /> : <Trash2 size={16} />}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

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
          <div className="reader-text" style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
        )}

        <div className="reader-toolbar">
          <button type="button" onClick={scrollToTop} title="Volver arriba" aria-label="Volver arriba">
            <ArrowUp size={18} />
          </button>
        </div>
      </article>

      <CommentsSection novelId={novelId} chapterId={chapterId} />

      <div className="reader-navigation">
        <button
          type="button"
          disabled={!previous}
          onClick={() => navigate(`/novel/${novel.id}/chapter/${previous.id}`)}
        >
          Anterior
        </button>

        <button
          type="button"
          disabled={!next}
          onClick={() => navigate(`/novel/${novel.id}/chapter/${next.id}`)}
        >
          Siguiente
        </button>
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
          <Route path="/catalogo" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
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