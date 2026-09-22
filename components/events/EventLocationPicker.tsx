import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';

import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import { DRAFT_PLACEHOLDER_COORDS } from '@/lib/create-event';
import {
  ensureCurrentCoords,
  reverseGeocodeCoords,
  type Coords,
} from '@/lib/location';

const MAP_DELTA = {
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export type EventLocationValue = {
  coords: Coords;
  address: string;
};

type EventLocationPickerProps = {
  value: EventLocationValue | null;
  onChange: (next: EventLocationValue) => void;
};

export function EventLocationPicker({ value, onChange }: EventLocationPickerProps) {
  const [booting, setBooting] = useState(!value);
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [mapEpoch, setMapEpoch] = useState(0);

  const applyCoords = useCallback(
    async (coords: Coords, options?: { recenter?: boolean }) => {
      setGeocoding(true);
      setHint(null);
      const lookedUp = await reverseGeocodeCoords(coords);
      onChange({
        coords,
        address: lookedUp ?? '',
      });
      if (options?.recenter) {
        setMapEpoch((n) => n + 1);
      }
      if (!lookedUp) {
        setHint('Could not look up address — enter it manually if needed.');
      }
      setGeocoding(false);
    },
    [onChange]
  );

  useEffect(() => {
    if (value) {
      setBooting(false);
      return;
    }

    let active = true;

    async function boot() {
      const ensured = await ensureCurrentCoords();
      if (!active) {
        return;
      }
      const coords: Coords =
        ensured.coords ?? {
          latitude: DRAFT_PLACEHOLDER_COORDS.lat,
          longitude: DRAFT_PLACEHOLDER_COORDS.lng,
        };
      if (!ensured.coords) {
        setHint(
          ensured.permission.granted
            ? 'Using a default pin — drag or tap the map to set the venue.'
            : 'Location off — using a default pin. Tap the map or enable location.'
        );
      }
      await applyCoords(coords, { recenter: true });
      if (active) {
        setBooting(false);
      }
    }

    void boot();
    return () => {
      active = false;
    };
    // Boot once when no initial value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onUseMyLocation() {
    setLocating(true);
    setHint(null);
    const ensured = await ensureCurrentCoords();
    setLocating(false);
    if (!ensured.coords) {
      setHint(
        ensured.permission.granted
          ? 'Could not read your current location.'
          : 'Allow location to drop a pin at your position.'
      );
      return;
    }
    await applyCoords(ensured.coords, { recenter: true });
  }

  function onMapPress(event: MapPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    void applyCoords({ latitude, longitude });
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.wrap}>
        <Text style={styles.webNote}>
          Map pin picker needs iOS Simulator or a device. Enter coordinates
          manually on web.
        </Text>
        <TextInput
          value={value ? String(value.coords.latitude) : ''}
          onChangeText={(text) => {
            const latitude = Number(text);
            if (!value || Number.isNaN(latitude)) {
              return;
            }
            onChange({
              ...value,
              coords: { ...value.coords, latitude },
            });
          }}
          placeholder="Latitude"
          placeholderTextColor={Palette.metaDot}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <TextInput
          value={value ? String(value.coords.longitude) : ''}
          onChangeText={(text) => {
            const longitude = Number(text);
            if (!value || Number.isNaN(longitude)) {
              return;
            }
            onChange({
              ...value,
              coords: { ...value.coords, longitude },
            });
          }}
          placeholder="Longitude"
          placeholderTextColor={Palette.metaDot}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <AddressField
          value={value?.address ?? ''}
          onChangeText={(address) => {
            if (!value) {
              return;
            }
            onChange({ ...value, address });
          }}
        />
      </View>
    );
  }

  if (booting || !value) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Palette.accent} />
        <Text style={styles.loadingText}>Preparing map pin…</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.help}>Tap the map or drag the pin to set the venue.</Text>
      <View style={styles.mapWrap}>
        <MapView
          key={`pin-${mapEpoch}`}
          style={styles.map}
          initialRegion={{
            latitude: value.coords.latitude,
            longitude: value.coords.longitude,
            ...MAP_DELTA,
          }}
          onPress={onMapPress}
          showsUserLocation
          showsMyLocationButton={false}
        >
          <Marker
            coordinate={value.coords}
            draggable
            pinColor={Palette.accent}
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              void applyCoords({ latitude, longitude });
            }}
          />
        </MapView>
        {geocoding ? (
          <View style={styles.geocodeOverlay}>
            <ActivityIndicator color={Palette.onAccent} />
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={locating}
        onPress={() => void onUseMyLocation()}
        style={({ pressed }) => [
          styles.locationButton,
          (pressed || locating) && styles.pressed,
        ]}
      >
        <Text style={styles.locationButtonText}>
          {locating ? 'Locating…' : 'Use my location'}
        </Text>
      </Pressable>

      <Text style={styles.coords}>
        {value.coords.latitude.toFixed(5)}, {value.coords.longitude.toFixed(5)}
      </Text>

      <AddressField
        value={value.address}
        onChangeText={(address) => onChange({ ...value, address })}
      />

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function AddressField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Address (from pin, editable)"
      placeholderTextColor={Palette.metaDot}
      style={[styles.input, styles.addressInput]}
      multiline
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.metaGap,
  },
  help: {
    ...Typography.body,
    color: Palette.muted,
  },
  mapWrap: {
    height: 220,
    borderRadius: Radii.card,
    overflow: 'hidden',
    backgroundColor: Palette.card,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  geocodeOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,26,26,0.25)',
  },
  locationButton: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.card,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Palette.accent,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
  },
  locationButtonText: {
    ...Typography.pill,
    color: Palette.accent,
  },
  coords: {
    ...Typography.body,
    color: Palette.meta,
  },
  input: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    paddingHorizontal: Spacing.cardBody,
    paddingVertical: 14,
    ...Typography.subheader,
    color: Palette.ink,
  },
  addressInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  hint: {
    ...Typography.body,
    color: Palette.ink,
  },
  webNote: {
    ...Typography.body,
    color: Palette.muted,
    lineHeight: 21,
  },
  loading: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.metaGap,
  },
  loadingText: {
    ...Typography.body,
    color: Palette.muted,
  },
  pressed: {
    opacity: 0.85,
  },
});
