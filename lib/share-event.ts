import { Share } from 'react-native';

import { eventShareUrl } from '@/lib/deep-links';
import { formatEventPlace, formatEventPrice } from '@/lib/event-compat';
import { formatEventWhen } from '@/lib/format-event';
import type { Event } from '@/types/event';

export { eventShareUrl } from '@/lib/deep-links';

export function buildEventShareMessage(event: Event): string {
  const when = formatEventWhen(event.starts_at, event.timezone);
  const place = formatEventPlace(event);
  const lines = [
    event.title,
    `${when} · ${formatEventPrice(event)}`,
    place || null,
    eventShareUrl(event.id),
  ].filter(Boolean);

  return lines.join('\n');
}

export async function shareEvent(event: Event): Promise<{ error: string | null }> {
  try {
    await Share.share({
      title: event.title,
      message: buildEventShareMessage(event),
      url: eventShareUrl(event.id),
    });
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not open share sheet.';
    return { error: message };
  }
}
