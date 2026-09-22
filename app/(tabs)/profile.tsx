import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmailAuthForm } from '@/components/auth/EmailAuthForm';
import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/contexts/profile-context';

export default function ProfileScreen() {
  const { user, isLoading: authLoading, signOut, deleteAccount } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    canCreate,
    becomeOrganizer,
    refreshProfile,
  } = useProfile();
  const [organizerBusy, setOrganizerBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onSignOut() {
    await signOut();
  }

  async function onBecomeOrganizer() {
    setOrganizerBusy(true);
    setActionError(null);
    const result = await becomeOrganizer();
    if (result.error) {
      setActionError(result.error);
    }
    setOrganizerBusy(false);
  }

  function onDeleteAccountPress() {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and related data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeleteBusy(true);
              setActionError(null);
              const result = await deleteAccount();
              if (result.error) {
                setActionError(result.error);
              }
              setDeleteBusy(false);
            })();
          },
        },
      ]
    );
  }

  const loading = authLoading || (Boolean(user) && profileLoading);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.header}>Profile</Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Palette.accent} />
          </View>
        ) : user ? (
          <>
            <Text style={styles.subheader}>Signed in</Text>

            <View style={styles.block}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email ?? '—'}</Text>
            </View>

            <View style={styles.block}>
              <Text style={styles.label}>Display name</Text>
              <Text style={styles.value}>
                {profile?.display_name ?? '—'}
              </Text>
            </View>

            <View style={styles.block}>
              <Text style={styles.label}>Organizer</Text>
              <Text style={styles.value}>
                {canCreate ? 'Yes — you can publish' : 'No — required to publish'}
              </Text>
            </View>

            {profileError ? (
              <Text style={styles.error}>
                Profile error: {profileError}. Apply the Phase 0 migration if
                tables are missing.
              </Text>
            ) : null}

            {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

            {!canCreate ? (
              <Pressable
                accessibilityRole="button"
                disabled={organizerBusy}
                onPress={onBecomeOrganizer}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (pressed || organizerBusy) && styles.buttonPressed,
                ]}
              >
                {organizerBusy ? (
                  <ActivityIndicator color={Palette.onAccent} />
                ) : (
                  <Text style={styles.primaryButtonText}>Become an organizer</Text>
                )}
              </Pressable>
            ) : (
              <>
                <Link href="/create" asChild>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Create an event</Text>
                  </Pressable>
                </Link>
                <Link href="/my-events" asChild>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.secondaryButtonText}>My Events</Text>
                  </Pressable>
                </Link>
              </>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => void refreshProfile()}
              style={styles.linkButton}
            >
              <Text style={styles.linkButtonText}>Refresh profile</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onSignOut}
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={deleteBusy}
              onPress={onDeleteAccountPress}
              style={({ pressed }) => [
                styles.deleteButton,
                (pressed || deleteBusy) && styles.buttonPressed,
              ]}
            >
              {deleteBusy ? (
                <ActivityIndicator color={Palette.destructive} />
              ) : (
                <Text style={styles.deleteText}>Delete account</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.subheader}>
              Sign in with email to save your session on this device.
            </Text>
            <EmailAuthForm />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.cream,
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
  loading: {
    marginTop: Spacing.sectionBottom,
  },
  block: {
    marginBottom: Spacing.sectionBottom,
  },
  label: {
    ...Typography.pill,
    color: Palette.subheader,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    ...Typography.subheader,
    color: Palette.ink,
    fontWeight: '700',
  },
  error: {
    ...Typography.body,
    color: Palette.destructive,
    marginBottom: Spacing.metaGap,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.accent,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
    marginBottom: Spacing.metaGap,
    minWidth: 160,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...Typography.pill,
    color: Palette.onAccent,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.card,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
    marginBottom: Spacing.metaGap,
    minWidth: 160,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...Typography.pill,
    color: Palette.accent,
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sectionBottom,
  },
  linkButtonText: {
    ...Typography.body,
    color: Palette.accent,
    fontWeight: '600',
  },
  signOutButton: {
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
    backgroundColor: Palette.card,
    marginBottom: Spacing.sectionBottom,
  },
  signOutText: {
    ...Typography.pill,
    color: Palette.ink,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.pillX,
    paddingVertical: Spacing.pillY,
    borderWidth: 1,
    borderColor: Palette.destructive,
    minWidth: 140,
    alignItems: 'center',
  },
  deleteText: {
    ...Typography.pill,
    color: Palette.destructive,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
