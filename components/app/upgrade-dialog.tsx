"use client";

import { CheckCircle2, Crown, MessageSquareMore, Sparkles } from "lucide-react";
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
  "Unlimited landlord-sent messages",
  "Broadcast inbox updates to all tenants",
  "Unlock live reports and smart prediction placeholders",
  "Keep adding properties without the free plan ceiling",
];

export function UpgradeDialog() {
  const currentUser = useAppStore((state) => state.currentUser);
  const open = useAppStore((state) => state.upgradeDialogOpen);
  const setOpen = useAppStore((state) => state.setUpgradeDialogOpen);
  const upgradeToPro = useAppStore((state) => state.upgradeToPro);

  if (!currentUser || currentUser.role !== "landlord") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            Turn the demo into a sticky landlord workflow with the premium tools people expect to pay for.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">$19/mo Pro unlock</p>
              <p className="text-sm text-muted-foreground">Built to feel like an easy yes after the first week of use.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <p className="text-sm">{feature}</p>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Maybe later
          </Button>
          <Button
            type="button"
            onClick={() => {
              upgradeToPro();
              toast.success("Pro unlocked for this demo workspace.");
            }}
          >
            <MessageSquareMore className="h-4 w-4" />
            Unlock Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
