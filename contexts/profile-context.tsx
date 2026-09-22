import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '@/contexts/auth-context';
import {
  canCreateEvents,
  ensureProfile,
  setOrganizerFlag,
} from '@/lib/profiles';
import type { Profile } from '@/types/profile';

type ProfileContextValue = {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  canCreate: boolean;
  refreshProfile: () => Promise<void>;
  becomeOrganizer: () => Promise<{ error: string | null }>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const fallbackName =
      user.user_metadata?.display_name ??
      user.email?.split('@')[0] ??
      'User';

    const result = await ensureProfile(user.id, fallbackName);
    setProfile(result.profile);
    setError(result.error);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const becomeOrganizer = useCallback(async () => {
    if (!user) {
      return { error: 'Sign in to become an organizer.' };
    }

    const result = await setOrganizerFlag(user.id, true);
    if (result.error) {
      return { error: result.error };
    }

    setProfile(result.profile);
    return { error: null };
  }, [user]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      isLoading,
      error,
      canCreate: canCreateEvents(profile),
      refreshProfile,
      becomeOrganizer,
    }),
    [profile, isLoading, error, refreshProfile, becomeOrganizer]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const value = useContext(ProfileContext);
  if (!value) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return value;
}
