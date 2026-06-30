import React, { useEffect, useState } from 'react';
import { ArrowUpDown, Edit2, Heart, MessageCircle, Reply, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ReportButton } from './ReportButton';
import { addLocalComment, deleteLocalComment, getLocalComments, updateLocalComment } from '../lib/localInteractions';

function CommentItem({ comment, profiles, onReply, onEdit, onDelete, onLike, currentUserId, isModerator, isLiked, likeCount, isLiking }) {
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
          {!comment.local && (
            <button
              type="button"
              className={`text-button ${isLiked ? 'comment-liked' : ''}`}
              onClick={() => onLike(comment.id)}
              disabled={isLiking}
            >
              <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} /> {likeCount || 0}
            </button>
          )}

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
  const [sortBy, setSortBy] = useState('recent');
  const [likedComments, setLikedComments] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [likingComment, setLikingComment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    let rows = [...byId.values()];

    if (sortBy === 'popular') {
      rows.sort((a, b) => (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0));
    } else {
      rows.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

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

    if (supabase.isConfigured !== false && user) {
      const { data: likes } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id);

      const likedSet = new Set((likes || []).map((like) => like.comment_id));
      setLikedComments(likedSet);
    }

    if (supabase.isConfigured !== false) {
      const { data: allLikes } = await supabase
        .from('comment_likes')
        .select('comment_id');

      const counts = {};
      (allLikes || []).forEach((like) => {
        counts[like.comment_id] = (counts[like.comment_id] || 0) + 1;
      });
      setLikeCounts(counts);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadComments();
  }, [novelId, chapterId, user?.id, sortBy]);

  async function submit(event) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);

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
    setSubmitting(false);
    loadComments();
  }

  async function deleteComment(comment) {
    if (!window.confirm('¿Eliminar este comentario?')) return;

    if (comment.local) deleteLocalComment(comment.id);
    else if (supabase.isConfigured !== false) await supabase.from('comments').delete().eq('id', comment.id);

    loadComments();
  }

  async function toggleLike(commentId) {
    if (!user || likingComment) return;

    setLikingComment(commentId);

    const isLiked = likedComments.has(commentId);

    if (isLiked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      setLikedComments((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
      setLikeCounts((current) => ({
        ...current,
        [commentId]: Math.max(0, (current[commentId] || 0) - 1),
      }));
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
      setLikedComments((current) => new Set([...current, commentId]));
      setLikeCounts((current) => ({
        ...current,
        [commentId]: (current[commentId] || 0) + 1,
      }));
    }

    setLikingComment(null);
  }

  const topLevel = comments.filter((comment) => !comment.parent_id);
  const replies = comments.filter((comment) => comment.parent_id);

  function getReplies(parentId) {
    return replies.filter((reply) => reply.parent_id === parentId);
  }

  return (
    <section className="comments-section">
      <div className="comments-header">
        <h3><MessageCircle size={20} /> Comentarios ({comments.length})</h3>
        <button
          type="button"
          className="text-button"
          onClick={() => setSortBy(sortBy === 'recent' ? 'popular' : 'recent')}
        >
          <ArrowUpDown size={16} /> {sortBy === 'recent' ? 'Recientes' : 'Populares'}
        </button>
      </div>

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
          <button type="submit" className="primary-action" disabled={submitting}>
            {submitting ? 'Publicando...' : (editing ? 'Guardar' : 'Publicar')}
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
              onLike={toggleLike}
              currentUserId={user?.id}
              isModerator={isModerator}
              isLiked={likedComments.has(comment.id)}
              likeCount={likeCounts[comment.id] || 0}
              isLiking={likingComment === comment.id}
            />

            {getReplies(comment.id).map((reply) => (
              <div key={reply.id} className="comment-reply">
                <CommentItem
                  comment={reply}
                  profiles={profiles}
                  onReply={setReplyTo}
                  onEdit={(nextComment) => { setEditing(nextComment); setContent(nextComment.content); }}
                  onDelete={deleteComment}
                  onLike={toggleLike}
                  currentUserId={user?.id}
                  isModerator={isModerator}
                  isLiked={likedComments.has(reply.id)}
                  likeCount={likeCounts[reply.id] || 0}
                  isLiking={likingComment === reply.id}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
