import React, { useEffect, useState } from 'react';
import { Edit2, MessageCircle, Reply, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ReportButton } from './ReportButton';

function CommentItem({ comment, profiles, onReply, onEdit, onDelete, currentUserId, isModerator }) {
  const profile = profiles[comment.user_id];
  const canEdit = currentUserId === comment.user_id;
  const canDelete = canEdit || isModerator;

  return (
    <article className="comment-item">
      <div className="comment-avatar">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name} />
        ) : (
          <span>{(profile?.display_name || '?')[0]}</span>
        )}
      </div>

      <div className="comment-body">
        <header>
          <strong>{profile?.display_name || 'Usuario'}</strong>
          <time>{new Date(comment.created_at).toLocaleDateString('es')}</time>
          {comment.is_edited && <span className="comment-edited">editado</span>}
        </header>

        <p>{comment.content}</p>

        <div className="comment-actions">
          <button type="button" className="text-button" onClick={() => onReply(comment.id)}>
            <Reply size={14} /> Responder
          </button>

          {canEdit && (
            <button type="button" className="text-button" onClick={() => onEdit(comment)}>
              <Edit2 size={14} /> Editar
            </button>
          )}

          {canDelete && (
            <button type="button" className="text-button" onClick={() => onDelete(comment.id)}>
              <Trash2 size={14} /> Borrar
            </button>
          )}

          <ReportButton targetType="comment" targetId={comment.id} label="Denunciar" />
        </div>
      </div>
    </article>
  );
}

export function CommentsSection({ novelId, chapterId }) {
  const { session, isModerator } = useAuth();
  const [comments, setComments] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('novel_id', String(novelId))
      .eq('chapter_id', String(chapterId))
      .order('created_at', { ascending: true });

    const rows = data || [];
    setComments(rows);

    const userIds = [...new Set(rows.map((c) => c.user_id))];

    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, username')
        .in('id', userIds);

      const map = {};
      (profileRows || []).forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadComments();
  }, [novelId, chapterId]);

  async function submit(event) {
    event.preventDefault();

    if (!session?.user || !content.trim()) return;

    if (editing) {
      await supabase
        .from('comments')
        .update({ content: content.trim(), is_edited: true, updated_at: new Date().toISOString() })
        .eq('id', editing.id);
    } else {
      await supabase.from('comments').insert({
        user_id: session.user.id,
        novel_id: String(novelId),
        chapter_id: String(chapterId),
        parent_id: replyTo,
        content: content.trim(),
      });
    }

    setContent('');
    setReplyTo(null);
    setEditing(null);
    loadComments();
  }

  async function deleteComment(id) {
    if (!confirm('¿Eliminar este comentario?')) return;
    await supabase.from('comments').delete().eq('id', id);
    loadComments();
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => c.parent_id);

  function getReplies(parentId) {
    return replies.filter((r) => r.parent_id === parentId);
  }

  return (
    <section className="comments-section">
      <h3><MessageCircle size={20} /> Comentarios ({comments.length})</h3>

      {session && (
        <form className="comment-form" onSubmit={submit}>
          {replyTo && <p className="form-message">Respondiendo a un comentario</p>}
          {editing && <p className="form-message">Editando comentario</p>}

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escribe un comentario..."
            rows="3"
            required
          />

          <div className="comment-form-actions">
            <button type="submit" className="primary-action">
              {editing ? 'Guardar' : 'Publicar'}
            </button>

            {(replyTo || editing) && (
              <button
                type="button"
                className="text-button"
                onClick={() => { setReplyTo(null); setEditing(null); setContent(''); }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      {!session && <p className="form-message">Inicia sesión para comentar.</p>}

      {loading && <p className="form-message">Cargando comentarios...</p>}

      <div className="comments-list">
        {topLevel.map((comment) => (
          <div key={comment.id} className="comment-thread">
            <CommentItem
              comment={comment}
              profiles={profiles}
              onReply={setReplyTo}
              onEdit={(c) => { setEditing(c); setContent(c.content); }}
              onDelete={deleteComment}
              currentUserId={session?.user?.id}
              isModerator={isModerator}
            />

            {getReplies(comment.id).map((reply) => (
              <div key={reply.id} className="comment-reply">
                <CommentItem
                  comment={reply}
                  profiles={profiles}
                  onReply={setReplyTo}
                  onEdit={(c) => { setEditing(c); setContent(c.content); }}
                  onDelete={deleteComment}
                  currentUserId={session?.user?.id}
                  isModerator={isModerator}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
