"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";

import { loadSnapshot, saveSnapshot } from "@/lib/offline-db";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { APP_STORAGE_KEY, selectPersistedData, useAppStore } from "@/store/app-store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <StoreBootstrap />
      <RegisterServiceWorker />
      {children}
      <Toaster closeButton richColors position="top-center" />
    </ThemeProvider>
  );
}

function StoreBootstrap() {
  const replacePersistedData = useAppStore((state) => state.replacePersistedData);
  const setHasHydrated = useAppStore((state) => state.setHasHydrated);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const localValue = window.localStorage.getItem(APP_STORAGE_KEY);
      if (!localValue) {
        const snapshot = await loadSnapshot();
        if (snapshot && !cancelled) {
          replacePersistedData(snapshot);
        }
      }

      if (!cancelled) {
        setHasHydrated(true);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [replacePersistedData, setHasHydrated]);

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state) => {
      if (!state.hasHydrated) {
        return;
      }

      void saveSnapshot(selectPersistedData(state));
    });

    return unsubscribe;
  }, []);

  return null;
}
