import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingSupabaseConfig = !supabaseUrl || !supabaseAnonKey;

function createEmptyQuery() {
  const result = Promise.resolve({
    data: null,
    error: new Error('Supabase no esta configurado. Revisa las variables de entorno en Vercel.'),
    count: 0,
  });

  const query = {
    select: () => query,
    insert: () => result,
    update: () => query,
    delete: () => query,
    upsert: () => result,
    eq: () => query,
    in: () => query,
    order: () => result,
    single: () => result,
    maybeSingle: () => result,
    then: result.then.bind(result),
    catch: result.catch.bind(result),
    finally: result.finally.bind(result),
  };

  return query;
}

function createDisabledSupabaseClient() {
  return {
    isConfigured: false,
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
      signInWithPassword: async () => ({
        data: null,
        error: new Error('Supabase no esta configurado en Vercel.'),
      }),
      signUp: async () => ({
        data: null,
        error: new Error('Supabase no esta configurado en Vercel.'),
      }),
      signOut: async () => ({ error: null }),
    },
    from: () => createEmptyQuery(),
    storage: {
      from: () => ({
        upload: async () => ({
          data: null,
          error: new Error('Supabase Storage no esta configurado.'),
        }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  };
}

export const supabase = missingSupabaseConfig
  ? createDisabledSupabaseClient()
  : createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
