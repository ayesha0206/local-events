import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/auth-context';
import { ProfileProvider } from '@/contexts/profile-context';
import { Palette } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const eventDetailOptions = {
  title: 'Event',
  headerTintColor: Palette.accent,
  headerStyle: { backgroundColor: Palette.cream },
  headerShadowVisible: false,
};

const myEventsOptions = {
  title: 'My Events',
  headerTintColor: Palette.accent,
  headerStyle: { backgroundColor: Palette.cream },
  headerShadowVisible: false,
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ThemeProvider value={DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="event/[id]" options={eventDetailOptions} />
            <Stack.Screen name="my-events/index" options={myEventsOptions} />
            <Stack.Screen name="my-events/[id]" options={myEventsOptions} />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
