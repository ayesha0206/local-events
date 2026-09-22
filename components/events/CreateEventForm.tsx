import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
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
import { createDraftEvent } from '@/lib/create-event';
import { formatEventWhen } from '@/lib/format-event';
import {
  uploadEventCoverImage,
  type LocalCoverImage,
} from '@/lib/upload-event-image';

type CreateEventFormProps = {
  organizerId: string;
  onSaved?: (eventId: string) => void;
};

function defaultStartDate(): Date {
  const date = new Date();
  date.setHours(date.getHours() + 24, 0, 0, 0);
  return date;
}

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

type PickerTarget = 'starts' | 'ends' | null;

export function CreateEventForm({ organizerId, onSaved }: CreateEventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priceLabel, setPriceLabel] = useState('Free');
  const [venueName, setVenueName] = useState('');
  const [timezone] = useState(deviceTimezone);
  const [startsAt, setStartsAt] = useState(defaultStartDate);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [location, setLocation] = useState<EventLocationValue | null>(null);
  const [cover, setCover] = useState<LocalCoverImage | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const endsLabel = useMemo(
    () => (endsAt ? formatEventWhen(endsAt.toISOString(), timezone) : 'Optional'),
    [endsAt, timezone]
  );

  function onPickerChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      setPickerTarget(null);
    }
    if (event.type === 'dismissed' || !date) {
      return;
    }
    if (pickerTarget === 'starts') {
      setStartsAt(date);
    } else if (pickerTarget === 'ends') {
      setEndsAt(date);
    }
  }

  async function onSaveDraft() {
    if (!location) {
      setError('Set a map pin for the event location.');
      setMessage(null);
      return;
    }

    if (!cover) {
      setError('Add a cover photo before saving the draft.');
      setMessage(null);
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    const upload = await uploadEventCoverImage(organizerId, cover);
    if (upload.error || !upload.publicUrl) {
      setBusy(false);
      setError(upload.error ?? 'Could not upload cover image.');
      return;
    }

    const result = await createDraftEvent({
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
      coverImageUrl: upload.publicUrl,
    });

    setBusy(false);

    if (result.error || !result.event) {
      setError(result.error ?? 'Could not save draft.');
      return;
    }

    setMessage(`Draft saved. Open My Events to publish.`);
    setTitle('');
    setDescription('');
    setCategory('');
    setPriceLabel('Free');
    setVenueName('');
    setStartsAt(defaultStartDate());
    setEndsAt(null);
    setLocation(null);
    setCover(null);
    onSaved?.(result.event.id);
  }

  return (
    <View style={styles.form}>
      <Text style={styles.hint}>
        Saves as a draft with a map pin and cover photo.
      </Text>

      <Field label="Title">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Event title"
          placeholderTextColor={Palette.metaDot}
          style={styles.input}
        />
      </Field>

      <Field label="Category">
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="e.g. Outdoors, Music"
          placeholderTextColor={Palette.metaDot}
          style={styles.input}
        />
      </Field>

      <Field label="Price label">
        <TextInput
          value={priceLabel}
          onChangeText={setPriceLabel}
          placeholder="Free"
          placeholderTextColor={Palette.metaDot}
          style={styles.input}
        />
      </Field>

      <Field label="Starts">
        <Pressable
          accessibilityRole="button"
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
            onPress={() => setPickerTarget('ends')}
            style={[styles.pickerButton, styles.endsPicker]}
          >
            <Text style={styles.pickerButtonText}>{endsLabel}</Text>
          </Pressable>
          {endsAt ? (
            <Pressable
              accessibilityRole="button"
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
        />
      </Field>

      <Field label="Location">
        <EventLocationPicker value={location} onChange={setLocation} />
      </Field>

      <Field label="Cover photo">
        <EventCoverPicker value={cover} onChange={setCover} />
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
        onPress={() => void onSaveDraft()}
        style={({ pressed }) => [
          styles.submit,
          (pressed || busy) && styles.submitPressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={Palette.onAccent} />
        ) : (
          <Text style={styles.submitText}>Save draft</Text>
        )}
      </Pressable>
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
  hint: {
    ...Typography.body,
    color: Palette.subheader,
    marginBottom: Spacing.headerGap,
    lineHeight: 21,
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
  submitPressed: {
    opacity: 0.85,
  },
  submitText: {
    ...Typography.pill,
    fontSize: 14,
    color: Palette.onAccent,
  },
});
