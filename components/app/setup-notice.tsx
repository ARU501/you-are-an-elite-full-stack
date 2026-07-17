"use client";

import { DatabaseZap } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-xl border-primary/20">
        <CardHeader>
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <DatabaseZap className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Connect your backend to finish setup</CardTitle>
          <CardDescription>
            LandlordForge now runs on a real Supabase backend. Add your project keys to go live.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Create a free project at <span className="font-medium">supabase.com</span>.
            </li>
            <li>
              In the Supabase <span className="font-medium">SQL Editor</span>, run the migration file{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">supabase/migrations/001_landlordforge_schema.sql</code>.
            </li>
            <li>
              Copy <span className="font-medium">Project URL</span> and <span className="font-medium">anon key</span>{" "}
              from Settings &gt; API into a <code className="rounded bg-muted px-1.5 py-0.5">.env.local</code> file:
              <pre className="mt-2 overflow-x-auto rounded-xl bg-muted p-3 text-xs">
                {"NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY"}
              </pre>
            </li>
            <li>Restart the dev server and reload this page.</li>
          </ol>
          <p className="text-muted-foreground">
            The full walkthrough (including Stripe rent payments) lives in <span className="font-medium">SETUP.md</span>{" "}
            at the repo root.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
