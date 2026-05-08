"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  ClipboardList,
  Hammer,
  House,
  LogOut,
  Receipt,
  Users,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { ContactsPanel } from "@/components/app/contacts-panel";
import { ExpensesPanel } from "@/components/app/expenses-panel";
import { OverviewPanel } from "@/components/app/overview-panel";
import { RecordsPanel } from "@/components/app/records-panel";
import { ReportsPanel } from "@/components/app/reports-panel";
import { TasksPanel } from "@/components/app/tasks-panel";
import { BillingPanel } from "@/components/app/billing-panel";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UpgradeDialog } from "@/components/app/upgrade-dialog";
import { UpgradeFab } from "@/components/app/upgrade-fab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatRelativeTime } from "@/lib/formatters";
import { AppTab } from "@/lib/types";
import { useAppStore } from "@/store/app-store";

const tabs: Array<{ value: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: "dashboard", label: "Dashboard", icon: House },
  { value: "records", label: "Properties / Jobs", icon: Building2 },
  { value: "contacts", label: "Tenants / Clients", icon: Users },
  { value: "billing", label: "Rent / Invoicing", icon: CircleDollarSign },
  { value: "tasks", label: "Maintenance / Tasks", icon: ClipboardList },
  { value: "expenses", label: "Expenses", icon: Receipt },
  { value: "reports", label: "Reports", icon: BarChart3 },
];

export function AppShell() {
  const [mobileNavOpen] = useState(true);
  const activeTab = useAppStore((state) => state.activeTab);
  const mode = useAppStore((state) => state.mode);
  const user = useAppStore((state) => state.user);
  const lastPushAt = useAppStore((state) => state.lastPushAt);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const toggleMode = useAppStore((state) => state.toggleMode);
  const logout = useAppStore((state) => state.logout);

  return (
    <main className="pb-28 lg:pb-10">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <Card className="overflow-hidden border-white/60 bg-white/80 shadow-glow dark:border-white/10 dark:bg-card/80">
          <CardContent className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/" className="font-heading text-2xl font-semibold">
                    LandlordForge
                  </Link>
                  <Badge variant="secondary">Offline ready</Badge>
                  <Badge variant={user.tier === "pro" ? "success" : "outline"}>{user.tier === "pro" ? "Pro" : "Free"}</Badge>
                </div>
                <div className="space-y-2">
                  <h1 className="font-heading text-3xl font-semibold text-balance sm:text-4xl">
                    Run the business from one calm screen.
                  </h1>
                  <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Track rent, jobs, tasks, expenses, and collections without making the workflow feel heavy.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="rounded-full border border-border/70 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                  {lastPushAt ? `Last push ${formatRelativeTime(lastPushAt)}` : "Push simulation idle"}
                </div>
                <ThemeToggle />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    toast.success("Demo session closed.");
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active operating mode</p>
                    <p className="font-heading text-2xl font-semibold">
                      {mode === "landlord" ? "Landlord Mode" : "Contractor Mode"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 rounded-full border border-border/70 bg-muted/40 px-4 py-2">
                    <Building2 className={`h-4 w-4 ${mode === "landlord" ? "text-primary" : "text-muted-foreground"}`} />
                    <Switch checked={mode === "contractor"} onCheckedChange={() => toggleMode()} />
                    <Hammer className={`h-4 w-4 ${mode === "contractor" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <WifiOff className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Local-first sync</p>
                    <p className="text-sm text-muted-foreground">LocalStorage + IndexedDB snapshot mirror</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AppTab)} className="space-y-4">
              <div className="overflow-x-auto pb-1">
                <TabsList className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="rounded-full border border-border/70 bg-background/70 px-4 py-2 data-[state=active]:border-transparent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <tab.icon className="mr-2 h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="dashboard">
                <OverviewPanel />
              </TabsContent>
              <TabsContent value="records">
                <RecordsPanel />
              </TabsContent>
              <TabsContent value="contacts">
                <ContactsPanel />
              </TabsContent>
              <TabsContent value="billing">
                <BillingPanel />
              </TabsContent>
              <TabsContent value="tasks">
                <TasksPanel />
              </TabsContent>
              <TabsContent value="expenses">
                <ExpensesPanel />
              </TabsContent>
              <TabsContent value="reports">
                <ReportsPanel />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {user.tier !== "pro" && <UpgradeFab />}
      <UpgradeDialog />

      {mobileNavOpen && (
        <div className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1rem)] max-w-4xl -translate-x-1/2 lg:hidden">
          <div className="overflow-x-auto rounded-3xl border border-border/70 bg-background/85 px-2 py-2 shadow-xl backdrop-blur">
            <div className="flex min-w-max items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex min-w-[92px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                    activeTab === tab.value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label.split(" / ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
