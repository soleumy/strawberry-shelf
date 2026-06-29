import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Heart, Home, LayoutDashboard, UserRound } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/library', icon: BookOpen, label: 'Biblioteca' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
  { to: '/profile/edit', icon: UserRound, label: 'Perfil' },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="mobile-nav" aria-label="Navegación móvil">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

        return (
          <Link key={to} to={to} className={active ? 'active' : ''}>
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
