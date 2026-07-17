"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { useAppStore } from "@/store/app-store";

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
  const initialize = useAppStore((state) => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return null;
}
