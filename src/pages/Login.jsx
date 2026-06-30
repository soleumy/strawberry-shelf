import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, LogIn, Mail, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

function getErrorMessage(error) {
  const message = error?.message || '';

  if (message.includes('Invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }

  if (message.includes('User already registered')) {
    return 'Ese correo ya está registrado. Inicia sesión.';
  }

  if (message.includes('Password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  return message || 'Ocurrió un error.';
}

export function Login() {
  const { user, refresh } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function ensureProfile(currentUser) {
    if (!currentUser?.id) return;

    const usernameBase =
      currentUser.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
      `user_${currentUser.id.slice(0, 8)}`;

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (existingProfile) return;

    await supabase.from('profiles').insert({
      id: currentUser.id,
      username: `${usernameBase}_${currentUser.id.slice(0, 8)}`,
      display_name: displayName || usernameBase,
    });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setMessage('Escribe tu correo y contraseña.');
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      await ensureProfile(data.user);
      await refresh?.();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setMessage('');

    if (!email.trim() || !password.trim()) {
      setMessage('Escribe tu correo y contraseña.');
      return;
    }

    if (password.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        await ensureProfile(data.user);
      }

      await refresh?.();
      setMessage('Cuenta creada. Ya puedes entrar.');
    } catch (error) {
      setMessage(getErrorMessage(error));
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
        <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>

        <div className="library-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login');
              setMessage('');
            }}
          >
            <LogIn size={16} /> Entrar
          </button>

          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register');
              setMessage('');
            }}
          >
            <UserPlus size={16} /> Registrarme
          </button>
        </div>

        <form className="profile-form" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          {mode === 'register' && (
            <label>
              Nombre público
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Tu nombre"
              />
            </label>
          )}

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

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </label>

          <button type="submit" className="primary-action" disabled={sending}>
            {sending
              ? 'Procesando...'
              : mode === 'login'
                ? 'Iniciar sesión'
                : 'Crear cuenta'}{' '}
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
          </button>

          {message && <p className="form-message">{message}</p>}
        </form>
      </section>
    </main>
  );
}

export default Login;