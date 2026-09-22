import {
  displayCategory,
  isEventFree,
} from '@/lib/event-compat';
import { EVENT_CATEGORIES, type Event } from '@/types/event';

export type DiscoverFilters = {
  category: string | null;
  freeOnly: boolean;
};

export const EMPTY_DISCOVER_FILTERS: DiscoverFilters = {
  category: null,
  freeOnly: false,
};

/** Unique normalized categories present in the list (fixed-set order, then extras). */
export function uniqueCategories(events: Event[]): string[] {
  const set = new Set<string>();
  for (const event of events) {
    set.add(displayCategory(event));
  }
  const ordered = EVENT_CATEGORIES.filter((category) => set.has(category));
  const extras = Array.from(set)
    .filter((category) => !EVENT_CATEGORIES.includes(category as (typeof EVENT_CATEGORIES)[number]))
    .sort((a, b) => a.localeCompare(b));
  return [...ordered, ...extras];
}

export function applyDiscoverFilters(
  events: Event[],
  filters: DiscoverFilters
): Event[] {
  return events.filter((event) => {
    if (filters.category && displayCategory(event) !== filters.category) {
      return false;
    }
    if (filters.freeOnly && !isEventFree(event)) {
      return false;
    }
    return true;
  });
}
