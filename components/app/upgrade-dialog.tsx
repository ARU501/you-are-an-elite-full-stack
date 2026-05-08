"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/store/app-store";

const features = [
  "Unlimited properties or jobs",
  "Cashflow reports and export hooks",
  "AI smart prediction placeholders",
  "Higher-stickiness admin experience",
];

export function UpgradeDialog() {
  const open = useAppStore((state) => state.upgradeDialogOpen);
  const setUpgradeDialogOpen = useAppStore((state) => state.setUpgradeDialogOpen);
  const upgradeToPro = useAppStore((state) => state.upgradeToPro);

  return (
    <Dialog open={open} onOpenChange={setUpgradeDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>$19/mo unlocks the parts of the product that make the free tier feel incomplete in a good way.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="text-sm">{feature}</p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
            Maybe later
          </Button>
          <Button
            type="button"
            onClick={() => {
              upgradeToPro();
              toast.success("Pro unlocked for the demo workspace.");
            }}
          >
            Unlock Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
