import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  Palette,
  Radii,
  Shadows,
  Spacing,
  Typography,
  getPillColor,
} from '@/constants/theme';
import {
  displayCategory,
  formatEventPrice,
  isEventFree,
} from '@/lib/event-compat';
import { formatEventWhen } from '@/lib/format-event';
import type { Event } from '@/types/event';

type EventCardProps = {
  item: Event;
};

export function EventCard({ item }: EventCardProps) {
  const router = useRouter();
  const category = displayCategory(item);
  const pillColor = getPillColor(category);
  const whenLabel = formatEventWhen(item.starts_at, item.timezone);
  const free = isEventFree(item);
  const priceText = formatEventPrice(item);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
      onPress={() => router.push(`/event/${item.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image
        source={{ uri: item.cover_image_url }}
        style={styles.cardImage}
        resizeMode="cover"
      />

      <View style={styles.cardBody}>
        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.detailsRow}>
          <View style={[styles.pill, { backgroundColor: pillColor }]}>
            <Text style={styles.pillText}>{category}</Text>
          </View>
          <Text style={styles.metaText}>{whenLabel}</Text>
          <View style={styles.metaDot} />
          {free ? (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>{priceText}</Text>
            </View>
          ) : (
            <Text style={[styles.metaText, styles.priceText]}>
              {priceText}
            </Text>
          )}
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {item.description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: Radii.card,
    marginBottom: Spacing.cardGap,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cardPressed: {
    opacity: 0.92,
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardBody: {
    padding: Spacing.cardBody,
  },
  title: {
    ...Typography.cardTitle,
    color: Palette.title,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.metaGap,
    marginBottom: 12,
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
  metaText: {
    ...Typography.meta,
    color: Palette.ink,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: Radii.metaDot,
    backgroundColor: Palette.metaDot,
  },
  priceText: {
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
  description: {
    ...Typography.body,
    color: Palette.ink,
  },
});
