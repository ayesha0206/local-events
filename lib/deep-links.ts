import * as Linking from 'expo-linking';

/** Expo Router href for an event detail screen. */
export function eventDeepLinkPath(eventId: string): string {
  return `/event/${eventId}`;
}

/**
 * Canonical share URL using the `localevents` scheme from app.json.
 * Works with development builds / production; see docs/deep-links.md for Expo Go tests.
 */
export function eventShareUrl(eventId: string): string {
  return Linking.createURL(eventDeepLinkPath(eventId), {
    scheme: 'localevents',
  });
}

/**
 * Runtime deep link for the current environment (Expo Go → exp://…/--/event/:id).
 * Useful for Simulator testing without a custom-scheme native binary.
 */
export function eventDevLinkUrl(eventId: string): string {
  return Linking.createURL(eventDeepLinkPath(eventId));
}

/**
 * Normalize an incoming system path/URL to an Expo Router href.
 * Handles:
 * - `/event/:id`
 * - `localevents://event/:id` (hostname = event)
 * - `localevents:///event/:id`
 * - Expo Go `…/--/event/:id`
 */
export function resolveDeepLinkPath(raw: string): string {
  try {
    const trimmed = raw.trim();
    if (!trimmed) {
      return '/';
    }

    if (trimmed.includes('/--/')) {
      const after = trimmed.slice(trimmed.indexOf('/--/') + 4);
      return resolveDeepLinkPath(after.startsWith('/') ? after : `/${after}`);
    }

    if (trimmed.includes('://')) {
      return pathFromAbsoluteUrl(trimmed);
    }

    if (trimmed.startsWith('/')) {
      return normalizeRouterPath(trimmed);
    }

    if (trimmed.startsWith('event/')) {
      return normalizeRouterPath(`/${trimmed}`);
    }

    return normalizeRouterPath(`/${trimmed}`);
  } catch {
    return '/';
  }
}

function normalizeRouterPath(path: string): string {
  const qIndex = path.indexOf('?');
  const pathname = qIndex >= 0 ? path.slice(0, qIndex) : path;
  const search = qIndex >= 0 ? path.slice(qIndex) : '';
  const clean = pathname.replace(/\/+$/, '') || '/';

  const match = clean.match(/^\/event\/([^/]+)$/);
  if (match?.[1]) {
    return `/event/${decodeURIComponent(match[1])}${search}`;
  }

  return `${clean}${search}`;
}

function pathFromAbsoluteUrl(urlString: string): string {
  const url = new URL(urlString);

  // localevents://event/<id> → hostname "event", path "/<id>" or "<id>"
  if (url.hostname === 'event') {
    const id = url.pathname.replace(/^\//, '');
    if (id) {
      return `/event/${decodeURIComponent(id)}${url.search}`;
    }
  }

  if (url.pathname.includes('/--/')) {
    const after = url.pathname.split('/--/')[1] ?? '';
    return normalizeRouterPath(`/${after}${url.search}`);
  }

  const pathname = url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;
  return normalizeRouterPath(`${pathname}${url.search}`);
}
