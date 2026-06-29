import React, { useEffect, useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ContinueReading({ novelId }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) return;

      const { data } = await supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .eq('novel_id', novelId)
        .maybeSingle();

      setHistory(data || null);
    }

    loadHistory();
  }, [novelId]);

  if (!history?.chapter_id) return null;

  return (
    <Link className="continue-reading" to={`/novel/${novelId}/chapter/${history.chapter_id}`}>
      <BookOpenCheck size={18} />
      <span>Continuar leyendo</span>
      <strong>{history.progress_percent || 0}%</strong>
    </Link>
  );
}