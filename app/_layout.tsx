// Root layout — wraps the entire app with providers and auth guard
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../src/stores';
import { Colors } from '../src/theme/tokens';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthScreen = segments[0] === 'auth';

    if (!session && !inAuthScreen) {
      // Not signed in → redirect to auth
      router.replace('/auth');
    } else if (session && inAuthScreen) {
      // Signed in but on auth screen → redirect to tabs
      router.replace('/(tabs)');
    }
  }, [session, isInitialized, segments]);

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <AuthGuard>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.textPrimary,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: Colors.background },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth"
            options={{ headerShown: false, presentation: 'modal' }}
          />
          <Stack.Screen
            name="person/[id]"
            options={{
              title: 'Person',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="interaction/new"
            options={{
              title: 'Log Interaction',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="interaction/[id]"
            options={{
              title: 'Interaction',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="interaction/edit"
            options={{
              title: 'Edit Interaction',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="person/new"
            options={{
              title: 'Add Person',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="person/edit"
            options={{
              title: 'Edit Person',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="reminders"
            options={{
              title: 'Reminders',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="reminder/new"
            options={{
              title: 'New Reminder',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'Settings',
              presentation: 'card',
            }}
          />
        </Stack>
      </AuthGuard>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

