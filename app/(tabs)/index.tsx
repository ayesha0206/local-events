import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DiscoverFilterBar } from '@/components/events/DiscoverFilterBar';
import { EventCard } from '@/components/events/EventCard';
import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import { MOCK_EVENTS } from '@/data/mock-events';
import {
  loadDiscoverEvents,
  type DiscoverSource,
} from '@/lib/discover-events';
import {
  applyDiscoverFilters,
  EMPTY_DISCOVER_FILTERS,
  uniqueCategories,
  type DiscoverFilters,
} from '@/lib/discover-filters';
import {
  requestForegroundLocationPermission,
  type Coords,
  type ForegroundPermissionResult,
} from '@/lib/location';
import type { Event } from '@/types/event';

type DiscoverState = {
  events: Event[];
  source: DiscoverSource;
  statusMessage: string;
  error: string | null;
  coords: Coords | null;
  permission: ForegroundPermissionResult | null;
  loading: boolean;
  refreshing: boolean;
};

function permissionLabel(result: ForegroundPermissionResult | null): string {
  if (!result) {
    return 'Checking location…';
  }
  if (result.granted) {
    return 'Location: allowed';
  }
  if (!result.canAskAgain) {
    return 'Location: blocked — enable in Settings';
  }
  return 'Location: not allowed yet';
}

export default function DiscoverScreen() {
  const [state, setState] = useState<DiscoverState>({
    events: MOCK_EVENTS,
    source: 'mock',
    statusMessage: 'Loading nearby events…',
    error: null,
    coords: null,
    permission: null,
    loading: true,
    refreshing: false,
  });
  const [filters, setFilters] = useState<DiscoverFilters>(EMPTY_DISCOVER_FILTERS);

  const loadDiscover = useCallback(async (mode: 'initial' | 'refresh' | 'after-permission') => {
    setState((prev) => ({
      ...prev,
      loading: mode === 'initial',
      refreshing: mode === 'refresh',
    }));

    const result = await loadDiscoverEvents({
      requestPermissionIfNeeded: mode === 'after-permission',
    });

    setState({
      events: result.events,
      source: result.source,
      statusMessage: result.statusMessage,
      error: result.error,
      coords: result.coords,
      permission: result.permission,
      loading: false,
      refreshing: false,
    });
  }, []);

  useEffect(() => {
    void loadDiscover('initial');
  }, [loadDiscover]);

  async function onEnableLocation() {
    setState((prev) => ({ ...prev, loading: true }));
    const permission = await requestForegroundLocationPermission();
    setState((prev) => ({ ...prev, permission }));
    await loadDiscover('after-permission');
  }

  const categories = useMemo(
    () => uniqueCategories(state.events),
    [state.events]
  );

  const filteredEvents = useMemo(
    () => applyDiscoverFilters(state.events, filters),
    [state.events, filters]
  );

  const showRequest =
    state.permission !== null &&
    !state.permission.granted &&
    state.permission.canAskAgain;

  const emptyTitle =
    state.error && state.source === 'mock'
      ? 'Could not refresh live listings'
      : state.events.length === 0
        ? 'Nothing nearby yet'
        : 'No matches';

  const emptyBody =
    state.events.length === 0
      ? state.error
        ? `${state.error} Pull to try again, or check that published events exist near your Simulator location.`
        : 'Pull to refresh, or publish an event near your Simulator location.'
      : 'No events match these filters. Try All or turn off Free.';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.header}>Discover</Text>
        <Text style={styles.subheader}>Find what is happening nearby</Text>
        <Text style={styles.permission}>{permissionLabel(state.permission)}</Text>
        {showRequest ? (
          <Pressable
            accessibilityRole="button"
            disabled={state.loading}
            onPress={() => void onEnableLocation()}
            style={({ pressed }) => [
              styles.permissionButton,
              (pressed || state.loading) && styles.permissionButtonPressed,
            ]}
          >
            <Text style={styles.permissionButtonText}>
              {state.loading ? 'Requesting…' : 'Enable location'}
            </Text>
          </Pressable>
        ) : null}
        <Text style={[styles.status, state.error ? styles.statusError : null]}>
          {state.statusMessage}
        </Text>

        {!state.loading || state.refreshing ? (
          <DiscoverFilterBar
            categories={categories}
            filters={filters}
            onChange={setFilters}
          />
        ) : null}

        {state.loading && !state.refreshing ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Palette.accent} size="large" />
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <EventCard item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={state.refreshing}
                onRefresh={() => void loadDiscover('refresh')}
                tintColor={Palette.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>{emptyTitle}</Text>
                <Text style={styles.empty}>{emptyBody}</Text>
                {state.error || state.events.length === 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void loadDiscover('refresh')}
                    style={({ pressed }) => [
                      styles.retryButton,
                      pressed && styles.permissionButtonPressed,
                    ]}
                  >
                    <Text style={styles.retryButtonText}>Try again</Text>
                  </Pressable>
                ) : null}
              </View>
            }
          />
        )}
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
  permission: {
    ...Typography.body,
    marginTop: Spacing.headerGap,
    color: Palette.subheader,
  },
  permissionButton: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accent,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
    borderRadius: Radii.pill,
    marginTop: Spacing.metaGap,
  },
  permissionButtonPressed: {
    opacity: 0.85,
  },
  permissionButtonText: {
    ...Typography.pill,
    color: Palette.onAccent,
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: Spacing.listBottom,
    flexGrow: 1,
  },
  emptyWrap: {
    paddingTop: Spacing.sectionBottom,
    gap: Spacing.metaGap,
  },
  emptyTitle: {
    ...Typography.subheader,
    color: Palette.title,
    fontWeight: '700',
  },
  empty: {
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
