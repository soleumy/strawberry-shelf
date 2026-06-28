import React, { useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, BookOpen, Clock } from 'lucide-react';
import { NOVELS } from '../utils/data';
import { AppContext } from '../context/AppContext';

export const NovelDetails = () => {
  const { id } = useParams();
  const { favorites, toggleFavorite, history } = useContext(AppContext);
  const novel = NOVELS.find(n => n.id === id);

  if (!novel) return <div className="p-12 text-center font-title">Novela no encontrada 🥺</div>;

  const isFav = favorites.includes(novel.id);
  const lastRead = history[novel.id];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
      <div className="flex flex-col md:flex-row gap-8 bg-white/70 dark:bg-darkKawaii-secundario/50 border-4 border-kawaii-secundario rounded-3xl p-6 md:p-8 backdrop-blur-sm">
        <div className="w-full md:w-64 flex-shrink-0">
          <img src={novel.cover} alt={novel.title} className="w-full h-80 object-cover rounded-2xl border shadow-md mb-4" />
          <button 
            onClick={() => toggleFavorite(novel.id)}
            className={`w-full flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl border-2 transition-all ${isFav ? 'bg-kawaii-secundario border-kawaii-intenso text-kawaii-boton' : 'bg-white text-kawaii-texto border-kawaii-secundario'}`}
          >
            <Heart size={18} fill={isFav ? "currentColor" : "none"} /> {isFav ? 'En Favoritos 💖' : 'Añadir Favoritos'}
          </button>
        </div>
        
        <div className="flex-1">
          <h1 className="font-title text-3xl md:text-4xl text-kawaii-boton mb-1">{novel.title}</h1>
          <p className="text-sm font-bold opacity-70 mb-4">Autor: {novel.author} • Capítulos: {novel.chaptersCount}</p>
          <p className="leading-relaxed mb-6 font-medium text-justify">{novel.synopsis}</p>
          
          {lastRead && (
            <div className="mb-6 p-3 bg-kawaii-secundario/40 rounded-xl border border-kawaii-rosa flex items-center gap-2 text-xs font-bold">
              <Clock size={16}/> Te quedaste leyendo el Capítulo {lastRead.chapterId}. 
              <Link to={`/novel/${novel.id}/chapter/${lastRead.chapterId}`} className="text-kawaii-boton underline ml-auto">Continuar lectura 🍓</Link>
            </div>
          )}

          <h2 className="font-title text-2xl text-kawaii-texto dark:text-darkKawaii-rosa mb-4 border-b-2 border-dashed border-kawaii-rosa pb-2">📜 Capítulos Libres</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {novel.chapters.map(cap => (
              <Link 
                key={cap.id} 
                to={`/novel/${novel.id}/chapter/${cap.id}`}
                className="p-4 bg-white dark:bg-darkKawaii-bg rounded-xl border-2 border-kawaii-secundario hover:border-kawaii-boton transition-colors font-bold text-sm flex items-center gap-2 shadow-sm"
              >
                <BookOpen size={16} className="text-kawaii-rosa"/> {cap.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};