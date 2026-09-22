import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import { formatEventStatus, formatEventWhen } from '@/lib/format-event';
import type { Event } from '@/types/event';

type MyEventRowProps = {
  item: Event;
};

export function MyEventRow({ item }: MyEventRowProps) {
  const router = useRouter();
  const statusLabel = formatEventStatus(item.status);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${item.title}`}
      onPress={() => router.push(`/my-events/${item.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Image
        source={{ uri: item.cover_image_url }}
        style={styles.thumb}
        contentFit="cover"
      />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta}>
          {formatEventWhen(item.starts_at, item.timezone)}
        </Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusPill,
              item.status === 'published' && styles.statusPublished,
              item.status === 'cancelled' && styles.statusCancelled,
              item.status === 'draft' && styles.statusDraft,
            ]}
          >
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.metaGap,
    backgroundColor: Palette.card,
    borderRadius: 16,
    padding: Spacing.metaGap,
    marginBottom: Spacing.metaGap,
  },
  pressed: {
    opacity: 0.9,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: Palette.cream,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    ...Typography.subheader,
    color: Palette.title,
    fontWeight: '700',
  },
  meta: {
    ...Typography.meta,
    color: Palette.ink,
  },
  statusRow: {
    flexDirection: 'row',
  },
  statusPill: {
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: 3,
  },
  statusDraft: {
    backgroundColor: Palette.statusDraft,
  },
  statusPublished: {
    backgroundColor: Palette.statusPublished,
  },
  statusCancelled: {
    backgroundColor: Palette.statusCancelled,
  },
  statusText: {
    ...Typography.pill,
    fontSize: 11,
    color: Palette.ink,
  },
});
