import React, { useEffect, useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { findLocalNovel } from '../lib/novelUtils';

export function ContinueReading({ novelId, className = '' }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function loadHistory() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) return;

      let query = supabase
        .from('reading_history')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('updated_at', { ascending: false });

      if (novelId) {
        query = query.eq('novel_id', novelId);
      } else {
        query = query.limit(3);
      }

      const { data } = await query;

      if (novelId) {
        setItems(data?.[0] ? [data[0]] : data ? [data] : []);
        return;
      }

      setItems(data || []);
    }

    loadHistory();
  }, [novelId]);

  const history = novelId ? items[0] : null;

  if (novelId) {
    if (!history?.chapter_id) return null;

    return (
      <Link className={`continue-reading ${className}`} to={`/novel/${novelId}/chapter/${history.chapter_id}`}>
        <BookOpenCheck size={18} />
        <span>Continuar leyendo</span>
        <strong>{history.progress_percent || 0}%</strong>
      </Link>
    );
  }

  if (!items.length) return null;

  return (
    <section className={`continue-reading-section ${className}`}>
      <h3><BookOpenCheck size={20} /> Continúa leyendo</h3>
      <div className="continue-reading-list">
        {items.map((item) => {
          const local = findLocalNovel(item.novel_id);
          const title = local?.title || 'Novela';

          return (
            <Link key={item.novel_id} className="continue-reading" to={`/novel/${item.novel_id}/chapter/${item.chapter_id}`}>
              <BookOpenCheck size={18} />
              <span>{title}</span>
              <strong>Cap. · {item.progress_percent || 0}%</strong>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
