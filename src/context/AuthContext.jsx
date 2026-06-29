import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ensureProfileForUser } from '../lib/api/profiles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    setProfile(data || null);
    return data;
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const currentSession = data.session || null;
    setSession(currentSession);

    if (currentSession?.user) {
      // Ensure a profile row exists for this user, then load it
      await ensureProfileForUser(currentSession.user);
      await loadProfile(currentSession.user.id);
    } else {
      setProfile(null);
    }

    setLoading(false);
  }, [loadProfile]);

  useEffect(() => {
    refresh();

    const { data } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const value = useMemo(() => ({
    session,
    profile,
    loading,
    isAdmin: !!profile?.is_admin,
    isModerator: !!(profile?.is_moderator || profile?.is_admin),
    userId: session?.user?.id || null,
    refresh,
    loadProfile,
  }), [session, profile, loading, refresh, loadProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
