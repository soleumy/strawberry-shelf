import React, { useState } from 'react';
import { NOVELS } from './utils/data';

export default function App() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filtrar las novelas por categoría y por motor de búsqueda
  const filteredNovels = NOVELS.filter((novel) => {
    const matchesTab = activeTab === 'All' || novel.tags.includes(activeTab);
    const matchesSearch = novel.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          novel.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div class="min-h-screen p-4 max-w-6xl mx-auto pb-12">
      
      {/* 🌸 NAVBAR / ENCABEZADO SUPERIOR */}
      <header class="kawaii-box p-4 md:p-6 mb-8 flex flex-col md:flex-row justify-between items-center bg-white/90 backdrop-blur-sm sticky top-4 z-50">
        <div class="flex items-center gap-3">
          <span class="text-4xl animate-bounce">🍓</span>
          <h1 class="text-3xl font-black text-[#FF5C8A] tracking-wider">strawberry shelf</h1>
        </div>
        <nav class="flex gap-6 mt-4 md:mt-0 font-bold text-[#AA4465]">
          <a href="#" class="hover:text-[#FF5C8A] border-b-2 border-[#FF8FAB] pb-0.5">Inicio</a>
          <a href="#" class="hover:text-[#FF5C8A] transition-colors">Servicios</a>
          <a href="#" class="hover:text-[#FF5C8A] transition-colors">Sobre mí</a>
          <a href="#" class="hover:text-[#FF5C8A] transition-colors">FAQ</a>
          <a href="#" class="hover:text-[#FF5C8A] transition-colors">Contacto</a>
        </nav>
        <button class="kawaii-btn px-6 py-2.5 font-bold text-sm mt-4 md:mt-0 shadow-lg">
          Pedir presupuesto 🎀
        </button>
      </header>

      {/* 📢 SECCIÓN HERO DE BIENVENIDA */}
      <section class="text-center my-12 max-w-2xl mx-auto">
        <span class="inline-flex items-center gap-1.5 bg-[#FFCCD5] text-[#C9184A] px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm">
          💝 Traducciones hechas con amor
        </span>
        <h2 class="text-4xl md:text-5xl font-black text-[#592E36] mt-4 leading-tight">
          Traducciones kawaii para historias que merecen brillar ✨
        </h2>
        <p class="text-[#AA4465] mt-3 font-semibold text-base md:text-lg">
          Cada palabra, traducida con cariño. Explora las traducciones oficiales de tu rincón secreto. 📚 <span class="text-[#FF5C8A] font-black">{NOVELS.length} novelas disponibles</span>.
        </p>
      </section>

      {/* 🔍 BARRA DE BÚSQUEDA Y FILTROS */}
      <div class="flex flex-col items-center gap-4 mb-10">
        <div class="w-full max-w-md relative">
          <input
            type="text"
            placeholder="Buscar novela o autor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            class="w-full px-5 py-3 rounded-full border-2 border-[#FFCCD5] focus:outline-none focus:border-[#FF8FAB] font-semibold text-[#592E36] bg-white shadow-inner placeholder-[#FFB3C1]"
          />
          <span class="absolute right-4 top-3.5 text-lg">🔍</span>
        </div>

        {/* 🏷️ SELECTOR DE CATEGORÍAS */}
        <div class="flex flex-wrap gap-2 justify-center">
          {['All', 'Romance', 'Fantasy', 'Villainess', 'Comedy', 'Reincarnation'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); }}
              class={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-150 ${
                activeTab === tab 
                  ? 'bg-[#FF8FAB] text-white shadow-[0_3px_0px_#C9184A] translate-y-[-2px]' 
                  : 'bg-white text-[#AA4465] border-2 border-[#FFCCD5] hover:bg-[#FFF0F3]'
              }`}
            >
              {tab === 'All' ? '🌸 Todo' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* 📚 GRILLA DE NOVELAS */}
      <main class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredNovels.map((novel) => (
          <div 
            key={novel.id} 
            class="kawaii-box bg-white overflow-hidden group hover:translate-y-[-4px] transition-all duration-200 flex flex-col justify-between"
          >
            {/* Contenedor de la Portada Física */}
            <div class="relative aspect-[3/4] bg-[#FFE5EC] overflow-hidden border-b-2 border-[#FFCCD5]">
              <img 
                src={novel.cover} 
                alt={novel.title} 
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Globito de Capítulos */}
              <span class="absolute bottom-3 right-3 bg-[#FF758F] text-white text-xs font-black px-3 py-1 rounded-full shadow-md border border-white">
                🍓 {novel.chaptersCount} Caps
              </span>
            </div>

            {/* Datos Informativos */}
            <div class="p-4 flex-grow flex flex-col justify-between">
              <div>
                <h3 class="font-black text-lg text-[#592E36] line-clamp-1 group-hover:text-[#FF5C8A] transition-colors" title={novel.title}>
                  {novel.title}
                </h3>
                <p class="text-xs text-[#AA4465] font-bold mt-0.5">By {novel.author}</p>
              </div>
              
              {/* Tags Kawaii */}
              <div class="flex gap-1 mt-3 flex-wrap">
                {novel.tags.map(tag => (
                  <span key={tag} class="bg-[#FFF0F3] text-[#FF5C8A] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#FFCCD5]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* 📭 MENSAJE POR SI NO ENCUENTRA RESULTADOS */}
      {filteredNovels.length === 0 && (
        <div class="text-center py-12 kawaii-box bg-white/60 max-w-md mx-auto mt-6">
          <span class="text-4xl">😭</span>
          <p class="text-[#AA4465] font-bold mt-2">¡Ups! No encontramos ninguna novela que coincida.</p>
        </div>
      )}
    </div>
  );
}