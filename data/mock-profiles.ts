import type { Profile } from '@/types/profile';

/** Local fixtures — no live database. */
export const MOCK_PROFILES: Profile[] = [
  {
    id: 'profile-organizer-1',
    display_name: 'Ayesha',
    avatar_url: null,
    username: null,
    is_organizer: true,
    trust_level: 'trusted',
    created_at: '2026-01-10T12:00:00.000Z',
  },
  {
    id: 'profile-attendee-1',
    display_name: 'Sam',
    avatar_url: null,
    username: null,
    is_organizer: false,
    trust_level: 'new',
    created_at: '2026-02-01T09:00:00.000Z',
  },
];

export const MOCK_ORGANIZER = MOCK_PROFILES[0];
export const MOCK_ATTENDEE = MOCK_PROFILES[1];
