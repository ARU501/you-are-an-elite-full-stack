"use client";

import { Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

export function UpgradeFab() {
  const setUpgradeDialogOpen = useAppStore((state) => state.setUpgradeDialogOpen);

  return (
    <div className="fixed bottom-24 right-4 z-40 sm:bottom-6 sm:right-6">
      <Button variant="premium" size="lg" className="rounded-full shadow-glow" onClick={() => setUpgradeDialogOpen(true)}>
        <Crown className="h-4 w-4" />
        Upgrade to Pro
      </Button>
    </div>
  );
}
