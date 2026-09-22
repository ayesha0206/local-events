import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { Palette, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { REPORT_REASONS, reportEvent } from '@/lib/report-event';

type ReportEventButtonProps = {
  eventId: string;
  organizerId: string;
  onReported?: () => void;
};

function pickReportReason(): Promise<string | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Report event',
          message: 'Why are you reporting this listing?',
          options: [...REPORT_REASONS, 'Cancel'],
          cancelButtonIndex: REPORT_REASONS.length,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          if (
            buttonIndex === undefined ||
            buttonIndex === REPORT_REASONS.length
          ) {
            resolve(null);
            return;
          }
          resolve(REPORT_REASONS[buttonIndex] ?? null);
        }
      );
      return;
    }

    Alert.alert(
      'Report event',
      'Why are you reporting this listing?',
      [
        ...REPORT_REASONS.map((reason) => ({
          text: reason,
          onPress: () => resolve(reason),
        })),
        { text: 'Cancel', style: 'cancel' as const, onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
}

export function ReportEventButton({
  eventId,
  organizerId,
  onReported,
}: ReportEventButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwnEvent = Boolean(user?.id && user.id === organizerId);

  const onPress = useCallback(async () => {
    if (busy || isOwnEvent) {
      return;
    }

    if (!user) {
      Alert.alert(
        'Sign in required',
        'Sign in from Profile to report a listing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Profile',
            onPress: () => router.push('/(tabs)/profile'),
          },
        ]
      );
      return;
    }

    const reason = await pickReportReason();
    if (!reason) {
      return;
    }

    setBusy(true);
    setError(null);
    const result = await reportEvent(eventId, reason);
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const message = result.alreadyReported
      ? 'You already reported this listing. It stays hidden from discovery pending review.'
      : 'Thanks — this listing was removed from discovery pending review.';

    Alert.alert('Report submitted', message, [
      {
        text: 'OK',
        onPress: () => onReported?.(),
      },
    ]);
  }, [busy, eventId, isOwnEvent, onReported, router, user]);

  if (isOwnEvent) {
    return null;
  }

  return (
    <>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Report event"
        disabled={busy}
        onPress={() => void onPress()}
        style={({ pressed }) => [
          styles.button,
          (pressed || busy) && styles.pressed,
        ]}
      >
        <Text style={styles.buttonText}>
          {busy ? 'Reporting…' : 'Report event'}
        </Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: Spacing.screenX,
    marginTop: Spacing.metaGap,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    ...Typography.meta,
    color: Palette.destructive,
  },
  error: {
    ...Typography.body,
    color: Palette.destructive,
    paddingHorizontal: Spacing.screenX,
    marginTop: Spacing.metaGap,
  },
  pressed: {
    opacity: 0.7,
  },
});
