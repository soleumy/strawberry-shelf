import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, LogIn, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (!email.trim()) {
      setMessage('Escribe tu email.');
      return;
    }

    setSending(true);

    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}#/dashboard`;

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw error;

      setMessage('Te envié un enlace para iniciar sesión. Revisa tu correo.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="detail-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={18} /> Volver al catálogo
      </Link>

      <section className="reader-card">
        <p className="reader-novel">Cuenta</p>
        <h1>Iniciar sesión</h1>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label>
            Email
            <div className="catalog-search">
              <Mail size={17} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
          </label>

          <button type="submit" className="primary-action" disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar enlace'} <LogIn size={18} />
          </button>

          {message && <p className="form-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}

export default Login;