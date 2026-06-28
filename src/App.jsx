import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { CustomCursor } from './components/CustomCursor';
import { FloatingHearts } from './components/FloatingHearts';
import { Home } from './pages/Home';
import { NovelDetails } from './pages/NovelDetails';
import { Reader } from './pages/Reader';
import { Favorites } from './pages/Favorites';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen relative overflow-hidden kawaii-pattern">
          <CustomCursor />
          <FloatingHearts />
          <Navbar />
          
          <main className="relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/novel/:id" element={<NovelDetails />} />
              <Route path="/novel/:novelId/chapter/:chapterId" element={<Reader />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="*" element={<div className="p-20 text-center font-title text-2xl">404 - ¡Estantería Vacía! 🍓</div>} />
            </Routes>
          </main>
          
          <footer className="py-6 text-center text-xs opacity-60 font-bold border-t-2 border-dashed border-kawaii-rosa/40 mt-12 bg-white/20 relative z-10">
            🍓 StrawberryShelf © {new Date().getFullYear()} — Hecho con amor y azúcar 🌸
          </footer>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;