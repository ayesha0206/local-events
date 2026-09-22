import { normalizeCategory, parsePriceLabel } from '@/lib/event-compat';
import { EVENT_SELECT } from '@/lib/events';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/types/event';

/** Default map center until GPS/boot fills the pin (Karachi). */
export const DRAFT_PLACEHOLDER_COORDS = {
  lat: 24.8607,
  lng: 67.0011,
} as const;

export type CreateDraftEventInput = {
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

export type CreateDraftEventResult = {
  event: Event | null;
  error: string | null;
};

export function validateDraftEventInput(
  input: Omit<CreateDraftEventInput, 'organizerId'>
): string | null {
  if (!input.title.trim()) {
    return 'Title is required.';
  }
  if (!input.category.trim()) {
    return 'Category is required.';
  }
  if (Number.isNaN(input.startsAt.getTime())) {
    return 'Start time is invalid.';
  }
  if (input.endsAt && input.endsAt.getTime() < input.startsAt.getTime()) {
    return 'End time must be after start time.';
  }
  if (
    typeof input.lat !== 'number' ||
    typeof input.lng !== 'number' ||
    Number.isNaN(input.lat) ||
    Number.isNaN(input.lng) ||
    input.lat < -90 ||
    input.lat > 90 ||
    input.lng < -180 ||
    input.lng > 180
  ) {
    return 'Set a map pin for the event location.';
  }
  if (!input.coverImageUrl.trim()) {
    return 'A cover image is required.';
  }
  return null;
}

/**
 * Inserts a draft event for an organizer. Cover URL must already be uploaded.
 */
export async function createDraftEvent(
  input: CreateDraftEventInput
): Promise<CreateDraftEventResult> {
  if (!supabase) {
    return {
      event: null,
      error: 'Supabase is not configured. Add keys to .env to save drafts.',
    };
  }

  const validationError = validateDraftEventInput(input);
  if (validationError) {
    return { event: null, error: validationError };
  }

  const price = parsePriceLabel(input.priceLabel.trim() || 'Free');

  const { data, error } = await supabase
    .from('events')
    .insert({
      organizer_id: input.organizerId,
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
      status: 'draft',
      cover_image_url: input.coverImageUrl.trim(),
      is_hidden: false,
    })
    .select(EVENT_SELECT)
    .single();

  if (error) {
    return { event: null, error: error.message };
  }

  return { event: data as Event, error: null };
}
