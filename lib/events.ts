import { MOCK_EVENTS } from '@/data/mock-events';
import { boundingBox, distanceKm } from '@/lib/geo';
import type { Coords } from '@/lib/location';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/types/event';

/** Default discovery radius for the list / map (km). */
export const DEFAULT_NEARBY_RADIUS_KM = 50;

export const EVENT_SELECT =
  'id, organizer_id, title, description, category, price_label, event_kind, organizer_url, is_free, price_amount, price_currency, starts_at, ends_at, timezone, venue_name, address, lat, lng, status, cover_image_url, is_hidden, pending_review, moderation_outcome, moderation_reason, auto_approve_at, created_at, updated_at';

export type NearbyEventsResult = {
  events: Event[];
  source: 'live' | 'unavailable';
  error: string | null;
};

/** Discovery end instant: `ends_at` when set, otherwise `starts_at`. */
export function eventDiscoveryEndAt(
  event: Pick<Event, 'starts_at' | 'ends_at'>
): string {
  return event.ends_at ?? event.starts_at;
}

/** True when the event is already over for discovery purposes. */
export function isEventPast(
  event: Pick<Event, 'starts_at' | 'ends_at'>,
  now: Date = new Date()
): boolean {
  const end = new Date(eventDiscoveryEndAt(event));
  if (Number.isNaN(end.getTime())) {
    return false;
  }
  return end.getTime() <= now.getTime();
}

/**
 * Fetches published, visible, not-yet-over events near `coords` from Supabase.
 * Uses a lat/lng bounding-box query then Haversine filter/sort.
 * Returns `source: 'unavailable'` when env is missing (caller may fall back to mocks).
 */
export async function fetchNearbyPublishedEvents(
  coords: Coords,
  radiusKm: number = DEFAULT_NEARBY_RADIUS_KM
): Promise<NearbyEventsResult> {
  if (!supabase) {
    return {
      events: [],
      source: 'unavailable',
      error: 'Supabase is not configured.',
    };
  }

  const box = boundingBox(coords, radiusKm);
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('status', 'published')
    .eq('is_hidden', false)
    .gte('lat', box.minLat)
    .lte('lat', box.maxLat)
    .gte('lng', box.minLng)
    .lte('lng', box.maxLng)
    // Still upcoming/ongoing: ends_at > now, or starts_at > now when ends_at is null.
    .or(
      `and(ends_at.not.is.null,ends_at.gt."${nowIso}"),and(ends_at.is.null,starts_at.gt."${nowIso}")`
    )
    .order('starts_at', { ascending: true })
    .limit(100);

  if (error) {
    return { events: [], source: 'live', error: error.message };
  }

  const rows = (data ?? []) as Event[];
  const withDistance = rows
    .map((event) => ({
      event,
      km: distanceKm(coords, { latitude: event.lat, longitude: event.lng }),
    }))
    .filter((row) => row.km <= radiusKm && !isEventPast(row.event))
    .sort((a, b) => a.km - b.km || a.event.starts_at.localeCompare(b.event.starts_at));

  return {
    events: withDistance.map((row) => row.event),
    source: 'live',
    error: null,
  };
}

/**
 * Resolve a single event for detail: mock fixtures first, then Supabase when configured.
 */
export async function fetchEventById(id: string): Promise<{
  event: Event | null;
  error: string | null;
}> {
  const mock = MOCK_EVENTS.find((item) => item.id === id);
  if (mock) {
    return { event: mock, error: null };
  }

  if (!supabase) {
    return { event: null, error: 'Event not found.' };
  }

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', id)
    .eq('status', 'published')
    .eq('is_hidden', false)
    .maybeSingle();

  if (error) {
    return { event: null, error: error.message };
  }

  return { event: (data as Event | null) ?? null, error: data ? null : 'Event not found.' };
}
