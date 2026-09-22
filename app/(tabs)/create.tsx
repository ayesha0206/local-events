import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreateEventForm } from '@/components/events/CreateEventForm';
import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';

/**
 * Organizer create flow — draft form with map pin + cover upload.
 * My Events / edit / publish / cancel follow in 3.4.
 */
export default function CreateScreen() {
  const { user } = useAuth();
  const { profile, isLoading, canCreate } = useProfile();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.header}>Create</Text>

          {!user ? (
            <>
              <Text style={styles.subheader}>
                Sign in and become an organizer to create events.
              </Text>
              <Link href="/profile" asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.buttonText}>Go to Profile</Text>
                </Pressable>
              </Link>
            </>
          ) : isLoading ? (
            <Text style={styles.subheader}>Loading profile…</Text>
          ) : !canCreate ? (
            <>
              <Text style={styles.subheader}>
                Publishing is locked until you turn on organizer mode.
              </Text>
              <Text style={styles.body}>
                Current status:{' '}
                {profile?.is_organizer ? 'organizer' : 'attendee only'}
              </Text>
              <Link href="/profile" asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.buttonText}>Become an organizer</Text>
                </Pressable>
              </Link>
            </>
          ) : (
            <>
              <Text style={styles.subheader}>
                Draft a new event with a map pin and cover photo. Publish from My
                Events when ready.
              </Text>
              <CreateEventForm organizerId={user.id} />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.screenX,
    paddingTop:
      Platform.OS === 'android' ? Spacing.screenTopAndroid : Spacing.screenTopIos,
  },
  header: {
    ...Typography.header,
    color: Palette.title,
  },
  subheader: {
    ...Typography.subheader,
    marginTop: Spacing.headerGap,
    marginBottom: Spacing.sectionBottom,
    color: Palette.subheader,
    lineHeight: 24,
  },
  body: {
    ...Typography.body,
    color: Palette.ink,
    marginBottom: Spacing.sectionBottom,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accent,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...Typography.pill,
    color: Palette.onAccent,
  },
});
