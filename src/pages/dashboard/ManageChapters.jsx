import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, BookOpen, Save, FileText } from 'lucide-react';

export function ManageChapters() {
  const { id: novelId } = useParams();
  const [novelTitle, setNovelTitle] = useState('Novela');
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados del Formulario
  const [chapterNumber, setChapterNumber] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function loadNovelAndChapters() {
      setLoading(true);
      
      // 1. Obtener datos de la novela
      const { data: novel } = await supabase
        .from('novels')
        .select('title')
        .eq('id', novelId)
        .maybeSingle();
      
      if (novel) setNovelTitle(novel.title);

      // 2. Obtener capítulos
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('id, title, chapter_number, created_at')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: true });

      if (chaptersData) {
        setChapters(chaptersData);
        const nextNum = chaptersData.length > 0 
          ? Math.max(...chaptersData.map(c => Number(c.chapter_number) || 0)) + 1 
          : 1;
        setChapterNumber(nextNum.toString());
      }
      setLoading(false);
    }

    loadNovelAndChapters();
  }, [novelId]);

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setAdding(true);
    const displayTitle = title.trim() || `Capítulo ${chapterNumber}`;

    const { data, error } = await supabase
      .from('chapters')
      .insert([{
        novel_id: novelId,
        chapter_number: parseFloat(chapterNumber) || 0,
        title: displayTitle,
        content: content.trim()
      }])
      .select();

    if (!error && data) {
      setChapters([...chapters, ...data].sort((a, b) => a.chapter_number - b.chapter_number));
      setTitle('');
      setContent('');
      setChapterNumber((parseFloat(chapterNumber) + 1).toString());
    }
    setAdding(false);
  };

  if (loading) return <div className="text-center py-12 text-pink-500 animate-pulse text-xs">Cargando índices...</div>;

  return (
    <div className="animate-fadeIn font-sans max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <Link to="/dashboard/novels" className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-neutral-600 text-xs font-bold transition w-max">
          <ArrowLeft size={14} /> Volver a Mis Obras
        </Link>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 shadow-xs">
          <h1 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2 mb-1">
            <FileText className="text-pink-500" size={18} /> Publicar Nuevo Capítulo
          </h1>
          <p className="text-[11px] text-neutral-400 mb-5">Añade contenido a: <span className="font-semibold text-neutral-500">{novelTitle}</span></p>

          <form onSubmit={handleAddChapter} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">Nº Capítulo</label>
                <input 
                  type="number" step="any" required value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 transition"
                />
              </div>
              <div className="sm:col-span-3 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">Título del Capítulo</label>
                <input 
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">Cuerpo del Capítulo</label>
              <textarea 
                rows={12} required value={content} onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:border-pink-500 text-neutral-900 dark:text-neutral-100 leading-relaxed resize-none transition"
              />
            </div>

            <button type="submit" disabled={adding} className="flex items-center justify-center gap-2 bg-pink-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs hover:bg-pink-600 transition disabled:opacity-50">
              <Save size={14} /> {adding ? 'Subiendo...' : 'Publicar Capítulo'}
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
            {chapters.map((chap) => (
              <div key={chap.id} className="p-2.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800/60 text-xs">
                <p className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {chap.chapter_number}. {chap.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}