import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Palette, Radii, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

type Mode = 'sign-in' | 'sign-up';

export function EmailAuthForm() {
  const { signInWithEmail, signUpWithEmail, isConfigured } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || password.length < 6) {
      setError('Enter an email and a password with at least 6 characters.');
      setMessage(null);
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'sign-in') {
        const result = await signInWithEmail(trimmedEmail, password);
        if (result.error) {
          setError(result.error);
        }
      } else {
        const result = await signUpWithEmail(trimmedEmail, password);
        if (result.error) {
          setError(result.error);
        } else if (result.needsEmailConfirmation) {
          setMessage('Check your email to confirm your account, then sign in.');
        }
      }
    } finally {
      setBusy(false);
    }
  }

  if (!isConfigured) {
    return (
      <Text style={styles.hint}>
        Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env to
        enable sign-in.
      </Text>
    );
  }

  return (
    <View style={styles.form}>
      <View style={styles.modeRow}>
        <Pressable onPress={() => setMode('sign-in')}>
          <Text
            style={[styles.modeLabel, mode === 'sign-in' && styles.modeLabelActive]}
          >
            Sign in
          </Text>
        </Pressable>
        <Text style={styles.modeDivider}>·</Text>
        <Pressable onPress={() => setMode('sign-up')}>
          <Text
            style={[styles.modeLabel, mode === 'sign-up' && styles.modeLabelActive]}
          >
            Sign up
          </Text>
        </Pressable>
      </View>

      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="Email"
        placeholderTextColor={Palette.metaDot}
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        autoCapitalize="none"
        placeholder="Password"
        placeholderTextColor={Palette.metaDot}
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.button,
          (pressed || busy) && styles.buttonPressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={Palette.onAccent} />
        ) : (
          <Text style={styles.buttonText}>
            {mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.metaGap,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.metaGap,
    marginBottom: Spacing.headerGap,
  },
  modeLabel: {
    ...Typography.subheader,
    color: Palette.muted,
  },
  modeLabelActive: {
    color: Palette.accent,
    fontWeight: '700',
  },
  modeDivider: {
    color: Palette.metaDot,
  },
  input: {
    backgroundColor: Palette.card,
    borderRadius: 14,
    paddingHorizontal: Spacing.cardBody,
    paddingVertical: 14,
    ...Typography.subheader,
    color: Palette.ink,
  },
  button: {
    marginTop: Spacing.headerGap,
    backgroundColor: Palette.accent,
    borderRadius: Radii.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...Typography.pill,
    fontSize: 14,
    color: Palette.onAccent,
  },
  error: {
    ...Typography.body,
    color: Palette.destructive,
  },
  message: {
    ...Typography.body,
    color: Palette.primary,
  },
  hint: {
    ...Typography.body,
    color: Palette.subheader,
    lineHeight: 21,
  },
});
