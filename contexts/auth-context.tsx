import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = supabase !== null;

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setIsLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { error: 'Supabase is not configured. Add keys to .env.' };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return {
        error: 'Supabase is not configured. Add keys to .env.',
        needsEmailConfirmation: false,
      };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error: error.message, needsEmailConfirmation: false };
    }

    const needsEmailConfirmation = !data.session;
    return { error: null, needsEmailConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return { error: 'Supabase is not configured. Add keys to .env.' };
    }

    const { error } = await supabase.auth.signOut();
    return { error: error?.message ?? null };
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!supabase) {
      return { error: 'Supabase is not configured. Add keys to .env.' };
    }

    const { data, error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });

    if (error) {
      return {
        error:
          error.message ||
          'Could not delete account. Deploy the delete-account Edge Function (see docs/account-deletion.md).',
      };
    }

    if (data && typeof data === 'object' && 'error' in data && data.error) {
      return { error: String(data.error) };
    }

    await supabase.auth.signOut();
    return { error: null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isConfigured,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      deleteAccount,
    }),
    [
      session,
      isLoading,
      isConfigured,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      deleteAccount,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
