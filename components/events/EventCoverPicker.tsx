import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import type { LocalCoverImage } from '@/lib/upload-event-image';

type EventCoverPickerProps = {
  value: LocalCoverImage | null;
  onChange: (next: LocalCoverImage | null) => void;
};

export function EventCoverPicker({ value, onChange }: EventCoverPickerProps) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  async function pickCover() {
    setBusy(true);
    setHint(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setHint('Photo library access is required to add a cover image.');
      setBusy(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    setBusy(false);

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    const asset = result.assets[0];
    onChange({
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    });
  }

  return (
    <View style={styles.wrap}>
      {value ? (
        <View style={styles.previewWrap}>
          <Image
            source={{ uri: value.uri }}
            style={styles.preview}
            contentFit="cover"
          />
          <View style={styles.previewActions}>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void pickCover()}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Change photo</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => onChange(null)}
              style={({ pressed }) => [
                styles.clearButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.clearButtonText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void pickCover()}
          style={({ pressed }) => [
            styles.empty,
            pressed && styles.pressed,
            busy && styles.emptyBusy,
          ]}
        >
          {busy ? (
            <ActivityIndicator color={Palette.accent} />
          ) : (
            <>
              <Text style={styles.emptyTitle}>Add cover photo</Text>
              <Text style={styles.emptyBody}>Required before saving a draft</Text>
            </>
          )}
        </Pressable>
      )}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.metaGap,
  },
  empty: {
    minHeight: 160,
    borderRadius: 14,
    backgroundColor: Palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: Spacing.cardBody,
  },
  emptyBusy: {
    opacity: 0.7,
  },
  emptyTitle: {
    ...Typography.subheader,
    color: Palette.accent,
  },
  emptyBody: {
    ...Typography.body,
    color: Palette.ink,
  },
  previewWrap: {
    gap: Spacing.metaGap,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: Palette.card,
  },
  previewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.metaGap,
  },
  secondaryButton: {
    backgroundColor: Palette.card,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
  },
  secondaryButtonText: {
    ...Typography.pill,
    color: Palette.accent,
  },
  clearButton: {
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
  },
  clearButtonText: {
    ...Typography.pill,
    color: Palette.meta,
  },
  pressed: {
    opacity: 0.85,
  },
  hint: {
    ...Typography.body,
    color: Palette.destructive,
  },
});
