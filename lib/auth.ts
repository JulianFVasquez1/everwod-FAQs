import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export const getSession = async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session;
};

export const signIn = async (email: string, password: string) => {
  return await supabaseClient.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string) => {
  return await supabaseClient.auth.signUp({ email, password });
};

export const signOut = async () => {
  return await supabaseClient.auth.signOut();
};

export const getUser = async () => {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
};
