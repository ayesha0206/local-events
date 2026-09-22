/**
 * Display helpers for event fields (timezone-aware when an IANA zone is set).
 */

import type { EventStatus } from '@/types/event';

const WHEN_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

/**
 * Format an event instant using the event's IANA `timezone` when provided.
 * Falls back to the device locale/zone if timezone is missing or invalid.
 */
export function formatEventWhen(
  startsAt: string,
  timezone?: string | null
): string {
  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return startsAt;
  }

  const tz = timezone?.trim();
  if (tz) {
    try {
      return date.toLocaleString(undefined, {
        ...WHEN_OPTIONS,
        timeZone: tz,
        timeZoneName: 'short',
      });
    } catch {
      // Invalid IANA zone — fall through to device-local formatting.
    }
  }

  return date.toLocaleString(undefined, WHEN_OPTIONS);
}

import { parsePriceLabel } from '@/lib/event-compat';

/** @deprecated Prefer `isEventFree` from `@/lib/event-compat` (uses structured `is_free`). */
export function isFreePriceLabel(priceLabel: string): boolean {
  return parsePriceLabel(priceLabel).is_free;
}

export function formatEventStatus(status: EventStatus): string {
  if (status === 'draft') return 'Draft';
  if (status === 'published') return 'Published';
  return 'Cancelled';
}
