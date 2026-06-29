import React, { useEffect, useState } from 'react';
import { getComments, createComment, deleteComment, getReplies } from '../lib/api/comments';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Trash2, Reply } from 'lucide-react';

function CommentItem({ comment, profiles, onDelete, onReply }) {
  const { userId } = useAuth();
  const profile = profiles?.get(comment.user_id);
  const [replies, setReplies] = useState([]);
  const [showReplies, setShowReplies] = useState(false);

  useEffect(() => {
    async function loadReplies() {
      const { data } = await getReplies(comment.id);
      setReplies(data || []);
    }
    if (showReplies) loadReplies();
  }, [showReplies, comment.id]);

  return (
    <article className="comment-item">
      <div className="comment-header">
        {profile?.avatar_url && <img src={profile.avatar_url} alt={profile.username} className="avatar-sm" />}
        <div>
          <strong>{profile?.display_name || profile?.username || 'Anónimo'}</strong>
          <span className="muted">{new Date(comment.created_at).toLocaleString()}</span>
          {comment.is_edited && <span className="muted">(editado)</span>}
        </div>
      </div>
      <p className="comment-content">{comment.content}</p>
      <div className="comment-actions">
        <button className="button-sm" onClick={() => onReply(comment.id)}>
          <Reply size={14} /> Responder
        </button>
        {userId === comment.user_id && (
          <button className="button-sm" onClick={() => onDelete(comment.id)}>
            <Trash2 size={14} /> Eliminar
          </button>
        )}
      </div>
      {!showReplies && replies.length > 0 && (
        <button className="button-sm" onClick={() => setShowReplies(true)}>
          Ver {replies.length} respuesta(s)
        </button>
      )}
      {showReplies && (
        <div className="replies-section">
          {replies.map((r) => (
            <CommentItem key={r.id} comment={r} profiles={profiles} onDelete={onDelete} onReply={onReply} />
          ))}
        </div>
      )}
    </article>
  );
}

export function Comments({ novelId, chapterId }) {
  const { userId } = useAuth();
  const [comments, setComments] = useState([]);
  const [profiles, setProfiles] = useState(new Map());
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await getComments(novelId, chapterId);
      setComments(data || []);

      const ids = [...new Set((data || []).map((c) => c.user_id).filter(Boolean))];
      if (ids.length > 0) {
        const { data: profilesData } = await supabase.from('profiles').select('id,username,display_name,avatar_url').in('id', ids);
        const map = new Map();
        (profilesData || []).forEach((p) => map.set(p.id, p));
        setProfiles(map);
      }
      setLoading(false);
    }
    load();
  }, [novelId, chapterId]);

  async function handlePostComment() {
    if (!userId) { alert('Inicia sesión para comentar.'); return; }
    if (!newComment.trim()) return;
    setLoading(true);
    const { data } = await createComment({
      novelId,
      chapterId,
      userId,
      content: newComment,
      parentId: replyingTo,
    });
    if (data) {
      setComments((c) => [data, ...c]);
      setNewComment('');
      setReplyingTo(null);
    }
    setLoading(false);
  }

  async function handleDeleteComment(commentId) {
    if (!confirm('¿Eliminar comentario?')) return;
    await deleteComment(commentId);
    setComments((c) => c.filter((x) => x.id !== commentId));
  }

  return (
    <section className="comments-section">
      <h3><MessageCircle size={20} /> Comentarios</h3>

      {userId && (
        <div className="comment-form">
          <textarea
            placeholder="Escribe tu comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows="3"
          />
          <div className="form-actions">
            <button className="primary-action" onClick={handlePostComment} disabled={loading}>
              Comentar
            </button>
            {replyingTo && (
              <button className="secondary-action" onClick={() => setReplyingTo(null)}>
                Cancelar respuesta
              </button>
            )}
          </div>
        </div>
      )}

      {loading && <p>Cargando comentarios...</p>}

      {!loading && comments.length === 0 && <p className="empty-state">Sin comentarios aún.</p>}

      <div className="comments-list">
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            profiles={profiles}
            onDelete={handleDeleteComment}
            onReply={setReplyingTo}
          />
        ))}
      </div>
    </section>
  );
}
