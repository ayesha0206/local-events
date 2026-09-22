import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EventCoverPicker } from '@/components/events/EventCoverPicker';
import {
  EventLocationPicker,
  type EventLocationValue,
} from '@/components/events/EventLocationPicker';
import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import { formatEventStatus, formatEventWhen } from '@/lib/format-event';
import {
  cancelOwnedEvent,
  publishOwnedEvent,
  updateOwnedEvent,
} from '@/lib/organizer-events';
import {
  uploadEventCoverImage,
  type LocalCoverImage,
} from '@/lib/upload-event-image';
import type { Event } from '@/types/event';

type EditEventFormProps = {
  event: Event;
  organizerId: string;
  onUpdated: (event: Event) => void;
};

type PickerTarget = 'starts' | 'ends' | null;

export function EditEventForm({
  event,
  organizerId,
  onUpdated,
}: EditEventFormProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [category, setCategory] = useState(event.category);
  const [priceLabel, setPriceLabel] = useState(event.price_label);
  const [venueName, setVenueName] = useState(event.venue_name ?? '');
  const [timezone] = useState(event.timezone || 'UTC');
  const [startsAt, setStartsAt] = useState(() => new Date(event.starts_at));
  const [endsAt, setEndsAt] = useState<Date | null>(() =>
    event.ends_at ? new Date(event.ends_at) : null
  );
  const [location, setLocation] = useState<EventLocationValue>({
    coords: { latitude: event.lat, longitude: event.lng },
    address: event.address ?? '',
  });
  const [existingCoverUrl, setExistingCoverUrl] = useState(event.cover_image_url);
  const [newCover, setNewCover] = useState<LocalCoverImage | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState(event.status);

  const endsLabel = useMemo(
    () => (endsAt ? formatEventWhen(endsAt.toISOString(), timezone) : 'Optional'),
    [endsAt, timezone]
  );

  const coverValue: LocalCoverImage | null = newCover
    ? newCover
    : existingCoverUrl
      ? { uri: existingCoverUrl }
      : null;

  const isCancelled = status === 'cancelled';
  const isDraft = status === 'draft';

  function onCoverChange(next: LocalCoverImage | null) {
    if (!next) {
      setNewCover(null);
      setExistingCoverUrl('');
      return;
    }
    if (next.uri === existingCoverUrl) {
      setNewCover(null);
      return;
    }
    setNewCover(next);
  }

  function onPickerChange(pickerEvent: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setPickerTarget(null);
    }
    if (pickerEvent.type === 'dismissed' || !date) {
      return;
    }
    if (pickerTarget === 'starts') {
      setStartsAt(date);
    } else if (pickerTarget === 'ends') {
      setEndsAt(date);
    }
  }

  async function resolveCoverUrl(): Promise<{ url: string | null; error: string | null }> {
    if (newCover) {
      const upload = await uploadEventCoverImage(organizerId, newCover);
      if (upload.error || !upload.publicUrl) {
        return { url: null, error: upload.error ?? 'Could not upload cover image.' };
      }
      return { url: upload.publicUrl, error: null };
    }
    if (!existingCoverUrl.trim()) {
      return { url: null, error: 'A cover image is required.' };
    }
    return { url: existingCoverUrl, error: null };
  }

  async function persistFields(): Promise<Event | null> {
    if (!location) {
      setError('Set a map pin for the event location.');
      setMessage(null);
      return null;
    }

    const cover = await resolveCoverUrl();
    if (cover.error || !cover.url) {
      setError(cover.error ?? 'A cover image is required.');
      setMessage(null);
      return null;
    }

    const result = await updateOwnedEvent({
      eventId: event.id,
      organizerId,
      title,
      description,
      category,
      priceLabel,
      startsAt,
      endsAt,
      timezone,
      venueName,
      address: location.address,
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      coverImageUrl: cover.url,
    });

    if (result.error || !result.event) {
      setError(result.error ?? 'Could not save changes.');
      setMessage(null);
      return null;
    }

    setExistingCoverUrl(result.event.cover_image_url);
    setNewCover(null);
    setStatus(result.event.status);
    onUpdated(result.event);
    return result.event;
  }

  async function onSave() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const saved = await persistFields();
    setBusy(false);
    if (saved) {
      setMessage('Changes saved.');
    }
  }

  async function onPublish() {
    setBusy(true);
    setError(null);
    setMessage(null);

    const saved = await persistFields();
    if (!saved) {
      setBusy(false);
      return;
    }

    const result = await publishOwnedEvent(event.id, organizerId);
    setBusy(false);

    if (result.error || !result.event) {
      setError(result.error ?? 'Could not publish.');
      return;
    }

    setStatus(result.event.status);
    onUpdated(result.event);
    setMessage('Published — it can appear in Discover.');
  }

  function onCancelPress() {
    Alert.alert(
      'Cancel this event?',
      'Cancelled events leave discovery. You can still edit details later.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel event',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              setError(null);
              setMessage(null);
              const result = await cancelOwnedEvent(event.id, organizerId);
              setBusy(false);
              if (result.error || !result.event) {
                setError(result.error ?? 'Could not cancel.');
                return;
              }
              setStatus(result.event.status);
              onUpdated(result.event);
              setMessage('Event cancelled.');
            })();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.statusLine}>
        Status: {formatEventStatus(status)}
      </Text>

      <Field label="Title">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Event title"
          placeholderTextColor={Palette.metaDot}
          style={styles.input}
          editable={!busy}
        />
      </Field>

      <Field label="Category">
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="e.g. Outdoors, Music"
          placeholderTextColor={Palette.metaDot}
          style={styles.input}
          editable={!busy}
        />
      </Field>

      <Field label="Price label">
        <TextInput
          value={priceLabel}
          onChangeText={setPriceLabel}
          placeholder="Free"
          placeholderTextColor={Palette.metaDot}
          style={styles.input}
          editable={!busy}
        />
      </Field>

      <Field label="Starts">
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => setPickerTarget('starts')}
          style={styles.pickerButton}
        >
          <Text style={styles.pickerButtonText}>
            {formatEventWhen(startsAt.toISOString(), timezone)}
          </Text>
        </Pressable>
      </Field>

      <Field label="Ends">
        <View style={styles.endsRow}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => setPickerTarget('ends')}
            style={[styles.pickerButton, styles.endsPicker]}
          >
            <Text style={styles.pickerButtonText}>{endsLabel}</Text>
          </Pressable>
          {endsAt ? (
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => setEndsAt(null)}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
      </Field>

      <Field label="Timezone">
        <Text style={styles.timezone}>{timezone}</Text>
      </Field>

      <Field label="Venue">
        <TextInput
          value={venueName}
          onChangeText={setVenueName}
          placeholder="Optional venue name"
          placeholderTextColor={Palette.metaDot}
          style={styles.input}
          editable={!busy}
        />
      </Field>

      <Field label="Location">
        <EventLocationPicker value={location} onChange={setLocation} />
      </Field>

      <Field label="Cover photo">
        <EventCoverPicker value={coverValue} onChange={onCoverChange} />
      </Field>

      <Field label="Description">
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What should people know?"
          placeholderTextColor={Palette.metaDot}
          style={[styles.input, styles.multiline]}
          multiline
          textAlignVertical="top"
          editable={!busy}
        />
      </Field>

      {pickerTarget ? (
        <DateTimePicker
          value={
            pickerTarget === 'starts'
              ? startsAt
              : endsAt ?? new Date(startsAt.getTime() + 60 * 60 * 1000)
          }
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
        />
      ) : null}

      {Platform.OS === 'ios' && pickerTarget ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickerTarget(null)}
          style={styles.donePicker}
        >
          <Text style={styles.donePickerText}>Done</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void onSave()}
        style={({ pressed }) => [
          styles.submit,
          (pressed || busy) && styles.submitPressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={Palette.onAccent} />
        ) : (
          <Text style={styles.submitText}>Save changes</Text>
        )}
      </Pressable>

      {isDraft ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void onPublish()}
          style={({ pressed }) => [
            styles.secondary,
            (pressed || busy) && styles.submitPressed,
          ]}
        >
          <Text style={styles.secondaryText}>Publish</Text>
        </Pressable>
      ) : null}

      {!isCancelled ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onCancelPress}
          style={({ pressed }) => [
            styles.danger,
            (pressed || busy) && styles.submitPressed,
          ]}
        >
          <Text style={styles.dangerText}>Cancel event</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.metaGap,
    paddingBottom: Spacing.listBottom,
  },
  statusLine: {
    ...Typography.body,
    color: Palette.subheader,
    marginBottom: Spacing.headerGap,
  },
  field: {
    gap: 6,
  },
  label: {
    ...Typography.pill,
    color: Palette.subheader,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    paddingHorizontal: Spacing.cardBody,
    paddingVertical: 14,
    ...Typography.subheader,
    color: Palette.ink,
  },
  multiline: {
    minHeight: 110,
  },
  pickerButton: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    paddingHorizontal: Spacing.cardBody,
    paddingVertical: 14,
  },
  pickerButtonText: {
    ...Typography.subheader,
    color: Palette.ink,
  },
  endsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.metaGap,
  },
  endsPicker: {
    flex: 1,
  },
  clearButton: {
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
  },
  clearButtonText: {
    ...Typography.pill,
    color: Palette.accent,
  },
  timezone: {
    ...Typography.body,
    color: Palette.ink,
  },
  donePicker: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.pillY,
    paddingHorizontal: Spacing.pillX,
  },
  donePickerText: {
    ...Typography.pill,
    color: Palette.accent,
    fontSize: 14,
  },
  error: {
    ...Typography.body,
    color: Palette.destructive,
  },
  message: {
    ...Typography.body,
    color: Palette.primary,
    lineHeight: 21,
  },
  submit: {
    marginTop: Spacing.headerGap,
    backgroundColor: Palette.accent,
    borderRadius: Radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: Palette.card,
    borderRadius: Radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: {
    ...Typography.pill,
    fontSize: 14,
    color: Palette.accent,
  },
  danger: {
    borderRadius: Radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.destructive,
  },
  dangerText: {
    ...Typography.pill,
    fontSize: 14,
    color: Palette.destructive,
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitText: {
    ...Typography.pill,
    fontSize: 14,
    color: Palette.onAccent,
  },
});
