import type { Coords } from '@/lib/location';

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometers (Haversine). */
export function distanceKm(a: Coords, b: Coords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Approximate lat/lng bounding box for a radius (pre-filter before Haversine). */
export function boundingBox(
  center: Coords,
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDelta = radiusKm / 111;
  const cosLat = Math.cos((center.latitude * Math.PI) / 180);
  const lngDelta = radiusKm / (111 * Math.max(0.01, Math.abs(cosLat)));

  return {
    minLat: Math.max(-90, center.latitude - latDelta),
    maxLat: Math.min(90, center.latitude + latDelta),
    minLng: Math.max(-180, center.longitude - lngDelta),
    maxLng: Math.min(180, center.longitude + lngDelta),
  };
}
