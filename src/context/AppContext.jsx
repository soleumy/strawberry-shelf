import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('sb_favorites')) || []);
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('sb_dark_mode')) || false);
  const [heartsEnabled, setHeartsEnabled] = useState(() => {
    const saved = localStorage.getItem('sb_hearts');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('sb_history')) || {});

  useEffect(() => {
    localStorage.setItem('sb_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('sb_dark_mode', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('sb_hearts', JSON.stringify(heartsEnabled));
  }, [heartsEnabled]);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]);
  };

  const saveProgress = (novelId, chapterId, scrollPos) => {
    const newHistory = { ...history, [novelId]: { chapterId, scrollPos, time: Date.now() } };
    setHistory(newHistory);
    localStorage.setItem('sb_history', JSON.stringify(newHistory));
  };

  return (
    <AppContext.Provider value={{
      favorites, toggleFavorite,
      darkMode, setDarkMode,
      heartsEnabled, setHeartsEnabled,
      history, saveProgress
    }}>
      {children}
    </AppContext.Provider>
  );
};