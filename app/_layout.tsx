// Root layout — wraps the entire app with providers and auth guard
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
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

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
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
          name="person/new"
          options={{
            title: 'Add Person',
            presentation: 'modal',
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
