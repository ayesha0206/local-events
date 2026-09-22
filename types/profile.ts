/** Organizer trust tier for Phase 6.3 review / auto-approve policy. */
export type TrustLevel = 'new' | 'trusted' | 'restricted';

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  /** Nullable until username picker (7.2). Unique when set. */
  username: string | null;
  is_organizer: boolean;
  trust_level: TrustLevel;
  created_at: string;
};
