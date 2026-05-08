import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="surface-grid min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
            Launch-ready MVP
          </div>
          <div className="space-y-4">
            <h1 className="font-heading text-5xl font-semibold leading-tight">
              Everything a one-person property or trade business needs on day one.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              LandlordForge keeps rent tracking, invoices, tasks, expenses, and reporting close enough to use daily.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
              <p className="text-sm text-muted-foreground">Pricing</p>
              <p className="mt-2 font-heading text-3xl font-semibold">Free / Pro $19</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-5">
              <p className="text-sm text-muted-foreground">Free limit</p>
              <p className="mt-2 font-heading text-3xl font-semibold">2 records</p>
            </div>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
