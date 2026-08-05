import '../global.css';
import React, { useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import Constants from 'expo-constants';
import { Theme } from '../constants/theme';
import { DeviceFrame } from '../components/DeviceFrame';
import { ModalProvider } from '../context/ModalContext';
import { trpc } from '../utils/trpc';

function getTrpcUrl() {
  if (Platform.OS === 'web') return 'http://localhost:8081/trpc';
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const localhost = debuggerHost?.split(':')[0];
  if (localhost) return `http://${localhost}:8081/trpc`;
  return 'http://192.168.0.3:8081/trpc';
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getTrpcUrl(),
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ModalProvider>
            <DeviceFrame>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Theme.colors.bg },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </DeviceFrame>
          </ModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
