import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  loading: true,
  userId: null,
  isAdmin: false,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    setProfile(data || null);
    return data || null;
  }

  async function refresh() {
    if (supabase.isConfigured === false) {
      setLoading(false);
      return;
    }

    const { data } = await supabase.auth.getSession();
    const currentSession = data.session || null;

    setSession(currentSession);
    setUser(currentSession?.user || null);

    if (currentSession?.user) {
      await loadProfile(currentSession.user.id);
    } else {
      setProfile(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    refresh();

    if (supabase.isConfigured === false) return undefined;

    const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession || null);
      setUser(currentSession?.user || null);

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (supabase.isConfigured !== false) {
      await supabase.auth.signOut();
    }

    setSession(null);
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        userId: user?.id || null,
        isAdmin: profile?.role === 'admin' || !!profile?.is_admin,
        refresh,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}