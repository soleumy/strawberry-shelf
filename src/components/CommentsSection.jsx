import React, { useEffect, useState } from 'react';
import { Edit2, MessageCircle, Reply, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ReportButton } from './ReportButton';
import { addLocalComment, deleteLocalComment, getLocalComments, updateLocalComment } from '../lib/localInteractions';

function CommentItem({ comment, profiles, onReply, onEdit, onDelete, currentUserId, isModerator }) {
  const profile = profiles[comment.user_id];
  const canEdit = comment.local || currentUserId === comment.user_id;
  const canDelete = canEdit || isModerator;

  return (
    <article className="comment-item">
      <div className="comment-avatar">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name || profile.username || 'Usuario'} />
        ) : (
          <span>{(profile?.display_name || profile?.username || 'L')[0]}</span>
        )}
      </div>

      <div className="comment-body">
        <header>
          <strong>{profile?.display_name || profile?.username || (comment.local ? 'Lector local' : 'Usuario')}</strong>
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
            <button type="button" className="text-button" onClick={() => onDelete(comment)}>
              <Trash2 size={14} /> Borrar
            </button>
          )}

          {!comment.local && <ReportButton targetType="comment" targetId={comment.id} label="Denunciar" />}
        </div>
      </div>
    </article>
  );
}

export function CommentsSection({ novelId, chapterId }) {
  const { user, isModerator } = useAuth();
  const [comments, setComments] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadComments() {
    setLoading(true);
    setMessage('');

    let remoteRows = [];

    if (supabase.isConfigured !== false) {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('novel_id', String(novelId))
        .eq('chapter_id', String(chapterId || ''))
        .order('created_at', { ascending: true });

      if (!error && data) remoteRows = data;
    }

    const localRows = getLocalComments(novelId, chapterId);
    const byId = new Map();
    [...remoteRows, ...localRows].forEach((row) => byId.set(row.id, row));
    const rows = [...byId.values()].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    setComments(rows);

    const userIds = [...new Set(rows.map((comment) => comment.user_id).filter(Boolean))].filter((id) => !String(id).startsWith('local'));
    const nextProfiles = {};

    if (user) {
      nextProfiles[user.id] = {
        id: user.id,
        display_name: user.email?.split('@')[0] || 'Lector',
        username: user.email?.split('@')[0] || 'lector',
      };
    }

    if (userIds.length > 0 && supabase.isConfigured !== false) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, username')
        .in('id', userIds);

      (profileRows || []).forEach((profile) => { nextProfiles[profile.id] = profile; });
    }

    setProfiles(nextProfiles);
    setLoading(false);
  }

  useEffect(() => {
    loadComments();
  }, [novelId, chapterId, user?.id]);

  async function submit(event) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    if (editing) {
      if (editing.local) updateLocalComment(editing.id, trimmed);
      else if (supabase.isConfigured !== false) {
        await supabase
          .from('comments')
          .update({ content: trimmed, is_edited: true, updated_at: new Date().toISOString() })
          .eq('id', editing.id);
      }
    } else {
      const localRow = addLocalComment({
        userId: user?.id,
        novelId,
        chapterId,
        parentId: replyTo,
        content: trimmed,
      });

      setComments((current) => [...current, localRow]);

      if (supabase.isConfigured !== false && user) {
        const { error } = await supabase.from('comments').insert({
          user_id: user.id,
          novel_id: String(novelId),
          chapter_id: String(chapterId || ''),
          parent_id: replyTo && String(replyTo).startsWith('local-') ? null : replyTo,
          content: trimmed,
        });

        if (error) setMessage('Comentario guardado localmente. Supabase no lo acepto todavia.');
      } else if (!user) {
        setMessage('Comentario guardado en este navegador. Inicia sesion para sincronizarlo.');
      }
    }

    setContent('');
    setReplyTo(null);
    setEditing(null);
    loadComments();
  }

  async function deleteComment(comment) {
    if (!confirm('¿Eliminar este comentario?')) return;

    if (comment.local) deleteLocalComment(comment.id);
    else if (supabase.isConfigured !== false) await supabase.from('comments').delete().eq('id', comment.id);

    loadComments();
  }

  const topLevel = comments.filter((comment) => !comment.parent_id);
  const replies = comments.filter((comment) => comment.parent_id);

  function getReplies(parentId) {
    return replies.filter((reply) => reply.parent_id === parentId);
  }

  return (
    <section className="comments-section">
      <h3><MessageCircle size={20} /> Comentarios ({comments.length})</h3>

      <form className="comment-form" onSubmit={submit}>
        {replyTo && <p className="form-message">Respondiendo a un comentario</p>}
        {editing && <p className="form-message">Editando comentario</p>}

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Escribe un comentario..."
          rows="3"
          required
        />

        <div className="comment-form-actions">
          <button type="submit" className="primary-action">
            {editing ? 'Guardar' : 'Publicar'}
          </button>

          {(replyTo || editing) && (
            <button type="button" className="text-button" onClick={() => { setReplyTo(null); setEditing(null); setContent(''); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {message && <p className="form-message">{message}</p>}
      {loading && <p className="form-message">Cargando comentarios...</p>}
      {!loading && comments.length === 0 && <div className="empty-state">Todavia no hay comentarios.</div>}

      <div className="comments-list">
        {topLevel.map((comment) => (
          <div key={comment.id} className="comment-thread">
            <CommentItem
              comment={comment}
              profiles={profiles}
              onReply={setReplyTo}
              onEdit={(nextComment) => { setEditing(nextComment); setContent(nextComment.content); }}
              onDelete={deleteComment}
              currentUserId={user?.id}
              isModerator={isModerator}
            />

            {getReplies(comment.id).map((reply) => (
              <div key={reply.id} className="comment-reply">
                <CommentItem
                  comment={reply}
                  profiles={profiles}
                  onReply={setReplyTo}
                  onEdit={(nextComment) => { setEditing(nextComment); setContent(nextComment.content); }}
                  onDelete={deleteComment}
                  currentUserId={user?.id}
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
