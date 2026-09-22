import * as Location from 'expo-location';

export type Coords = {
  latitude: number;
  longitude: number;
};

export type ForegroundPermissionResult = {
  granted: boolean;
  status: Location.PermissionStatus;
  canAskAgain: boolean;
};

/**
 * Check current foreground location permission (does not prompt).
 */
export async function getForegroundLocationPermission(): Promise<ForegroundPermissionResult> {
  const result = await Location.getForegroundPermissionsAsync();
  return {
    granted: result.granted,
    status: result.status,
    canAskAgain: result.canAskAgain,
  };
}

/**
 * Request foreground ("when in use") location permission.
 * No background location in v1 foundation.
 */
export async function requestForegroundLocationPermission(): Promise<ForegroundPermissionResult> {
  const result = await Location.requestForegroundPermissionsAsync();
  return {
    granted: result.granted,
    status: result.status,
    canAskAgain: result.canAskAgain,
  };
}

/**
 * Returns current coords if permission is already granted; otherwise null.
 * Does not prompt — call requestForegroundLocationPermission first when needed.
 */
export async function getCurrentCoordsIfAllowed(): Promise<Coords | null> {
  const permission = await getForegroundLocationPermission();
  if (!permission.granted) {
    return null;
  }

  try {
    return await readCurrentCoords();
  } catch {
    return null;
  }
}

/**
 * Request foreground permission if needed, then return current coords.
 * Returns null when permission is denied or position cannot be read.
 */
export async function ensureCurrentCoords(): Promise<{
  coords: Coords | null;
  permission: ForegroundPermissionResult;
}> {
  let permission = await getForegroundLocationPermission();
  if (!permission.granted && permission.canAskAgain) {
    permission = await requestForegroundLocationPermission();
  }

  if (!permission.granted) {
    return { coords: null, permission };
  }

  try {
    const coords = await readCurrentCoords();
    return { coords, permission };
  } catch {
    return { coords: null, permission };
  }
}

async function readCurrentCoords(): Promise<Coords> {
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

/** Format expo-location reverse-geocode result into a single address line. */
export function formatGeocodedAddress(
  place: Location.LocationGeocodedAddress
): string {
  const parts = [
    place.name,
    place.streetNumber && place.street
      ? `${place.streetNumber} ${place.street}`
      : place.street,
    place.district,
    place.city,
    place.region,
    place.postalCode,
    place.country,
  ].filter((part, index, all) => {
    if (!part) {
      return false;
    }
    // Drop duplicates (e.g. name matching street)
    return all.indexOf(part) === index;
  });

  return parts.join(', ');
}

/**
 * Reverse-geocode coords to an address string.
 * Returns null when lookup fails or yields nothing useful.
 */
export async function reverseGeocodeCoords(
  coords: Coords
): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    const first = results[0];
    if (!first) {
      return null;
    }
    const formatted = formatGeocodedAddress(first);
    return formatted || null;
  } catch {
    return null;
  }
}
