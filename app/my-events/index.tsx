import { StatusBar } from 'expo-status-bar';
import { Link, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MyEventRow } from '@/components/events/MyEventRow';
import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';
import { fetchMyEvents } from '@/lib/organizer-events';
import type { Event } from '@/types/event';

export default function MyEventsScreen() {
  const { user } = useAuth();
  const { canCreate, isLoading: profileLoading } = useProfile();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (!user) {
        setEvents([]);
        setError(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (mode === 'initial') {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const result = await fetchMyEvents(user.id);
      setEvents(result.events);
      setError(result.error);
      setLoading(false);
      setRefreshing(false);
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      void load('initial');
    }, [load])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'My Events',
          headerBackTitle: 'Back',
        }}
      />
      <StatusBar style="dark" />

      {!user ? (
        <View style={styles.centered}>
          <Text style={styles.body}>Sign in to manage your events.</Text>
          <Link href="/profile" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>Go to Profile</Text>
            </Pressable>
          </Link>
        </View>
      ) : profileLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Palette.accent} />
        </View>
      ) : !canCreate ? (
        <View style={styles.centered}>
          <Text style={styles.body}>
            Become an organizer to create and manage events.
          </Text>
          <Link href="/profile" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.buttonText}>Become an organizer</Text>
            </Pressable>
          </Link>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Palette.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MyEventRow item={item} />}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => void load('refresh')}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <Text style={styles.subheader}>
                Drafts, published, and cancelled events you own.
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Link href="/create" asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.buttonText}>Create event</Text>
                </Pressable>
              </Link>
            </View>
          }
          ListEmptyComponent={
            !error ? (
              <Text style={styles.empty}>No events yet. Create a draft to start.</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  list: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Platform.OS === 'android' ? Spacing.screenTopAndroid : 8,
    paddingBottom: Spacing.listBottom,
    flexGrow: 1,
  },
  headerBlock: {
    marginBottom: Spacing.sectionBottom,
    gap: Spacing.metaGap,
  },
  subheader: {
    ...Typography.subheader,
    color: Palette.subheader,
    lineHeight: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenX,
    gap: Spacing.metaGap,
  },
  body: {
    ...Typography.body,
    color: Palette.ink,
    lineHeight: 22,
  },
  empty: {
    ...Typography.body,
    color: Palette.ink,
    marginTop: Spacing.sectionBottom,
  },
  error: {
    ...Typography.body,
    color: Palette.destructive,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accent,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
  },
  buttonText: {
    ...Typography.pill,
    color: Palette.onAccent,
  },
  pressed: {
    opacity: 0.85,
  },
});
