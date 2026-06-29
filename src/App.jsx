import React, { useEffect, useMemo, useState } from 'react';
import { HashRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, Heart, Home, Search, Send, Sparkles, Upload, UserRound, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { CustomCursor } from './components/CustomCursor';

const WHATSAPP_URL = 'https://wa.link/4rpknp';

function scrollToSection(id) {
  if (id === 'inicio') window.scrollTo({ top: 0, behavior: 'smooth' });
  else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function safeFileName(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
}

function getFileType(file) {
  if (!file) return 'text';
  return file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'text';
}

function AuthBox({ session, profile, reloadSession }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    setMessage(mode === 'login' ? 'Sesión iniciada.' : 'Cuenta creada.');
    reloadSession();
  }

  async function logout() {
    await supabase.auth.signOut();
    reloadSession();
  }

  if (session) {
    return (
      <div className="auth-card">
        <span className="section-pill"><UserRound size={16} /> Sesión activa</span>
        <h3>{session.user.email}</h3>
        <p>{profile?.role === 'admin' ? 'Administrador' : 'Usuario'}</p>
        <button type="button" className="secondary-action" onClick={logout}>Cerrar sesión</button>
      </div>
    );
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <span className="section-pill">Iniciar sesión</span>

      <label>
        Correo
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>

      <label>
        Contraseña
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </label>

      <button type="submit" className="primary-action">
        {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
      </button>

      <button type="button" className="text-button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
      </button>

      {message && <p className="form-message">{message}</p>}
    </form>
  );
}

function UploadNovel({ session, reloadNovels }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [chapterTitle, setChapterTitle] = useState('Capítulo único');
  const [content, setContent] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [novelFile, setNovelFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function uploadFile(bucket, file) {
    if (!file) return null;

    const path = `${session.user.id}/${Date.now()}-${safeFileName(file.name)}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async function submit(event) {
    event.preventDefault();
    setMessage('');

    if (!session) {
      setMessage('Debes iniciar sesión para subir una novela.');
      return;
    }

    if (!novelFile && !content.trim()) {
      setMessage('Sube un PDF/TXT o escribe el contenido.');
      return;
    }

    setSaving(true);

    try {
      const coverUrl = await uploadFile('covers', coverFile);
      const fileUrl = await uploadFile('novel-files', novelFile);

      const { data: novel, error: novelError } = await supabase
        .from('novels')
        .insert({
          title,
          author,
          synopsis,
          status: 'pending',
          cover_url: coverUrl,
          source_type: novelFile ? getFileType(novelFile) : 'text',
          created_by: session.user.id,
        })
        .select()
        .single();

      if (novelError) throw novelError;

      const { error: chapterError } = await supabase.from('chapters').insert({
        novel_id: novel.id,
        title: chapterTitle || 'Capítulo único',
        content: content || null,
        file_url: fileUrl,
        file_type: novelFile ? getFileType(novelFile) : 'text',
        chapter_order: 1,
      });

      if (chapterError) throw chapterError;

      setMessage('Novela enviada. Quedará pendiente hasta que Uriel la apruebe.');
      setTitle('');
      setAuthor('');
      setSynopsis('');
      setChapterTitle('Capítulo único');
      setContent('');
      setCoverFile(null);
      setNovelFile(null);
      event.target.reset();
      reloadNovels();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={submit}>
      <label>
        Título de la novela
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <label>
        Autor / traductor / fuente
        <input value={author} onChange={(e) => setAuthor(e.target.value)} />
      </label>

      <label>
        Sinopsis
        <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} rows="3" />
      </label>

      <label>
        Portada
        <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
      </label>

      <label>
        Título del capítulo
        <input value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
      </label>

      <label>
        PDF o TXT
        <input type="file" accept=".pdf,.txt" onChange={(e) => setNovelFile(e.target.files?.[0] || null)} />
      </label>

      <label>
        O escribe la novela aquí
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows="8" />
      </label>

      <button type="submit" className="primary-action" disabled={saving}>
        {saving ? 'Enviando...' : 'Enviar novela'} <Upload size={18} />
      </button>

      {message && <p className="form-message">{message}</p>}
    </form>
  );
}

function AdminPanel({ profile, reloadNovels }) {
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState('');

  async function loadPending() {
    const { data } = await supabase
      .from('novels')
      .select('*, chapters(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setPending(data || []);
  }

  useEffect(() => {
    if (profile?.role === 'admin') loadPending();
  }, [profile]);

  async function updateStatus(id, status) {
    const { error } = await supabase.from('novels').update({ status }).eq('id', id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(status === 'approved' ? 'Novela aprobada.' : 'Novela denegada.');
    loadPending();
    reloadNovels();
  }

  if (profile?.role !== 'admin') return null;

  return (
    <section id="admin" className="admin-panel">
      <div className="catalog-heading">
        <div>
          <span>Administrador</span>
          <h2>Aprobar novelas</h2>
        </div>
      </div>

      {pending.length === 0 && <p className="form-message">No hay novelas pendientes.</p>}

      <div className="admin-list">
        {pending.map((novel) => (
          <article key={novel.id} className="admin-item">
            {novel.cover_url && <img src={novel.cover_url} alt={novel.title} />}

            <div>
              <h3>{novel.title}</h3>
              <p>{novel.author || 'Sin autor'}</p>
              <p>{novel.synopsis || 'Sin sinopsis.'}</p>

              <div className="admin-actions">
                <button type="button" onClick={() => updateStatus(novel.id, 'approved')}>
                  <Check size={17} /> Aprobar
                </button>

                <button type="button" onClick={() => updateStatus(novel.id, 'rejected')}>
                  <X size={17} /> Denegar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {message && <p className="form-message">{message}</p>}
    </section>
  );
}

function HomePage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [novels, setNovels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadSession() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session || null);

    if (data.session?.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      setProfile(profileData || null);
    } else {
      setProfile(null);
    }
  }

  async function loadNovels() {
    const { data } = await supabase
      .from('novels')
      .select('*, chapters(*)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    setNovels(data || []);
  }

  useEffect(() => {
    loadSession();
    loadNovels();

    const { data } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const filteredNovels = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return novels.filter((novel) =>
      `${novel.title} ${novel.author}`.toLowerCase().includes(query)
    );
  }, [novels, searchQuery]);

  const featured = filteredNovels[0];

  return (
    <div className="site-shell min-h-screen overflow-hidden">
      <CustomCursor />
      <div className="sparkle-field" />

      <header className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <nav className="nav-bubble">
          <button type="button" className="brand" onClick={() => scrollToSection('inicio')}>
            <span className="brand-mark">🍓</span>
            <span className="brand-title">strawberry shelf</span>
          </button>

          <div className="nav-links">
            <button type="button" className="active" onClick={() => scrollToSection('inicio')}>Inicio</button>
            <button type="button" onClick={() => scrollToSection('sobre-mi')}>Sobre mí</button>
            <button type="button" onClick={() => scrollToSection('catalogo')}>Catálogo</button>
            <button type="button" onClick={() => scrollToSection('subir-novela')}>Subir novela</button>
            <button type="button" onClick={() => scrollToSection('admin')}>Admin</button>
          </div>

          <a className="quote-button" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Contáctame <Heart size={16} fill="currentColor" />
          </a>
        </nav>
      </header>

      <main id="inicio" className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="hero-grid">
          <div className="hero-copy">
            <div className="love-pill"><Sparkles size={15} /> Novelas recopiladas</div>
            <h1>Historias que merecen brillar</h1>
            <p>Soy Uriel. Las traducciones son recompiladas de otras personas en PDF o texto. Para más información, háblame por WhatsApp.</p>

            <div className="hero-actions">
              <button type="button" className="primary-action" onClick={() => scrollToSection('catalogo')}>
                Ver catálogo <BookOpen size={18} />
              </button>
              <a className="soft-note soft-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Hablar con Uriel</a>
            </div>

            <div className="stats-strip">
              <div><strong>{novels.length}</strong><span>novelas</span></div>
              <div><strong>PDF</strong><span>y texto</span></div>
              <div><strong>Admin</strong><span>aprobación</span></div>
            </div>
          </div>

          {featured && (
            <Link to={`/novel/${featured.id}`} className="hero-card">
              <div className="speech-bubble">Cada historia en buenas manos ♡</div>
              <div className="featured-cover-wrap">
                <img src={featured.cover_url || '/placeholder-cover.png'} alt={featured.title} />
              </div>
              <div className="featured-info">
                <span>★ Destacada</span>
                <h2>{featured.title}</h2>
                <p>{featured.author || 'Sin autor'} · {featured.chapters?.length || 1} capítulo(s)</p>
              </div>
            </Link>
          )}
        </section>

        <section id="sobre-mi" className="about-panel">
          <div className="about-photo">
            <img src="/about/uriel.jpg" alt="Foto de Uriel" />
          </div>

          <div className="about-content">
            <span className="section-pill"><UserRound size={16} /> Sobre mí</span>
            <h2>Hola, soy Uriel</h2>
            <p>Esta página reúne novelas traducidas y recompiladas por otras personas. Si quieres más información, pedir retiro de contenido o compartir algo, escríbeme.</p>
            <a className="primary-action" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Contáctame por WhatsApp <Send size={18} />
            </a>
          </div>
        </section>

        <section id="catalogo" className="catalog-panel">
          <div className="catalog-heading">
            <div>
              <span>Índice de novelas</span>
              <h2>Elige tu próxima lectura</h2>
            </div>

            <div className="search-box">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar novela o autor..." />
              <Search size={18} />
            </div>
          </div>

          <div className="novel-grid">
            {filteredNovels.map((novel) => (
              <Link key={novel.id} to={`/novel/${novel.id}`} className="novel-card">
                <div className="cover-frame">
                  <img src={novel.cover_url || '/placeholder-cover.png'} alt={novel.title} loading="lazy" />
                  <span>{novel.chapters?.length || 1} cap.</span>
                </div>
                <div className="novel-body">
                  <h3>{novel.title}</h3>
                  <p>{novel.author || 'Sin autor'}</p>
                  <div className="tag-row"><span>{novel.source_type || 'text'}</span></div>
                </div>
              </Link>
            ))}
          </div>

          {filteredNovels.length === 0 && <div className="empty-state">Todavía no hay novelas aprobadas.</div>}
        </section>

        <section id="subir-novela" className="upload-panel">
          <div className="upload-copy">
            <span className="section-pill"><Upload size={16} /> Comunidad</span>
            <h2>Sube tu novela traducida</h2>
            <p>Inicia sesión, sube portada, PDF/TXT o escribe el contenido. La novela quedará pendiente hasta que Uriel la apruebe.</p>
          </div>

          <div className="upload-stack">
            <AuthBox session={session} profile={profile} reloadSession={loadSession} />
            <UploadNovel session={session} reloadNovels={loadNovels} />
          </div>
        </section>

        <AdminPanel profile={profile} reloadNovels={loadNovels} />

        <section id="contacto" className="contact-panel">
          <h2>Contacto</h2>
          <p>Para información, dudas o solicitudes, habla conmigo por WhatsApp.</p>
          <a className="primary-action" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Hablar con Uriel <Send size={18} />
          </a>
        </section>
      </main>
    </div>
  );
}

function NovelDetails() {
  const { id } = useParams();
  const [novel, setNovel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNovel() {
      const { data } = await supabase.from('novels').select('*, chapters(*)').eq('id', id).single();
      setNovel(data);
      setLoading(false);
    }

    loadNovel();
  }, [id]);

  if (loading) return <div className="reader-page"><div className="reader-card">Cargando...</div></div>;
  if (!novel) return <div className="reader-page"><div className="reader-card"><h1>Novela no encontrada</h1><Link to="/" className="reader-button">Volver</Link></div></div>;

  const chapters = [...(novel.chapters || [])].sort((a, b) => a.chapter_order - b.chapter_order);

  return (
    <main className="detail-page">
      <Link to="/" className="back-link"><ArrowLeft size={18} /> Volver al catálogo</Link>

      <section className="detail-card">
        <div className="detail-cover">
          <img src={novel.cover_url || '/placeholder-cover.png'} alt={novel.title} />
        </div>

        <div className="detail-content">
          <span className="detail-pill">{novel.status}</span>
          <h1>{novel.title}</h1>
          <p className="detail-meta">{novel.author || 'Sin autor'}</p>
          <p className="detail-synopsis">{novel.synopsis || 'Sin sinopsis.'}</p>
          <h2>Capítulos</h2>

          <div className="chapter-list">
            {chapters.map((chapter) => (
              <Link key={chapter.id} to={`/novel/${novel.id}/chapter/${chapter.id}`} className="chapter-link">
                <BookOpen size={17} /> <span>{chapter.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Reader() {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const [novel, setNovel] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReader() {
      const { data } = await supabase.from('novels').select('*, chapters(*)').eq('id', novelId).single();
      const sorted = [...(data?.chapters || [])].sort((a, b) => a.chapter_order - b.chapter_order);
      const current = sorted.find((item) => item.id === chapterId);

      setNovel(data);
      setChapters(sorted);
      setChapter(current);

      if (current?.content) setText(current.content);
      else if (current?.file_url && current.file_type !== 'pdf') {
        const response = await fetch(current.file_url);
        setText(await response.text());
      }

      setLoading(false);
    }

    loadReader();
  }, [novelId, chapterId]);

  if (loading) return <div className="reader-page"><div className="reader-card">Cargando...</div></div>;
  if (!novel || !chapter) return <div className="reader-page"><div className="reader-card"><h1>Capítulo no encontrado</h1><Link to="/" className="reader-button">Volver</Link></div></div>;

  const index = chapters.findIndex((item) => item.id === chapter.id);
  const previous = index > 0 ? chapters[index - 1] : null;
  const next = index < chapters.length - 1 ? chapters[index + 1] : null;

  return (
    <main className="reader-page">
      <div className="reader-topbar">
        <Link to={`/novel/${novel.id}`}><ArrowLeft size={17} /> Índice</Link>
        <Link to="/"><Home size={17} /> Catálogo</Link>
      </div>

      <article className="reader-card">
        <p className="reader-novel">{novel.title}</p>
        <h1>{chapter.title}</h1>

        {chapter.file_type === 'pdf' && chapter.file_url ? (
          <iframe className="pdf-reader" src={chapter.file_url} title={chapter.title} />
        ) : (
          <div className="reader-text">{text}</div>
        )}
      </article>

      <div className="reader-navigation">
        <button type="button" disabled={!previous} onClick={() => navigate(`/novel/${novel.id}/chapter/${previous.id}`)}>Anterior</button>
        <button type="button" disabled={!next} onClick={() => navigate(`/novel/${novel.id}/chapter/${next.id}`)}>Siguiente</button>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/novel/:id" element={<NovelDetails />} />
        <Route path="/novel/:novelId/chapter/:chapterId" element={<Reader />} />
      </Routes>
    </HashRouter>
  );
}