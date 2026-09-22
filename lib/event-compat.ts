/**
 * Phase 5.3 read/write compatibility for categories, price, and place fields.
 */

import {
  EVENT_CATEGORIES,
  type Event,
  type EventCategory,
} from '@/types/event';

const CATEGORY_SET = new Set<string>(EVENT_CATEGORIES);

/** Legacy / alias labels → fixed set. Unknown → Other. */
const CATEGORY_ALIASES: Record<string, EventCategory> = {
  fashion: 'Fashion',
  crafts: 'Crafts',
  craft: 'Crafts',
  music: 'Music',
  wellness: 'Wellness',
  outdoors: 'Outdoors',
  outdoor: 'Outdoors',
  games: 'Games',
  game: 'Games',
  play: 'Games',
  food: 'Food',
  history: 'History',
  other: 'Other',
  books: 'Other',
  book: 'Other',
  sports: 'Outdoors',
  sport: 'Outdoors',
  fitness: 'Wellness',
  yoga: 'Wellness',
  art: 'Crafts',
  arts: 'Crafts',
  concert: 'Music',
  cooking: 'Food',
};

export type ParsedPrice = {
  label: string;
  is_free: boolean;
  price_amount: number | null;
  price_currency: string;
};

/** Map free-text / legacy category to the fixed nine (canonical casing). */
export function normalizeCategory(raw: string): EventCategory {
  const trimmed = raw.trim();
  if (!trimmed) {
    return 'Other';
  }
  if (CATEGORY_SET.has(trimmed)) {
    return trimmed as EventCategory;
  }
  const alias = CATEGORY_ALIASES[trimmed.toLowerCase()];
  return alias ?? 'Other';
}

/** Display category for UI — normalizes legacy values even before SQL backfill. */
export function displayCategory(event: Pick<Event, 'category'>): EventCategory {
  return normalizeCategory(event.category);
}

/**
 * Parse a free-text price label into structured fields.
 * Keeps a sensible display label; does not invent currency beyond USD default.
 */
export function parsePriceLabel(
  raw: string,
  currency: string = 'USD'
): ParsedPrice {
  const trimmed = raw.trim();
  if (
    !trimmed ||
    ['free', 'gratis', '0', '$0', '$0.00'].includes(trimmed.toLowerCase())
  ) {
    return {
      label: trimmed && trimmed.toLowerCase() !== '0' ? trimmed : 'Free',
      is_free: true,
      price_amount: null,
      price_currency: currency,
    };
  }

  const numeric = trimmed.replace(/[^0-9.]/g, '');
  if (/^[0-9]+(\.[0-9]+)?$/.test(numeric)) {
    const amount = Number(numeric);
    if (Number.isFinite(amount) && amount === 0) {
      return {
        label: 'Free',
        is_free: true,
        price_amount: null,
        price_currency: currency,
      };
    }
    if (Number.isFinite(amount) && amount > 0) {
      return {
        label: trimmed,
        is_free: false,
        price_amount: amount,
        price_currency: currency,
      };
    }
  }

  return {
    label: trimmed,
    is_free: false,
    price_amount: null,
    price_currency: currency,
  };
}

/** Prefer structured `is_free`; fall back to price_label for pre-backfill rows. */
export function isEventFree(
  event: Pick<Event, 'is_free' | 'price_label'>
): boolean {
  if (typeof event.is_free === 'boolean') {
    return event.is_free;
  }
  return parsePriceLabel(event.price_label).is_free;
}

/** Display price string — prefers price_label, then structured amount. */
export function formatEventPrice(
  event: Pick<Event, 'price_label' | 'is_free' | 'price_amount' | 'price_currency'>
): string {
  const label = event.price_label?.trim();
  if (label) {
    return label;
  }
  if (isEventFree(event)) {
    return 'Free';
  }
  if (event.price_amount != null && Number.isFinite(event.price_amount)) {
    const currency = event.price_currency?.trim() || 'USD';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
      }).format(event.price_amount);
    } catch {
      return `${currency} ${event.price_amount}`;
    }
  }
  return 'See details';
}

/** Null-safe place line for cards / share (empty when both missing). */
export function formatEventPlace(
  event: Pick<Event, 'venue_name' | 'address'>,
  separator: string = ', '
): string | null {
  const parts = [event.venue_name, event.address]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(separator) : null;
}

/** Map callout / fallback when venue is null — prefer address, else category. */
export function formatEventPlaceOrFallback(
  event: Pick<Event, 'venue_name' | 'address' | 'category'>
): string {
  return (
    formatEventPlace(event) ??
    displayCategory(event) ??
    'Location on map'
  );
}
