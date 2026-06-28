import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { NOVELS } from '../utils/data';

const CATEGORIES = ["All", "Romance", "Fantasy", "Villainess", "Comedy", "Reincarnation"];

export const Home = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = NOVELS.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.author.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || n.tags.includes(category);
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
      <div className="bg-white/60 dark:bg-darkKawaii-secundario/40 border-4 border-dashed border-kawaii-rosa rounded-3xl p-8 text-center mb-10 shadow-sm">
        <h1 className="font-title text-4xl md:text-5xl text-kawaii-boton dark:text-darkKawaii-rosa mb-2">🍓 StrawberryShelf 🍓</h1>
        <p className="text-lg font-medium opacity-90 max-w-xl mx-auto">Tu biblioteca secreta y acogedora. Explora las traducciones oficiales. 🍓 <strong>{NOVELS.length} novelas disponibles</strong>.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Buscar novela o autor..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-5 py-3 rounded-full bg-white dark:bg-darkKawaii-secundario border-2 border-kawaii-rosa outline-none text-sm shadow-sm"
          />
          <Search className="absolute right-4 top-3.5 opacity-40" size={18} />
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all border-2 ${category === cat ? 'bg-kawaii-boton text-white border-kawaii-boton' : 'bg-white dark:bg-darkKawaii-secundario border-kawaii-secundario'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.map((novel, idx) => (
          <motion.div 
            key={novel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.04, 1) }} // Previene demoras visuales en catálogos masivos
            className="bg-white dark:bg-darkKawaii-secundario border-4 border-kawaii-secundario rounded-3xl p-4 shadow-md flex flex-col justify-between hover:scale-[1.02] transition-transform"
          >
            <div>
              <img src={novel.cover} alt={novel.title} className="w-full h-48 object-cover rounded-2xl mb-4 border" />
              <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className="font-title text-xl text-kawaii-texto dark:text-darkKawaii-rosa">{novel.title}</h3>
                <span className="text-[10px] px-2 py-0.5 bg-kawaii-secundario dark:bg-darkKawaii-bg rounded-md font-bold">{novel.status}</span>
              </div>
              <p className="text-xs opacity-70 mb-3">Por: {novel.author}</p>
            </div>
            <Link to={`/novel/${novel.id}`} className="w-full text-center bg-kawaii-boton text-white font-title py-2 rounded-xl block shadow-sm shiny-btn">
              Leer Capítulo 📖
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};