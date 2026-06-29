import React, { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function ReportButton({ targetType, targetId, label = 'Denunciar' }) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (!session?.user) {
      alert('Inicia sesión para denunciar.');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      target_type: targetType,
      target_id: String(targetId),
      reason,
      details,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Reporte enviado. Gracias.');
    setReason('');
    setDetails('');

    setTimeout(() => {
      setOpen(false);
      setMessage('');
    }, 2000);
  }

  if (!open) {
    return (
      <button type="button" className="text-button report-btn" onClick={() => setOpen(true)}>
        <Flag size={15} /> {label}
      </button>
    );
  }

  return (
    <form className="report-form" onSubmit={submit}>
      <label>
        Motivo
        <select value={reason} onChange={(e) => setReason(e.target.value)} required>
          <option value="">Selecciona...</option>
          <option value="spam">Spam</option>
          <option value="inappropriate">Contenido inapropiado</option>
          <option value="copyright">Copyright</option>
          <option value="harassment">Acoso</option>
          <option value="other">Otro</option>
        </select>
      </label>

      <label>
        Detalles
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows="3" />
      </label>

      <div className="report-actions">
        <button type="submit" className="primary-action" disabled={saving}>
          {saving ? 'Enviando...' : 'Enviar reporte'}
        </button>
        <button type="button" className="text-button" onClick={() => setOpen(false)}>
          Cancelar
        </button>
      </div>

      {message && <p className="form-message">{message}</p>}
    </form>
  );
}
