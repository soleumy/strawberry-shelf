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
