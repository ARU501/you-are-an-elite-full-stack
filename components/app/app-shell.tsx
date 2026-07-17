"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  Crown,
  CreditCard,
  Home,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/app/theme-toggle";
import { UpgradeDialog } from "@/components/app/upgrade-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUnreadMessageCount } from "@/lib/role-data";
import { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const landlordNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/applications", label: "Applications", icon: Users },
  { href: "/tenants", label: "Tenants", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

interface AppShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function AppShell({ title, description, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAppStore((state) => state.currentUser);
  const openUpgrade = useAppStore((state) => state.setUpgradeDialogOpen);
  const logout = useAppStore((state) => state.logout);
  const unreadCount = useAppStore((state) => getUnreadMessageCount(state));

  if (!currentUser) {
    return null;
  }

  const navItems = landlordNav;
  const isFreeLandlord = currentUser.tier === "free";

  return (
    <main className="min-h-screen pb-28 lg:pb-6">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <Card className="sticky top-4 overflow-hidden border-white/60 bg-white/85 shadow-glow dark:border-white/10 dark:bg-card/85">
              <CardContent className="space-y-6 p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Link href="/" className="font-heading text-2xl font-semibold">
                      LandlordForge
                    </Link>
                    <Badge variant="secondary">PWA</Badge>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{currentUser.name}</p>
                        <p className="text-sm text-muted-foreground">Landlord workspace</p>
                      </div>
                    </div>
                  </div>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const active = isActive(pathname, item.href);
                    const showUnread = item.href === "/messages" && unreadCount > 0;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition",
                          active
                            ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                            : "border-border/70 bg-background/70 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </span>
                        {showUnread ? (
                          <span
                            className={cn(
                              "inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold",
                              active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-primary/10 text-primary",
                            )}
                          >
                            {unreadCount}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>

                {isFreeLandlord ? (
                  <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-semibold">Upgrade to Pro - $19/mo</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Unlock unlimited landlord messages, broadcast inbox, more properties, and live cashflow reports.
                      </p>
                      <Button className="w-full" onClick={() => openUpgrade(true)}>
                        <Crown className="h-4 w-4" />
                        Unlock Pro
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </aside>

          <div className="space-y-4">
            <Card className="overflow-hidden border-white/60 bg-white/85 shadow-glow dark:border-white/10 dark:bg-card/85">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="default">Landlord</Badge>
                      <Badge variant={currentUser.tier === "pro" ? "success" : "outline"}>
                        {currentUser.tier === "pro" ? "Pro" : "Free"}
                      </Badge>
                    </div>
                    <div>
                      <h1 className="font-heading text-3xl font-semibold text-balance sm:text-4xl">{title}</h1>
                      <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Button
                      variant="outline"
                      onClick={async () => {
                        await logout();
                        toast.success("Signed out.");
                        router.push("/");
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>

                {isFreeLandlord ? (
                  <div className="rounded-3xl border border-border/70 bg-background/70 p-4 lg:hidden">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">Upgrade to Pro - $19/mo</p>
                        <p className="text-sm text-muted-foreground">
                          Unlimited landlord messages, broadcast, and reports.
                        </p>
                      </div>
                      <Button onClick={() => openUpgrade(true)}>Upgrade</Button>
                    </div>
                  </div>
                ) : null}

                {children}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1rem)] max-w-xl -translate-x-1/2 lg:hidden">
        <div className="overflow-x-auto rounded-3xl border border-border/70 bg-background/90 px-2 py-2 shadow-xl backdrop-blur">
          <div className="flex min-w-max items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              const showUnread = item.href === "/messages" && unreadCount > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex min-w-[92px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {showUnread ? (
                    <span className="absolute right-2 top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {isFreeLandlord ? (
        <div className="fixed bottom-24 right-4 z-40 hidden lg:block">
          <Button variant="premium" size="lg" className="rounded-full shadow-glow" onClick={() => openUpgrade(true)}>
            <Crown className="h-4 w-4" />
            Upgrade to Pro
          </Button>
        </div>
      ) : null}

      <UpgradeDialog />
    </main>
  );
}
