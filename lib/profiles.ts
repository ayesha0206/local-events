import type { Profile } from '@/types/profile';
import { supabase } from '@/lib/supabase';

export const PROFILE_SELECT =
  'id, display_name, avatar_url, username, is_organizer, trust_level, created_at';

export async function fetchProfile(userId: string): Promise<{
  profile: Profile | null;
  error: string | null;
}> {
  if (!supabase) {
    return { profile: null, error: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data as Profile | null, error: null };
}

/** Creates a profile row if the auth trigger did not run yet. */
export async function ensureProfile(
  userId: string,
  fallbackDisplayName: string
): Promise<{ profile: Profile | null; error: string | null }> {
  const existing = await fetchProfile(userId);
  if (existing.error) {
    return existing;
  }
  if (existing.profile) {
    return existing;
  }

  if (!supabase) {
    return { profile: null, error: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      display_name: fallbackDisplayName,
      is_organizer: false,
    })
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data as Profile, error: null };
}

export async function setOrganizerFlag(
  userId: string,
  isOrganizer: boolean
): Promise<{ profile: Profile | null; error: string | null }> {
  if (!supabase) {
    return { profile: null, error: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ is_organizer: isOrganizer })
    .eq('id', userId)
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data as Profile, error: null };
}

export function canCreateEvents(profile: Profile | null | undefined): boolean {
  return Boolean(profile?.is_organizer);
}
