import { resolveDeepLinkPath } from '@/lib/deep-links';

/**
 * Rewrite incoming native URLs (cold start + while open) before Expo Router navigates.
 * @see https://docs.expo.dev/router/advanced/native-intent/
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    return resolveDeepLinkPath(path);
  } catch {
    return '/';
  }
}
