import React, { useEffect, useState } from 'react';
import { BookMarked } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getLocalReadingStatus, setLocalReadingStatus } from '../lib/localInteractions';

const OPTIONS = [
  { value: '', label: 'Añadir a biblioteca' },
  { value: 'reading', label: 'Leyendo' },
  { value: 'want_to_read', label: 'Quiero leer' },
  { value: 'completed', label: 'Terminada' },
  { value: 'paused', label: 'En pausa' },
];

export function ReadingStatusButton({ novelId }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    setStatus(getLocalReadingStatus(user?.id, novelId));

    if (supabase.isConfigured === false || !user) return;

    const { data, error } = await supabase
      .from('reading_list')
      .select('status')
      .eq('novel_id', String(novelId))
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data?.status) {
      setStatus(data.status);
      setLocalReadingStatus(user.id, novelId, data.status);
    }
  }

  async function changeStatus(nextStatus) {
    setLoading(true);
    setStatus(nextStatus);
    setLocalReadingStatus(user?.id, novelId, nextStatus);

    if (supabase.isConfigured !== false && user) {
      if (!nextStatus) {
        await supabase
          .from('reading_list')
          .delete()
          .eq('novel_id', String(novelId))
          .eq('user_id', user.id);
      } else {
        const payload = {
          novel_id: String(novelId),
          user_id: user.id,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('reading_list')
          .upsert(payload, { onConflict: 'user_id,novel_id' });

        if (error) {
          await supabase.from('reading_list').delete().eq('novel_id', String(novelId)).eq('user_id', user.id);
          await supabase.from('reading_list').insert(payload);
        }
      }
    }

    setLoading(false);
  }

  useEffect(() => {
    loadStatus();
  }, [novelId, user?.id]);

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
