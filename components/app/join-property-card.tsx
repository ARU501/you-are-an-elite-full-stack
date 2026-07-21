"use client";

import { useState } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";

export function JoinPropertyCard({ className }: { className?: string }) {
  const router = useRouter();
  const joinPropertyWithCode = useAppStore((state) => state.joinPropertyWithCode);
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsJoining(true);
    try {
      const result = await joinPropertyWithCode(code);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setCode("");
      router.push("/dashboard");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <Card className={`border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20 ${className ?? ""}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-950">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">Have a code from your landlord?</CardTitle>
            <CardDescription>Enter it to join your home instantly — no application needed.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleJoin}>
          <div className="flex-1 space-y-2">
            <Label htmlFor="join-code">Invite code</Label>
            <Input
              id="join-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="e.g. 3F9A1C7B"
              autoCapitalize="characters"
              spellCheck={false}
              className="font-mono tracking-widest uppercase"
              required
            />
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 sm:w-40" disabled={isJoining}>
            {isJoining ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {isJoining ? "Joining" : "Join my home"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
