import React, { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';

const DEFAULTS = {
  fontSize: 18,
  fontFamily: 'Nunito, sans-serif',
  lineWidth: 720,
  margin: 24,
  darkMode: false,
  scrollMode: 'continuous',
  pageMode: false,
};

const STORAGE_KEY = 'strawberry-reader-settings';

export function useReaderSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    document.documentElement.classList.toggle('reader-dark', settings.darkMode);
  }, [settings]);

  function update(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return { settings, update };
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
        <input type="range" min="14" max="28" value={settings.fontSize} onChange={(e) => update('fontSize', Number(e.target.value))} />
      </label>

      <label>
        Fuente
        <select value={settings.fontFamily} onChange={(e) => update('fontFamily', e.target.value)}>
          <option value="Nunito, sans-serif">Nunito</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Courier New', monospace">Courier</option>
          <option value="'Quicksand', sans-serif">Quicksand</option>
        </select>
      </label>

      <label>
        Ancho del texto: {settings.lineWidth}px
        <input type="range" min="480" max="960" step="20" value={settings.lineWidth} onChange={(e) => update('lineWidth', Number(e.target.value))} />
      </label>

      <label>
        Margen: {settings.margin}px
        <input type="range" min="8" max="64" value={settings.margin} onChange={(e) => update('margin', Number(e.target.value))} />
      </label>

      <label className="checkbox-label">
        <input type="checkbox" checked={settings.darkMode} onChange={(e) => update('darkMode', e.target.checked)} />
        Modo oscuro
      </label>

      <label className="checkbox-label">
        <input type="checkbox" checked={settings.pageMode} onChange={(e) => update('pageMode', e.target.checked)} />
        Modo página
      </label>

      <label>
        Desplazamiento
        <select value={settings.scrollMode} onChange={(e) => update('scrollMode', e.target.value)}>
          <option value="continuous">Continuo</option>
          <option value="paged">Por capítulo</option>
        </select>
      </label>
    </div>
  );
}
