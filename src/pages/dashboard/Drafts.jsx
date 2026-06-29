import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { NOVEL_STATUSES } from '../../lib/constants';

export function Drafts() {
  const { session } = useAuth();
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    async function load() {
      if (!session?.user) return;

      const { data: novels } = await supabase
        .from('novels')
        .select('*')
        .eq('created_by', session.user.id)
        .in('status', ['draft', 'pending'])
        .order('updated_at', { ascending: false });

      const { data: chapters } = await supabase
        .from('chapters')
        .select('*, novels!inner(created_by, title)')
        .eq('novels.created_by', session.user.id)
        .eq('is_draft', true);

      setDrafts([
        ...(novels || []).map((n) => ({ type: 'novel', ...n })),
        ...(chapters || []).map((c) => ({ type: 'chapter', ...c })),
      ]);
    }

    load();
  }, [session]);

  return (
    <section className="reader-card">
      <p className="reader-novel">Borradores</p>
      <h1>Tus borradores</h1>

      <div className="admin-list">
        {drafts.map((item) => (
          <article key={`${item.type}-${item.id}`} className="admin-item">
            <div>
              <span className="detail-pill">{item.type === 'novel' ? 'Novela' : 'Capítulo'}</span>
              <h3>{item.title}</h3>
              {item.type === 'chapter' && <p>{item.novels?.title}</p>}
              {item.type === 'novel' && <p>{NOVEL_STATUSES[item.status]}</p>}

              <Link
                to={
                  item.type === 'novel'
                    ? `/dashboard/novels/${item.id}/edit`
                    : `/dashboard/novels/${item.novel_id}/chapters/${item.id}/edit`
                }
                className="secondary-action"
              >
                Continuar editando
              </Link>
            </div>
          </article>
        ))}
      </div>

      {drafts.length === 0 && <div className="empty-state">No tienes borradores.</div>}
    </section>
  );
}
