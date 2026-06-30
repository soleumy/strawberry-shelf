import React, { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DEFAULTS = {
  fontSize: 18,
  fontFamily: 'Nunito, sans-serif',
  lineWidth: 720,
  lineHeight: 1.8,
  margin: 24,
  theme: 'light',
  darkMode: false,
  scrollMode: 'continuous',
  pageMode: false,
};

const STORAGE_KEY = 'strawberry-reader-settings';

function normalizeSettings(value) {
  const settings = { ...DEFAULTS, ...(value || {}) };

  return {
    ...settings,
    darkMode: settings.theme === 'dark' || settings.darkMode === true,
  };
}

export function useReaderSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? normalizeSettings(JSON.parse(saved)) : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  const [userId, setUserId] = useState(null);
  const [loadedRemote, setLoadedRemote] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadRemotePreferences() {
      if (supabase.isConfigured === false) {
        setLoadedRemote(true);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user || null;

      if (!active) return;

      setUserId(currentUser?.id || null);

      if (!currentUser) {
        setLoadedRemote(true);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('reader_preferences')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!active) return;

      if (data?.reader_preferences) {
        setSettings((current) => normalizeSettings({
          ...current,
          ...data.reader_preferences,
        }));
      }

      setLoadedRemote(true);
    }

    loadRemotePreferences();

    const subscription = supabase.auth?.onAuthStateChange?.((_event, session) => {
      const currentUser = session?.user || null;
      setUserId(currentUser?.id || null);

      if (!currentUser) {
        setLoadedRemote(true);
      }
    });

    return () => {
      active = false;
      subscription?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const normalized = normalizeSettings(settings);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    document.documentElement.classList.toggle('reader-dark', normalized.theme === 'dark');
    document.documentElement.classList.toggle('reader-sepia', normalized.theme === 'sepia');
  }, [settings]);

  useEffect(() => {
    if (!loadedRemote || !userId || supabase.isConfigured === false) return undefined;

    const timer = window.setTimeout(async () => {
      const preferences = {
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        lineWidth: settings.lineWidth,
        lineHeight: settings.lineHeight,
        margin: settings.margin,
        theme: settings.theme,
        scrollMode: settings.scrollMode,
        pageMode: settings.pageMode,
      };

      await supabase
        .from('profiles')
        .update({ reader_preferences: preferences })
        .eq('id', userId);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [settings, loadedRemote, userId]);

  function update(key, value) {
    setSettings((current) => {
      const next = { ...current, [key]: value };

      if (key === 'theme') {
        next.darkMode = value === 'dark';
      }

      return normalizeSettings(next);
    });
  }

  return { settings: normalizeSettings(settings), update };
}

export function ReaderSettings({ settings, update }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="reader-settings-toggle" onClick={() => setOpen(true)} aria-label="Ajustes del lector">
        <Settings2 size={18} />
      </button>
    );
  }

  return (
    <div className="reader-settings-panel fade-in">
      <div className="reader-settings-header">
        <strong>Ajustes del lector</strong>
        <button type="button" className="text-button" onClick={() => setOpen(false)}>Cerrar</button>
      </div>

      <label>
        Tamaño de fuente: {settings.fontSize}px
        <input
          type="range"
          min="14"
          max="30"
          value={settings.fontSize}
          onChange={(event) => update('fontSize', Number(event.target.value))}
        />
      </label>

      <label>
        Fuente
        <select value={settings.fontFamily} onChange={(event) => update('fontFamily', event.target.value)}>
          <option value="Nunito, sans-serif">Nunito</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Courier New', monospace">Courier</option>
          <option value="'Quicksand', sans-serif">Quicksand</option>
        </select>
      </label>

      <label>
        Ancho del texto: {settings.lineWidth}px
        <input
          type="range"
          min="480"
          max="960"
          step="20"
          value={settings.lineWidth}
          onChange={(event) => update('lineWidth', Number(event.target.value))}
        />
      </label>

      <label>
        Interlineado: {settings.lineHeight}
        <input
          type="range"
          min="1.4"
          max="2.4"
          step="0.1"
          value={settings.lineHeight}
          onChange={(event) => update('lineHeight', Number(event.target.value))}
        />
      </label>

      <label>
        Margen: {settings.margin}px
        <input
          type="range"
          min="8"
          max="64"
          value={settings.margin}
          onChange={(event) => update('margin', Number(event.target.value))}
        />
      </label>

      <label>
        Modo de lectura
        <select value={settings.theme} onChange={(event) => update('theme', event.target.value)}>
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
          <option value="sepia">Sepia</option>
        </select>
      </label>

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={settings.pageMode}
          onChange={(event) => update('pageMode', event.target.checked)}
        />
        Modo página
      </label>

      <label>
        Desplazamiento
        <select value={settings.scrollMode} onChange={(event) => update('scrollMode', event.target.value)}>
          <option value="continuous">Continuo</option>
          <option value="paged">Por capítulo</option>
        </select>
      </label>
    </div>
  );
}