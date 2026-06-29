import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { WHATSAPP_URL } from '../lib/constants';
import { MobileNav } from './MobileNav';

export function SiteLayout({ children, showMobileNav = true }) {
  return (
    <div className="site-shell">
      <div className="sparkle-field" />

      <header className="site-header">
        <nav className="nav-bubble">
          <Link to="/" className="brand">
            <span className="brand-mark">🍓</span>
            <span className="brand-title">strawberry shelf</span>
          </Link>

          <div className="nav-links">
            <Link to="/">Inicio</Link>
            <Link to="/library">Biblioteca</Link>
            <Link to="/dashboard">Mi Panel</Link>
            <Link to="/profile/edit">Perfil</Link>
          </div>

          <a className="quote-button" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            Contáctame <Heart size={16} fill="currentColor" />
          </a>
        </nav>
      </header>

      {children}

      {showMobileNav && <MobileNav />}
    </div>
  );
}
