import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Suspense fallback={<div className="loading-screen">Cargando Strawberry Shelf...</div>}>
        <App />
      </Suspense>
    </AuthProvider>
  </React.StrictMode>,
);
