import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sun, Moon } from 'lucide-react';
import { AppContext } from '../context/AppContext';

export const Navbar = () => {
  const { darkMode, setDarkMode, favorites, heartsEnabled, setHeartsEnabled } = useContext(AppContext);

  return (
    <nav className="sticky top-0 bg-white/80 dark:bg-darkKawaii-secundario/90 backdrop-blur-md border-b-4 border-kawaii-secundario dark:border-darkKawaii-secundario z-40 px-6 py-3 flex justify-between items-center transition-colors">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-3xl">🍓</span>
        <span className="font-title text-2xl tracking-wide text-kawaii-text dark:text-darkKawaii-rosa">StrawberryShelf</span>
      </Link>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setHeartsEnabled(!heartsEnabled)} 
          className={`p-2 rounded-full border-2 border-kawaii-rosa text-lg transition-all ${heartsEnabled ? 'bg-kawaii-secundario text-kawaii-boton' : 'opacity-50'}`}
          title="Fondo Mágico"
        >
          ✨
        </button>
        <Link to="/favorites" className="relative p-2 text-kawaii-boton hover:scale-110 transition-transform">
          <Heart size={24} fill={favorites.length > 0 ? "currentColor" : "none"} />
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-kawaii-intenso text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold font-title">
              {favorites.length}
            </span>
          )}
        </Link>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 bg-kawaii-secundario dark:bg-darkKawaii-bg rounded-full text-kawaii-texto dark:text-darkKawaii-rosa hover:scale-110 transition-transform border-2 border-kawaii-rosa/30"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
};