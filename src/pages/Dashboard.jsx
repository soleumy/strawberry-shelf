import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, BookOpen, Heart, History, LibraryBig, Settings, UserRound } from 'lucide-react';

const ITEMS = [
  { label: 'Mis novelas', icon: BookOpen, to: '/dashboard' },
  { label: 'Biblioteca', icon: LibraryBig, to: '/library' },
  { label: 'Favoritos', icon: Heart, to: '/library' },
  { label: 'Historial', icon: History, to: '/library' },
  { label: 'Notificaciones', icon: Bell, to: '/dashboard' },
  { label: 'Perfil', icon: UserRound, to: '/profile/edit' },
  { label: 'Configuración', icon: Settings, to: '/dashboard' },
];

export function Dashboard() {
  return (
    <main className="detail-page">
      <section className="reader-card">
        <p className="reader-novel">Mi Panel</p>
        <h1>Tu espacio de lectura</h1>

        <div className="chapter-list">
          {ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <Link key={item.label} to={item.to} className="chapter-link">
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}