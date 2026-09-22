import { PermissionStatus } from 'expo-location';

import { MOCK_EVENTS } from '@/data/mock-events';
import {
  DEFAULT_NEARBY_RADIUS_KM,
  fetchNearbyPublishedEvents,
  isEventPast,
} from '@/lib/events';
import {
  ensureCurrentCoords,
  getForegroundLocationPermission,
  type Coords,
  type ForegroundPermissionResult,
} from '@/lib/location';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/types/event';

export type DiscoverSource = 'live' | 'mock' | 'empty';

export type DiscoverEventsResult = {
  events: Event[];
  source: DiscoverSource;
  coords: Coords | null;
  permission: ForegroundPermissionResult;
  error: string | null;
  statusMessage: string;
};

function buildStatus(
  source: DiscoverSource,
  permission: ForegroundPermissionResult,
  coords: Coords | null,
  error: string | null,
  count: number
): string {
  if (error) {
    return error;
  }
  if (source === 'live') {
    return `Showing ${count} nearby event${count === 1 ? '' : 's'} (within ${DEFAULT_NEARBY_RADIUS_KM} km)`;
  }
  if (source === 'empty') {
    return `No published events within ${DEFAULT_NEARBY_RADIUS_KM} km yet.`;
  }
  if (!supabase) {
    return 'Sample events — add Supabase keys to .env for live nearby results.';
  }
  if (!permission.granted) {
    return 'Sample events — enable location to load nearby listings.';
  }
  if (!coords) {
    return 'Sample events — could not read your current location.';
  }
  return 'Sample events';
}

/**
 * Shared Discover/Map data load: user coords when allowed, live nearby when
 * Supabase is configured, otherwise mock or empty.
 */
export async function loadDiscoverEvents(options?: {
  requestPermissionIfNeeded?: boolean;
}): Promise<DiscoverEventsResult> {
  const requestPermissionIfNeeded = options?.requestPermissionIfNeeded ?? false;

  let permission: ForegroundPermissionResult;
  let coords: Coords | null = null;

  try {
    if (requestPermissionIfNeeded) {
      const ensured = await ensureCurrentCoords();
      permission = ensured.permission;
      coords = ensured.coords;
    } else {
      permission = await getForegroundLocationPermission();
      if (permission.granted) {
        const ensured = await ensureCurrentCoords();
        permission = ensured.permission;
        coords = ensured.coords;
      }
    }
  } catch {
    permission = {
      granted: false,
      status: PermissionStatus.UNDETERMINED,
      canAskAgain: true,
    };
    coords = null;
  }

  const upcomingMocks = MOCK_EVENTS.filter((event) => !isEventPast(event));

  if (!supabase || !coords) {
    return {
      events: upcomingMocks,
      source: 'mock',
      coords,
      permission,
      error: null,
      statusMessage: buildStatus(
        'mock',
        permission,
        coords,
        null,
        upcomingMocks.length
      ),
    };
  }

  const result = await fetchNearbyPublishedEvents(coords);

  if (result.source === 'unavailable' || result.error) {
    const error =
      result.error ?? 'Could not load nearby events. Showing sample events.';
    return {
      events: upcomingMocks,
      source: 'mock',
      coords,
      permission,
      error,
      statusMessage: buildStatus(
        'mock',
        permission,
        coords,
        error,
        upcomingMocks.length
      ),
    };
  }

  if (result.events.length === 0) {
    return {
      events: [],
      source: 'empty',
      coords,
      permission,
      error: null,
      statusMessage: buildStatus('empty', permission, coords, null, 0),
    };
  }

  return {
    events: result.events,
    source: 'live',
    coords,
    permission,
    error: null,
    statusMessage: buildStatus(
      'live',
      permission,
      coords,
      null,
      result.events.length
    ),
  };
}
