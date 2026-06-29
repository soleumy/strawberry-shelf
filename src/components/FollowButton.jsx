import React, { useEffect, useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { followUser, unfollowUser, isFollowing } from '../lib/api/followers';

export function FollowButton({ userId }) {
  const [session, setSession] = useState(null);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  async function load() {
    const { data } = await supabase.auth.getSession();
    const s = data.session || null;
    setSession(s);
    if (!s?.user) return;
    const res = await isFollowing(s.user.id, userId);
    setFollowing(Boolean(res.data));
  }

  async function toggle() {
    const { data } = await supabase.auth.getSession();
    const s = data.session || null;
    if (!s?.user) { alert('Inicia sesión para seguir usuarios.'); return; }
    setLoading(true);
    if (following) {
      await unfollowUser(s.user.id, userId);
      setFollowing(false);
    } else {
      await followUser(s.user.id, userId);
      setFollowing(true);
    }
    setLoading(false);
    try {
      window.dispatchEvent(new CustomEvent('follow-changed', { detail: { targetId: userId, following: !following } }));
    } catch (e) {
      // ignore in non-browser env
    }
  }

  useEffect(() => { load(); }, [userId]);

  return (
    <button type="button" className="secondary-action" onClick={toggle} disabled={loading}>
      {following ? <UserMinus size={16} /> : <UserPlus size={16} />} {following ? 'Siguiendo' : 'Seguir'}
    </button>
  );
}
import React, { useEffect, useState } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function FollowButton({ userId }) {
  const { session, userId: currentUserId } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      if (!session?.user || !userId || userId === currentUserId) return;

      const { data } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
        .maybeSingle();

      setIsFollowing(Boolean(data));
    }

    check();
  }, [session, userId, currentUserId]);

  if (!userId || userId === currentUserId) return null;

  async function toggle() {
    if (!session?.user) {
      alert('Inicia sesión para seguir usuarios.');
      return;
    }

    setLoading(true);

    if (isFollowing) {
      await supabase
        .from('followers')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', userId);
    } else {
      await supabase.from('followers').insert({
        follower_id: session.user.id,
        following_id: userId,
      });

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'follower',
        title: 'Nuevo seguidor',
        body: 'Alguien empezó a seguirte.',
        actor_id: session.user.id,
      });
    }

    setIsFollowing(!isFollowing);
    setLoading(false);
  }

  return (
    <button type="button" className="secondary-action" onClick={toggle} disabled={loading}>
      {isFollowing ? <UserMinus size={17} /> : <UserPlus size={17} />}
      {isFollowing ? 'Dejar de seguir' : 'Seguir'}
    </button>
  );
}
