import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sun, Moon, LogIn, LayoutDashboard } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext'; // Asegúrate de tener este hook

export const Navbar = () => {
  const { darkMode, setDarkMode, favorites, heartsEnabled, setHeartsEnabled } = useContext(AppContext);
  const { user } = useAuth(); // Obtenemos el estado de usuario

  return (
    <nav className="sticky top-0 bg-white/80 dark:bg-darkKawaii-secundario/90 backdrop-blur-md border-b-4 border-kawaii-secundario dark:border-darkKawaii-secundario z-40 px-6 py-3 flex justify-between items-center transition-colors">
      
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <span className="text-3xl">🍓</span>
        <span className="font-title text-2xl tracking-wide text-kawaii-text dark:text-darkKawaii-rosa">StrawberryShelf</span>
      </Link>

      {/* Acciones derecha */}
      <div className="flex items-center gap-3">
        
        {/* Botón de Autenticación / Dashboard */}
        {user ? (
          <Link to="/dashboard" className="flex items-center gap-2 bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-pink-200 transition-all border border-pink-200">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
        ) : (
          <Link to="/login" className="flex items-center gap-2 bg-kawaii-rosa text-white px-4 py-2 rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-sm">
            <LogIn size={16} /> Iniciar Sesión
          </Link>
        )}

        {/* Botón Fondo Mágico */}
        <button 
          onClick={() => setHeartsEnabled(!heartsEnabled)} 
          className={`p-2 rounded-full border-2 border-kawaii-rosa text-lg transition-all ${heartsEnabled ? 'bg-kawaii-secundario text-kawaii-boton' : 'opacity-50'}`}
          title="Fondo Mágico"
        >
          ✨
        </button>

        {/* Botón Favoritos */}
        <Link to="/favorites" className="relative p-2 text-kawaii-boton hover:scale-110 transition-transform">
          <Heart size={24} fill={favorites.length > 0 ? "currentColor" : "none"} />
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-kawaii-intenso text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold font-title">
              {favorites.length}
            </span>
          )}
        </Link>

        {/* Botón Dark Mode */}
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