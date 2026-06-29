import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
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

export const NovelDetails = () => {
  const { id } = useParams();
  const novel = NOVELS.find((item) => item.id === id);

  if (!novel) {
    return (
      <div className="reader-page">
        <div className="reader-card">
          <h1>Novela no encontrada</h1>
          <Link to="/" className="reader-button">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="detail-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} /> Volver al catálogo
      </Link>

      <section className="detail-card">
        <div className="detail-cover">
          <img src={novel.cover} alt={cleanText(novel.title)} />
        </div>

        <div className="detail-content">
          <span className="detail-pill">{novel.status || 'Disponible'}</span>

          <h1>{cleanText(novel.title)}</h1>

          <p className="detail-meta">
            {cleanText(novel.author)} · {novel.chaptersCount} capítulos
          </p>

          <p className="detail-synopsis">
            {cleanText(novel.synopsis) || 'Sinopsis en edición.'}
          </p>

          <h2>Capítulos</h2>

          <div className="chapter-list">
            {novel.chapters.map((chapter) => (
              <Link
                key={chapter.id}
                to={`/novel/${novel.id}/chapter/${chapter.id}`}
                className="chapter-link"
              >
                <BookOpen size={17} />
                <span>{cleanText(chapter.title)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};