import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import type { DiscoverFilters } from '@/lib/discover-filters';

type DiscoverFilterBarProps = {
  categories: string[];
  filters: DiscoverFilters;
  onChange: (next: DiscoverFilters) => void;
};

export function DiscoverFilterBar({
  categories,
  filters,
  onChange,
}: DiscoverFilterBarProps) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <Chip
          label="All"
          selected={filters.category === null}
          onPress={() => onChange({ ...filters, category: null })}
        />
        {categories.map((category) => (
          <Chip
            key={category}
            label={category}
            selected={filters.category === category}
            onPress={() => onChange({ ...filters, category })}
          />
        ))}
        <Chip
          label="Free"
          selected={filters.freeOnly}
          onPress={() => onChange({ ...filters, freeOnly: !filters.freeOnly })}
        />
      </ScrollView>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: Spacing.metaGap,
  },
  row: {
    gap: Spacing.metaGap,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
    borderRadius: Radii.pill,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.metaDot,
  },
  chipSelected: {
    backgroundColor: Palette.highlight,
    borderColor: Palette.highlight,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    ...Typography.pill,
    color: Palette.ink,
  },
  chipTextSelected: {
    color: Palette.primary,
  },
});
