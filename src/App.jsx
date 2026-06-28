import React, { useState } from 'react';
import { NOVELS } from './utils/data';

export default function App() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNovels = NOVELS.filter((novel) => {
    const matchesTab = activeTab === 'All' || novel.tags.includes(activeTab);
    const matchesSearch = novel.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div class="min-h-screen w-full px-4 py-6 max-w-6xl mx-auto box-border">
      
      {/* 🌸 NAVBAR / ENCABEZADO (Se adapta a móvil) */}
      <header class="kawaii-box p-4 md:p-6 mb-8 flex flex-col gap-4 md:flex-row justify-between items-center bg-white/90 backdrop-blur-sm">
        <div class="flex items-center gap-2">
          <span class="text-3xl animate-bounce">🍓</span>
          <h1 class="text-2xl md:text-3xl font-black text-[#FF5C8A] tracking-wider m-0">strawberry shelf</h1>
        </div>
        
        {/* Menú: En móvil se envuelve limpio y no se pisa */}
        <nav class="flex flex-wrap justify-center gap-4 md:gap-6 font-bold text-[#AA4465] text-sm md:text-base">
          <a href="#" class="hover:text-[#FF5C8A] border-b-2 border-[#FF8FAB] pb-0.5">Inicio</a>
          <a href="#" class="hover:text-[#FF5C8A] transition-colors">Servicios</a>
          <a href="#" class="hover:text-[#FF5C8A] transition-colors">Sobre mí</a>
          <a href="#" class="hover:text-[#FF5C8A] transition-colors">FAQ</a>
          <a href="#" class="hover:text-[#FF5C8A] transition-colors">Contacto</a>
        </nav>
        
        <button class="kawaii-btn px-5 py-2 font-bold text-xs md:text-sm shadow-md whitespace-nowrap">
          Pedir presupuesto 🎀
        </button>
      </header>

      {/* 📢 SECCIÓN BIENVENIDA */}
      <section class="text-center my-8 max-w-xl mx-auto">
        <span class="inline-block bg-[#FFCCD5] text-[#C9184A] px-3 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-sm">
          💝 TRADUCCIONES HECHAS CON AMOR
        </span>
        <h2 class="text-2xl md:text-4xl font-black text-[#592E36] mt-3 leading-tight">
          Historias que merecen brillar ✨
        </h2>
        <p class="text-[#AA4465] mt-1 text-xs md:text-sm font-semibold">
          Cada palabra, traducida con cariño. <span class="text-[#FF5C8A] font-black">{NOVELS.length} novelas disponibles</span>.
        </p>
      </section>

      {/* 🔍 BUSCADOR Y FILTROS */}
      <div class="flex flex-col items-center gap-4 mb-8">
        <div class="w-full max-w-md relative">
          <input
            type="text"
            placeholder="Buscar novela..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            class="w-full px-4 py-2.5 rounded-full border-2 border-[#FFCCD5] focus:outline-none focus:border-[#FF8FAB] font-semibold text-sm text-[#592E36] bg-white shadow-inner placeholder-[#FFB3C1]"
          />
          <span class="absolute right-4 top-2.5 text-sm">🔍</span>
        </div>

        {/* Categorías deslizables horizontalmente en móvil para que no ocupen media pantalla */}
        <div class="w-full overflow-x-auto pb-2 flex gap-2 justify-start md:justify-center px-2 no-scrollbar">
          {['All', 'Romance', 'Fantasy', 'Villainess', 'Comedy', 'Reincarnation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              class={`px-4 py-1.5 rounded-full font-bold text-xs transition-all duration-150 whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-[#FF8FAB] text-white shadow-[0_2px_0px_#C9184A] translate-y-[-1px]' 
                  : 'bg-white text-[#AA4465] border-2 border-[#FFCCD5] hover:bg-[#FFF0F3]'
              }`}
            >
              {tab === 'All' ? '🌸 Todo' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* 📚 SÚPER CUADRÍCULA ADAPTABLE */}
      {/* 2 columnas en celulares pequeños, 3 en pantallas medianas y 4 en monitores */}
      <main class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
        {filteredNovels.map((novel) => (
          <div 
            key={novel.id} 
            class="kawaii-box bg-white overflow-hidden group hover:translate-y-[-4px] transition-all duration-200 flex flex-col justify-between"
          >
            {/* Contenedor de la imagen (mantiene la proporción 3:4 perfecta de libros) */}
            <div class="relative aspect-[3/4] bg-[#FFE5EC] overflow-hidden border-b-2 border-[#FFCCD5]">
              <img 
                src={novel.cover} 
                alt={novel.title} 
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
              />
              <span class="absolute bottom-2 right-2 bg-[#FF758F]/90 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full shadow-sm border border-white">
                🍓 {novel.chaptersCount}
              </span>
            </div>

            {/* Información del libro */}
            <div class="p-2.5 md:p-4 flex-grow flex flex-col justify-between">
              <div>
                <h3 class="font-black text-sm md:text-base text-[#592E36] line-clamp-1 group-hover:text-[#FF5C8A] transition-colors" title={novel.title}>
                  {novel.title}
                </h3>
                <p class="text-[10px] md:text-xs text-[#AA4465] font-bold mt-0.5">By {novel.author}</p>
              </div>
              
              <div class="flex gap-1 mt-2 flex-wrap">
                {novel.tags.slice(0, 2).map(tag => (
                  <span key={tag} class="bg-[#FFF0F3] text-[#FF5C8A] text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full border border-[#FFCCD5]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Mensaje vacío */}
      {filteredNovels.length === 0 && (
        <div class="text-center py-8 kawaii-box bg-white/60 max-w-xs mx-auto mt-6">
          <span class="text-3xl">😭</span>
          <p class="text-[#AA4465] text-xs font-bold mt-2">¡No hay novelas en esta categoría!</p>
        </div>
      )}
    </div>
  );
}