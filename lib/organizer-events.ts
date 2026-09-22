import { validateDraftEventInput } from '@/lib/create-event';
import { normalizeCategory, parsePriceLabel } from '@/lib/event-compat';
import { EVENT_SELECT } from '@/lib/events';
import { supabase } from '@/lib/supabase';
import type { Event, EventStatus } from '@/types/event';

export type OrganizerEventsResult = {
  events: Event[];
  error: string | null;
};

export type OrganizerEventMutationResult = {
  event: Event | null;
  error: string | null;
};

export type UpdateOwnedEventInput = {
  eventId: string;
  organizerId: string;
  title: string;
  description: string;
  category: string;
  priceLabel: string;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  venueName: string;
  address: string;
  lat: number;
  lng: number;
  coverImageUrl: string;
};

/**
 * Lists all events owned by the signed-in organizer (draft / published / cancelled).
 */
export async function fetchMyEvents(
  organizerId: string
): Promise<OrganizerEventsResult> {
  if (!supabase) {
    return {
      events: [],
      error: 'Supabase is not configured. Add keys to .env to load your events.',
    };
  }

  if (!organizerId.trim()) {
    return { events: [], error: 'You must be signed in.' };
  }

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('organizer_id', organizerId)
    .order('starts_at', { ascending: false });

  if (error) {
    return { events: [], error: error.message };
  }

  return { events: (data ?? []) as Event[], error: null };
}

/**
 * Owner-only fetch (drafts / cancelled / hidden included via RLS).
 */
export async function fetchOwnedEventById(
  eventId: string,
  organizerId: string
): Promise<OrganizerEventMutationResult> {
  if (!supabase) {
    return {
      event: null,
      error: 'Supabase is not configured. Add keys to .env to load this event.',
    };
  }

  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', eventId)
    .eq('organizer_id', organizerId)
    .maybeSingle();

  if (error) {
    return { event: null, error: error.message };
  }

  if (!data) {
    return { event: null, error: 'Event not found.' };
  }

  return { event: data as Event, error: null };
}

export async function updateOwnedEvent(
  input: UpdateOwnedEventInput
): Promise<OrganizerEventMutationResult> {
  if (!supabase) {
    return {
      event: null,
      error: 'Supabase is not configured. Add keys to .env to save changes.',
    };
  }

  const validationError = validateDraftEventInput({
    title: input.title,
    description: input.description,
    category: input.category,
    priceLabel: input.priceLabel,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    timezone: input.timezone,
    venueName: input.venueName,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    coverImageUrl: input.coverImageUrl,
  });
  if (validationError) {
    return { event: null, error: validationError };
  }

  const price = parsePriceLabel(input.priceLabel.trim() || 'Free');

  const { data, error } = await supabase
    .from('events')
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      category: normalizeCategory(input.category),
      price_label: price.label,
      is_free: price.is_free,
      price_amount: price.price_amount,
      price_currency: price.price_currency,
      starts_at: input.startsAt.toISOString(),
      ends_at: input.endsAt ? input.endsAt.toISOString() : null,
      timezone: input.timezone.trim() || 'UTC',
      venue_name: input.venueName.trim() || null,
      address: input.address.trim() || null,
      lat: input.lat,
      lng: input.lng,
      cover_image_url: input.coverImageUrl.trim(),
    })
    .eq('id', input.eventId)
    .eq('organizer_id', input.organizerId)
    .select(EVENT_SELECT)
    .maybeSingle();

  if (error) {
    return { event: null, error: error.message };
  }

  if (!data) {
    return { event: null, error: 'Event not found or you cannot edit it.' };
  }

  return { event: data as Event, error: null };
}

async function setOwnedEventStatus(
  eventId: string,
  organizerId: string,
  status: EventStatus
): Promise<OrganizerEventMutationResult> {
  if (!supabase) {
    return {
      event: null,
      error: 'Supabase is not configured. Add keys to .env to update status.',
    };
  }

  const { data, error } = await supabase
    .from('events')
    .update({ status })
    .eq('id', eventId)
    .eq('organizer_id', organizerId)
    .select(EVENT_SELECT)
    .maybeSingle();

  if (error) {
    return { event: null, error: error.message };
  }

  if (!data) {
    return { event: null, error: 'Event not found or you cannot update it.' };
  }

  return { event: data as Event, error: null };
}

/** Draft → published. Caller should persist field edits first when needed. */
export async function publishOwnedEvent(
  eventId: string,
  organizerId: string
): Promise<OrganizerEventMutationResult> {
  if (!supabase) {
    return {
      event: null,
      error: 'Supabase is not configured. Add keys to .env to publish.',
    };
  }

  const loaded = await fetchOwnedEventById(eventId, organizerId);
  if (loaded.error || !loaded.event) {
    return loaded;
  }

  if (loaded.event.status === 'published') {
    return { event: loaded.event, error: null };
  }

  if (loaded.event.status === 'cancelled') {
    return {
      event: loaded.event,
      error: 'Cancelled events cannot be published.',
    };
  }

  const validationError = validateDraftEventInput({
    title: loaded.event.title,
    description: loaded.event.description,
    category: loaded.event.category,
    priceLabel: loaded.event.price_label,
    startsAt: new Date(loaded.event.starts_at),
    endsAt: loaded.event.ends_at ? new Date(loaded.event.ends_at) : null,
    timezone: loaded.event.timezone,
    venueName: loaded.event.venue_name ?? '',
    address: loaded.event.address ?? '',
    lat: loaded.event.lat,
    lng: loaded.event.lng,
    coverImageUrl: loaded.event.cover_image_url,
  });
  if (validationError) {
    return { event: loaded.event, error: validationError };
  }

  return setOwnedEventStatus(eventId, organizerId, 'published');
}

export async function cancelOwnedEvent(
  eventId: string,
  organizerId: string
): Promise<OrganizerEventMutationResult> {
  if (!supabase) {
    return {
      event: null,
      error: 'Supabase is not configured. Add keys to .env to cancel.',
    };
  }

  const loaded = await fetchOwnedEventById(eventId, organizerId);
  if (loaded.error || !loaded.event) {
    return loaded;
  }

  if (loaded.event.status === 'cancelled') {
    return { event: loaded.event, error: null };
  }

  return setOwnedEventStatus(eventId, organizerId, 'cancelled');
}
