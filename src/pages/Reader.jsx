import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { NOVELS } from '../utils/data';

function cleanText(value) {
  return String(value || '')
    .replace(/Ã³/g, 'ó')
    .replace(/Ã­/g, 'í')
    .replace(/Ã©/g, 'é')
    .replace(/Ã¡/g, 'á')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã±/g, 'ñ')
    .replace(/â€¢/g, '•')
    .replace(/â•¹/g, ':')
    .replace(/ÃƒÂ³/g, 'ó')
    .replace(/ÃƒÂ­/g, 'í')
    .replace(/ÃƒÂ©/g, 'é')
    .replace(/ÃƒÂ¡/g, 'á')
    .replace(/ÃƒÂº/g, 'ú')
    .replace(/ÃƒÂ±/g, 'ñ')
    .trim();
}

export const Reader = () => {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const novel = useMemo(
    () => NOVELS.find((item) => item.id === novelId),
    [novelId]
  );

  const currentIndex = novel?.chapters.findIndex((chapter) => chapter.id === chapterId) ?? -1;
  const chapter = currentIndex >= 0 ? novel.chapters[currentIndex] : null;

  useEffect(() => {
    if (!chapter) return;

    setLoading(true);
    window.scrollTo(0, 0);

    fetch(encodeURI(chapter.file))
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo cargar el capítulo');
        }

        return response.text();
      })
      .then((content) => {
        setText(content);
      })
      .catch(() => {
        setText('No se pudo cargar este capítulo. Revisa que el archivo .txt exista en public/novelas.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [chapter]);

  if (!novel || !chapter) {
    return (
      <div className="reader-page">
        <div className="reader-card">
          <h1>Capítulo no encontrado</h1>
          <Link to="/" className="reader-button">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  const previousChapter = currentIndex > 0 ? novel.chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < novel.chapters.length - 1 ? novel.chapters[currentIndex + 1] : null;

  return (
    <main className="reader-page">
      <div className="reader-topbar">
        <Link to={`/novel/${novel.id}`}>
          <ArrowLeft size={17} /> Índice
        </Link>

        <Link to="/">
          <Home size={17} /> Catálogo
        </Link>
      </div>

      <article className="reader-card">
        <p className="reader-novel">{cleanText(novel.title)}</p>
        <h1>{cleanText(chapter.title)}</h1>

        {loading ? (
          <p className="reader-loading">Cargando capítulo...</p>
        ) : (
          <div className="reader-text">
            {text}
          </div>
        )}
      </article>

      <div className="reader-navigation">
        <button
          type="button"
          disabled={!previousChapter}
          onClick={() => navigate(`/novel/${novel.id}/chapter/${previousChapter.id}`)}
        >
          <ArrowLeft size={17} /> Anterior
        </button>

        <button
          type="button"
          disabled={!nextChapter}
          onClick={() => navigate(`/novel/${novel.id}/chapter/${nextChapter.id}`)}
        >
          Siguiente <ArrowRight size={17} />
        </button>
      </div>
    </main>
  );
};