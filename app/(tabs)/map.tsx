import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import { MOCK_EVENTS } from '@/data/mock-events';
import { loadDiscoverEvents } from '@/lib/discover-events';
import { formatEventPlaceOrFallback } from '@/lib/event-compat';
import {
  requestForegroundLocationPermission,
  type Coords,
  type ForegroundPermissionResult,
} from '@/lib/location';
import type { Event } from '@/types/event';

const DEFAULT_DELTA = {
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function regionFor(coords: Coords | null, events: Event[]): Region {
  if (coords) {
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      ...DEFAULT_DELTA,
    };
  }

  const first = events[0] ?? MOCK_EVENTS[0];
  return {
    latitude: first.lat,
    longitude: first.lng,
    ...DEFAULT_DELTA,
  };
}

export default function MapScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [permission, setPermission] = useState<ForegroundPermissionResult | null>(
    null
  );
  const [statusMessage, setStatusMessage] = useState('Loading map…');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMap = useCallback(async (requestPermissionIfNeeded = false) => {
    setLoading(true);
    const result = await loadDiscoverEvents({ requestPermissionIfNeeded });
    setEvents(result.events);
    setCoords(result.coords);
    setPermission(result.permission);
    setStatusMessage(result.statusMessage);
    setError(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadMap(false);
  }, [loadMap]);

  const region = useMemo(() => regionFor(coords, events), [coords, events]);

  const showRequest =
    permission !== null && !permission.granted && permission.canAskAgain;

  async function onEnableLocation() {
    setLoading(true);
    await requestForegroundLocationPermission();
    await loadMap(true);
  }

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.header}>Map</Text>
          <Text style={styles.status}>
            Map pins require iOS Simulator or a device. Use the Discover list on
            web.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.header}>Map</Text>
        <Text style={styles.subheader}>Tap a pin for event details</Text>
        <Text style={[styles.status, error ? styles.statusError : null]}>
          {statusMessage}
        </Text>
        {showRequest ? (
          <Pressable
            accessibilityRole="button"
            disabled={loading}
            onPress={() => void onEnableLocation()}
            style={({ pressed }) => [
              styles.permissionButton,
              (pressed || loading) && styles.permissionButtonPressed,
            ]}
          >
            <Text style={styles.permissionButtonText}>
              {loading ? 'Requesting…' : 'Enable location'}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.mapWrap}>
          {loading && events.length === 0 ? (
            <View style={styles.loading}>
              <ActivityIndicator color={Palette.accent} size="large" />
            </View>
          ) : (
            <>
              <MapView
                key={
                  coords
                    ? `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`
                    : `events-${events.length}`
                }
                style={styles.map}
                initialRegion={region}
                showsUserLocation={Boolean(permission?.granted)}
                showsMyLocationButton={false}
              >
                {events.map((event) => (
                  <Marker
                    key={event.id}
                    coordinate={{ latitude: event.lat, longitude: event.lng }}
                    title={event.title}
                    description={formatEventPlaceOrFallback(event)}
                    pinColor={Palette.accent}
                    onPress={() => router.push(`/event/${event.id}`)}
                  />
                ))}
              </MapView>
              {!loading && events.length === 0 ? (
                <View style={styles.emptyOverlay} pointerEvents="box-none">
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No pins nearby</Text>
                    <Text style={styles.emptyBody}>
                      {error
                        ? 'Live listings failed to load. Try again, or check your connection.'
                        : 'No published events in range yet. Pull Discover to refresh after publishing.'}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void loadMap(false)}
                      style={({ pressed }) => [
                        styles.retryButton,
                        pressed && styles.permissionButtonPressed,
                      ]}
                    >
                      <Text style={styles.retryButtonText}>Try again</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.screenX,
    paddingTop:
      Platform.OS === 'android' ? Spacing.screenTopAndroid : Spacing.screenTopIos,
  },
  header: {
    ...Typography.header,
    color: Palette.title,
  },
  subheader: {
    ...Typography.subheader,
    marginTop: Spacing.headerGap,
    color: Palette.subheader,
  },
  status: {
    ...Typography.body,
    marginTop: Spacing.metaGap,
    marginBottom: Spacing.metaGap,
    color: Palette.ink,
  },
  statusError: {
    color: Palette.destructive,
  },
  permissionButton: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accent,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
    borderRadius: Radii.pill,
    marginBottom: Spacing.metaGap,
  },
  permissionButtonPressed: {
    opacity: 0.85,
  },
  permissionButtonText: {
    ...Typography.pill,
    color: Palette.onAccent,
  },
  mapWrap: {
    flex: 1,
    borderRadius: Radii.card,
    overflow: 'hidden',
    marginBottom: Spacing.listBottom,
    backgroundColor: Palette.card,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: Spacing.cardBody,
  },
  emptyCard: {
    backgroundColor: Palette.card,
    borderRadius: Radii.card,
    padding: Spacing.cardBody,
    gap: Spacing.metaGap,
  },
  emptyTitle: {
    ...Typography.subheader,
    color: Palette.title,
    fontWeight: '700',
  },
  emptyBody: {
    ...Typography.body,
    color: Palette.ink,
    lineHeight: 22,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: Spacing.metaGap,
    backgroundColor: Palette.accent,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
    borderRadius: Radii.pill,
  },
  retryButtonText: {
    ...Typography.pill,
    color: Palette.onAccent,
  },
});
