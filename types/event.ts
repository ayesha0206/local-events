export type EventStatus = 'draft' | 'published' | 'cancelled';

/** Classification flag only — no recurrence rules or generated instances. */
export type EventKind = 'permanent' | 'pop_up';

/** Fixed category set (create dropdown in 9.2). */
export const EVENT_CATEGORIES = [
  'Fashion',
  'Crafts',
  'Music',
  'Wellness',
  'Outdoors',
  'Games',
  'Food',
  'History',
  'Other',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/** Screening outcome from Phase 6; null until screened. */
export type ModerationOutcome = 'allow' | 'flag' | 'block';

/** Matches the planned Supabase `events` row shape (v1 + Phase 5). */
export type Event = {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  /** Fixed set after 5.3; client still normalizes legacy aliases on read. */
  category: string;
  /** Display string; prefer `is_free` / `price_amount` when present. */
  price_label: string;
  event_kind: EventKind;
  organizer_url: string | null;
  is_free: boolean;
  price_amount: number | null;
  price_currency: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  venue_name: string | null;
  address: string | null;
  lat: number;
  lng: number;
  status: EventStatus;
  cover_image_url: string;
  is_hidden: boolean;
  pending_review: boolean;
  moderation_outcome: ModerationOutcome | null;
  moderation_reason: string | null;
  auto_approve_at: string | null;
  created_at: string;
  updated_at: string;
};
