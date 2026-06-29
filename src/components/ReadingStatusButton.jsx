import React, { useEffect, useState } from 'react';
import { BookMarked } from 'lucide-react';
import { supabase } from '../lib/supabase';

const OPTIONS = [
  { value: '', label: 'Añadir a biblioteca' },
  { value: 'reading', label: 'Leyendo' },
  { value: 'want_to_read', label: 'Quiero leer' },
  { value: 'completed', label: 'Terminada' },
  { value: 'paused', label: 'En pausa' },
];

export function ReadingStatusButton({ novelId }) {
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData.session || null;

    setSession(currentSession);

    if (!currentSession?.user) return;

    const { data } = await supabase
      .from('reading_list')
      .select('status')
      .eq('novel_id', novelId)
      .eq('user_id', currentSession.user.id)
      .maybeSingle();

    setStatus(data?.status || '');
  }

  async function changeStatus(nextStatus) {
    if (!session?.user) {
      alert('Inicia sesión para guardar tu biblioteca.');
      return;
    }

    setLoading(true);

    if (!nextStatus) {
      await supabase
        .from('reading_list')
        .delete()
        .eq('novel_id', novelId)
        .eq('user_id', session.user.id);

      setStatus('');
      setLoading(false);
      return;
    }

    await supabase.from('reading_list').upsert({
      novel_id: novelId,
      user_id: session.user.id,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    });

    setStatus(nextStatus);
    setLoading(false);
  }

  useEffect(() => {
    loadStatus();
  }, [novelId]);

  return (
    <label className="library-select">
      <BookMarked size={17} />
      <select value={status} onChange={(event) => changeStatus(event.target.value)} disabled={loading}>
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}