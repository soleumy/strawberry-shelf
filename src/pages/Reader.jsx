import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';
import { NOVELS } from '../utils/data';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';

export const Reader = () => {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const { saveProgress, history } = useContext(AppContext);

  const novel = NOVELS.find(n => n.id === novelId);
  const currentIdx = novel?.chapters.findIndex(c => c.id === chapterId);
  const chapter = novel?.chapters[currentIdx];

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    if (!chapter) return;
    setLoading(true);
    fetch(chapter.file)
      .then(res => {
        if(!res.ok) throw new Error();
        return res.text();
      })
      .then(data => { setText(data); setLoading(false); })
      .catch(() => { setText("Error al sincronizar el capítulo. Verifica su existencia."); setLoading(false); });
  }, [chapterId]);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        const currentProgress = (window.scrollY / total) * 100;
        setProgress(currentProgress);
        if (Math.round(currentProgress) % 10 === 0) {
          saveProgress(novelId, chapterId, window.scrollY);
        }
      }
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [window.scrollY, chapterId]);

  useEffect(() => {
    if (!loading && history[novelId]?.chapterId === chapterId) {
      setTimeout(() => {
        window.scrollTo({ top: history[novelId].scrollPos, behavior: 'smooth' });
      }, 250);
    } else {
      window.scrollTo(0, 0);
    }
  }, [chapterId, loading]);

  if (!novel || !chapter) return <div className="p-12 text-center">Capítulo no encontrado.</div>;

  return (
    <div className="min-h-screen pb-24 relative z-10 pt-6">
      <div className="fixed top-0 left-0 w-full h-3 bg-kawaii-secundario dark:bg-darkKawaii-secundario z-50">
        <div className="h-full bg-kawaii-boton rounded-r-full shadow-md transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <Link to={`/novel/${novelId}`} className="text-sm font-bold text-kawaii-intenso underline">✨ Regresar al Índice</Link>
          <span className="text-xs opacity-60 font-bold">{novel.title}</span>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white/95 dark:bg-darkKawaii-secundario/50 backdrop-blur-md rounded-3xl p-6 md:p-10 shadow-lg border-2 border-kawaii-secundario"
        >
          {loading ? (
            <div className="text-center py-20 font-title text-kawaii-boton animate-pulse text-xl">🍓 Abriendo pergaminos...</div>
          ) : (
            <div className="text-justify应用 whitespace-pre-line leading-relaxed text-lg tracking-wide font-sans">
              {text}
            </div>
          )}
        </motion.div>

        <div className="flex justify-between items-center mt-8">
          <button 
            disabled={currentIdx === 0}
            onClick={() => navigate(`/novel/${novelId}/chapter/${novel.chapters[currentIdx - 1].id}`)}
            className="px-5 py-2.5 bg-kawaii-rosa text-white font-bold rounded-full disabled:opacity-30 text-sm flex items-center gap-1 shadow-md hover:scale-105 transition-transform"
          >
            ← Anterior
          </button>
          <button 
            disabled={currentIdx === novel.chapters.length - 1}
            onClick={() => navigate(`/novel/${novelId}/chapter/${novel.chapters[currentIdx + 1].id}`)}
            className="px-5 py-2.5 bg-kawaii-boton text-white font-bold rounded-full disabled:opacity-30 text-sm flex items-center gap-1 shadow-md hover:scale-105 transition-transform"
          >
            Siguiente →
          </button>
        </div>
      </div>

      {showTopBtn && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-4 bg-kawaii-boton text-white rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
        >
          <ArrowUp size={18}/>
        </button>
      )}
    </div>
  );
};