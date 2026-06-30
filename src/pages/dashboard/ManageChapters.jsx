import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, BookOpen, FileText, Save } from 'lucide-react';

export function ManageChapters() {
  const { novelId } = useParams();
  const { user } = useAuth();

  const [novelTitle, setNovelTitle] = useState('Novela');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chapterOrder, setChapterOrder] = useState('1');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  async function loadNovelAndChapters() {
    setLoading(true);
    setMessage('');

    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('title')
      .eq('id', novelId)
      .maybeSingle();

    if (novelError) {
      setMessage(novelError.message);
      setLoading(false);
      return;
    }

    if (novel) setNovelTitle(novel.title);

    const { data: chaptersData, error: chaptersError } = await supabase
      .from('chapters')
      .select('id, title, chapter_order, created_at')
      .eq('novel_id', novelId)
      .order('chapter_order', { ascending: true });

    if (chaptersError) {
      setMessage(chaptersError.message);
      setLoading(false);
      return;
    }

    const list = chaptersData || [];
    setChapters(list);

    const nextNumber = list.length > 0
      ? Math.max(...list.map((chapter) => Number(chapter.chapter_order) || 0)) + 1
      : 1;

    setChapterOrder(String(nextNumber));
    setLoading(false);
  }

  useEffect(() => {
    loadNovelAndChapters();
  }, [novelId]);

  async function handleAddChapter(event) {
    event.preventDefault();
    setMessage('');

    if (!user?.id) {
      setMessage('Necesitas iniciar sesión.');
      return;
    }

    if (!content.trim()) {
      setMessage('Escribe el contenido del capítulo.');
      return;
    }

    setAdding(true);

    const order = Number(chapterOrder) || 1;
    const displayTitle = title.trim() || `Capítulo ${order}`;

    const { data, error } = await supabase
      .from('chapters')
      .insert({
        novel_id: novelId,
        author_id: user.id,
        title: displayTitle,
        content: content.trim(),
        file_url: null,
        file_type: 'text',
        chapter_order: order,
        is_draft: false,
      })
      .select('id, title, chapter_order, created_at')
      .single();

    if (error) {
      setMessage(error.message);
      setAdding(false);
      return;
    }

    const updatedChapters = [...chapters, data].sort((a, b) => a.chapter_order - b.chapter_order);

    setChapters(updatedChapters);
    setTitle('');
    setContent('');
    setChapterOrder(String(order + 1));
    setMessage('Capítulo subido correctamente.');
    setAdding(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-pink-500 animate-pulse text-xs">Cargando capítulos...</div>;
  }

  return (
    <div className="animate-fadeIn font-sans max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Link to="/dashboard/novels" className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-neutral-600 text-xs font-bold transition w-max">
          <ArrowLeft size={14} /> Volver a Mis Obras
        </Link>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
          <h1 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-1">
            <FileText className="text-pink-500" size={18} /> Subir capítulo
          </h1>

          <p className="text-[11px] text-neutral-400 mb-5">
            Añade contenido a: <span className="font-semibold text-neutral-500">{novelTitle}</span>
          </p>

          {message && <p className="form-message">{message}</p>}

          <form onSubmit={handleAddChapter} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  Nº capítulo
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={chapterOrder}
                  onChange={(event) => setChapterOrder(event.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 transition"
                />
              </div>

              <div className="sm:col-span-3 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  Título del capítulo
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                Cuerpo del capítulo
              </label>

              <textarea
                rows={12}
                required
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="w-full px-4 py-3 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 leading-relaxed resize-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={adding}
              className="flex items-center justify-center gap-2 bg-pink-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs hover:bg-pink-600 transition disabled:opacity-50"
            >
              <Save size={14} /> {adding ? 'Subiendo...' : 'Subir capítulo'}
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs flex-1">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="text-pink-400" size={16} /> Índice ({chapters.length})
          </h2>

          <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">
            {chapters.length === 0 ? (
              <div className="empty-state">Todavía no hay capítulos.</div>
            ) : (
              chapters.map((chapter) => (
                <div key={chapter.id} className="p-2.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800/60 text-xs">
                  <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                    {chapter.chapter_order}. {chapter.title}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ChapterManager = ManageChapters;
export const ChapterEditor = ManageChapters;