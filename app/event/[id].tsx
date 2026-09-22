import { Image } from 'expo-image';
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

import { Palette, Radii, Spacing, Typography, getPillColor } from '@/constants/theme';
import { ReportEventButton } from '@/components/events/ReportEventButton';
import {
  displayCategory,
  formatEventPlace,
  formatEventPrice,
  isEventFree,
} from '@/lib/event-compat';
import { fetchEventById } from '@/lib/events';
import { formatEventWhen } from '@/lib/format-event';
import { shareEvent } from '@/lib/share-event';
import type { Event } from '@/types/event';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!id) {
        setError('Missing event id.');
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await fetchEventById(id);
      if (!active) {
        return;
      }
      setEvent(result.event);
      setError(result.error);
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  const onShare = useCallback(async () => {
    if (!event || shareBusy) {
      return;
    }
    setShareBusy(true);
    setShareError(null);
    const result = await shareEvent(event);
    if (result.error) {
      setShareError(result.error);
    }
    setShareBusy(false);
  }, [event, shareBusy]);

  const title = event?.title ?? 'Event';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <Stack.Screen
        options={{
          title,
          headerBackTitle: 'Back',
          headerRight: event
            ? () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Share event"
                  disabled={shareBusy}
                  onPress={() => void onShare()}
                  hitSlop={12}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <Text style={styles.shareHeader}>
                    {shareBusy ? '…' : 'Share'}
                  </Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      <StatusBar style="dark" />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Palette.accent} size="large" />
        </View>
      ) : error || !event ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error ?? 'Event not found.'}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Image
            source={{ uri: event.cover_image_url }}
            style={styles.cover}
            contentFit="cover"
          />
          <Text style={styles.title}>{event.title}</Text>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.pill,
                { backgroundColor: getPillColor(displayCategory(event)) },
              ]}
            >
              <Text style={styles.pillText}>{displayCategory(event)}</Text>
            </View>
            <Text style={styles.meta}>
              {formatEventWhen(event.starts_at, event.timezone)}
            </Text>
            {isEventFree(event) ? (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>{formatEventPrice(event)}</Text>
              </View>
            ) : (
              <Text style={[styles.meta, styles.price]}>
                {formatEventPrice(event)}
              </Text>
            )}
          </View>
          {formatEventPlace(event, '\n') ? (
            <View style={styles.block}>
              <Text style={styles.label}>Where</Text>
              <Text style={styles.venue}>{formatEventPlace(event, '\n')}</Text>
            </View>
          ) : (
            <View style={styles.block}>
              <Text style={styles.label}>Where</Text>
              <Text style={styles.venue}>See map pin for location</Text>
            </View>
          )}
          <View style={styles.block}>
            <Text style={styles.label}>About</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
          {shareError ? <Text style={styles.errorInline}>{shareError}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={shareBusy}
            onPress={() => void onShare()}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.shareButton,
              (pressed || shareBusy) && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {shareBusy ? 'Opening…' : 'Share event'}
            </Text>
          </Pressable>
          <ReportEventButton
            eventId={event.id}
            organizerId={event.organizer_id}
            onReported={() => router.back()}
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
  },
  content: {
    paddingBottom: Spacing.listBottom,
  },
  cover: {
    width: '100%',
    height: 220,
    backgroundColor: Palette.card,
  },
  title: {
    ...Typography.cardTitle,
    color: Palette.title,
    paddingHorizontal: Spacing.screenX,
    marginTop: Spacing.sectionBottom,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.metaGap,
    paddingHorizontal: Spacing.screenX,
    marginTop: Spacing.metaGap,
  },
  pill: {
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
    borderRadius: Radii.pill,
  },
  pillText: {
    ...Typography.pill,
    color: Palette.onSurface,
  },
  meta: {
    ...Typography.meta,
    color: Palette.ink,
  },
  price: {
    color: Palette.ink,
  },
  freeBadge: {
    backgroundColor: Palette.highlight,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
    borderRadius: Radii.pill,
  },
  freeBadgeText: {
    ...Typography.pill,
    color: Palette.primary,
  },
  block: {
    paddingHorizontal: Spacing.screenX,
    marginTop: Spacing.sectionBottom,
  },
  label: {
    ...Typography.pill,
    color: Palette.subheader,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  venue: {
    ...Typography.subheader,
    color: Palette.ink,
    lineHeight: 24,
  },
  description: {
    ...Typography.body,
    color: Palette.ink,
    lineHeight: 22,
  },
  shareHeader: {
    ...Typography.pill,
    color: Palette.accent,
    fontSize: 14,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accent,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
  },
  shareButton: {
    marginHorizontal: Spacing.screenX,
    marginTop: Spacing.sectionBottom,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    ...Typography.pill,
    color: Palette.onAccent,
    fontSize: 14,
  },
  error: {
    ...Typography.body,
    color: Palette.destructive,
    textAlign: 'center',
    marginBottom: Spacing.sectionBottom,
  },
  errorInline: {
    ...Typography.body,
    color: Palette.destructive,
    paddingHorizontal: Spacing.screenX,
    marginTop: Spacing.metaGap,
  },
  pressed: {
    opacity: 0.85,
  },
});
