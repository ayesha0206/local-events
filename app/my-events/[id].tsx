import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditEventForm } from '@/components/events/EditEventForm';
import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';
import { fetchOwnedEventById } from '@/lib/organizer-events';
import type { Event } from '@/types/event';

export default function EditMyEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { canCreate, isLoading: profileLoading } = useProfile();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing event id.');
      setLoading(false);
      return;
    }
    if (!user) {
      setError('Sign in to edit this event.');
      setLoading(false);
      return;
    }

    setLoading(true);
    const result = await fetchOwnedEventById(id, user.id);
    setEvent(result.event);
    setError(result.error);
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = event?.title ?? 'Edit event';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title,
          headerBackTitle: 'Back',
        }}
      />
      <StatusBar style="dark" />

      {loading || profileLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Palette.accent} size="large" />
        </View>
      ) : !user || !canCreate ? (
        <View style={styles.centered}>
          <Text style={styles.error}>
            Organizer access is required to edit events.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/profile')}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>Go to Profile</Text>
          </Pressable>
        </View>
      ) : error || !event ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error ?? 'Event not found.'}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <EditEventForm
            event={event}
            organizerId={user.id}
            onUpdated={setEvent}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.screenX,
    gap: Spacing.metaGap,
  },
  content: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.headerGap,
    paddingBottom: Spacing.listBottom,
  },
  error: {
    ...Typography.body,
    color: Palette.destructive,
    textAlign: 'center',
  },
  button: {
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
