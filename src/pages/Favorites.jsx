import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { NOVELS } from '../utils/data';

export const Favorites = () => {
  const { favorites } = useContext(AppContext);
  const favNovels = NOVELS.filter(n => favorites.includes(n.id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
      <h1 className="font-title text-3xl text-kawaii-boton text-center mb-8">💖 Mi Biblioteca Guardada 💖</h1>
      {favNovels.length === 0 ? (
        <p className="text-center opacity-60 font-bold">No tienes novelas en favoritos todavía. ¡Añade algunas! 🌸</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {favNovels.map(novel => (
            <div key={novel.id} className="bg-white dark:bg-darkKawaii-secundario rounded-2xl p-4 border-2 border-kawaii-secundario flex gap-4 items-center shadow-sm">
              <img src={novel.cover} alt={novel.title} className="w-20 h-28 object-cover rounded-xl border" />
              <div>
                <h3 className="font-title text-lg text-kawaii-texto dark:text-darkKawaii-rosa">{novel.title}</h3>
                <p className="text-xs opacity-70 mb-2">Por: {novel.author}</p>
                <Link to={`/novel/${novel.id}`} className="text-xs bg-kawaii-boton text-white px-3 py-1.5 rounded-lg inline-block font-bold">Leer ya</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};