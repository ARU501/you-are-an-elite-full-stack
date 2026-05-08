"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createDemoState } from "@/lib/demo-data";
import {
  ActivityItem,
  AppMode,
  AppTab,
  ContactItem,
  ExpenseDraft,
  JobDraft,
  PaymentItem,
  PersistedAppData,
  PropertyDraft,
  TaskDraft,
  TaskStatus,
  UserProfile,
} from "@/lib/types";

export const APP_STORAGE_KEY = "landlordforge-store";
const FREE_LIMIT = 2;

type ActionResult = {
  ok: boolean;
  message: string;
};

type AppStore = PersistedAppData & {
  hasHydrated: boolean;
  upgradeDialogOpen: boolean;
  setHasHydrated: (value: boolean) => void;
  setActiveTab: (tab: AppTab) => void;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  setSelectedContactId: (contactId: string | null) => void;
  setUpgradeDialogOpen: (value: boolean) => void;
  replacePersistedData: (data: PersistedAppData) => void;
  login: (email: string, password: string) => ActionResult;
  demoLogin: () => void;
  logout: () => void;
  upgradeToPro: () => void;
  addProperty: (draft: PropertyDraft) => ActionResult;
  updateProperty: (id: string, draft: PropertyDraft) => ActionResult;
  addJob: (draft: JobDraft) => ActionResult;
  updateJob: (id: string, draft: JobDraft) => ActionResult;
  markPaymentPaid: (paymentId: string) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTask: (draft: TaskDraft) => void;
  addExpense: (draft: ExpenseDraft) => void;
  simulatePush: (taskId: string) => string;
};

const baseState = createDemoState();

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function nextDueDate(day: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  date.setDate(Math.min(Math.max(day, 1), 28));
  return date.toISOString();
}

function toActivity(title: string, detail: string, type: ActivityItem["type"]): ActivityItem {
  return {
    id: createId("activity"),
    title,
    detail,
    timestamp: new Date().toISOString(),
    type,
  };
}

function pushActivity(activities: ActivityItem[], activity: ActivityItem) {
  return [activity, ...activities].slice(0, 14);
}

function updateLinkedContact(contacts: ContactItem[], recordId: string, nextName: string, nextLabel: string) {
  return contacts.map((contact) =>
    contact.linkedRecordId === recordId
      ? {
          ...contact,
          displayName: nextName,
          label: nextLabel,
        }
      : contact,
  );
}

function refreshPaymentStatus(payment: PaymentItem): PaymentItem {
  if (payment.status === "paid") {
    return payment;
  }

  return new Date(payment.dueDate).getTime() < Date.now() ? { ...payment, status: "overdue" } : payment;
}

function normalizeUser(user: UserProfile): UserProfile {
  return {
    ...user,
    email: user.email.toLowerCase(),
  };
}

export function selectPersistedData(state: AppStore): PersistedAppData {
  return {
    activeTab: state.activeTab,
    mode: state.mode,
    selectedContactId: state.selectedContactId,
    user: state.user,
    properties: state.properties,
    jobs: state.jobs,
    contacts: state.contacts,
    payments: state.payments,
    tasks: state.tasks,
    expenses: state.expenses,
    activities: state.activities,
    lastPushAt: state.lastPushAt,
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...baseState,
      hasHydrated: false,
      upgradeDialogOpen: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setActiveTab: (activeTab) => set({ activeTab }),
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set((state) => ({
          mode: state.mode === "landlord" ? "contractor" : "landlord",
        })),
      setSelectedContactId: (selectedContactId) => set({ selectedContactId }),
      setUpgradeDialogOpen: (upgradeDialogOpen) => set({ upgradeDialogOpen }),
      replacePersistedData: (data) =>
        set((state) => ({
          ...state,
          ...data,
          hasHydrated: true,
        })),
      login: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail !== "demo@landlordforge.com" || password !== "demo123") {
          return { ok: false, message: "Use demo@landlordforge.com / demo123" };
        }

        set((state) => ({
          user: normalizeUser({
            ...state.user,
            email: normalizedEmail,
            isAuthenticated: true,
          }),
          activities: pushActivity(
            state.activities,
            toActivity("Demo login successful", "The workspace was opened from the demo account.", "auth"),
          ),
        }));

        return { ok: true, message: "Welcome back." };
      },
      demoLogin: () =>
        set((state) => ({
          user: normalizeUser({
            ...state.user,
            email: "demo@landlordforge.com",
            isAuthenticated: true,
          }),
          activities: pushActivity(
            state.activities,
            toActivity("Demo workspace opened", "The landing page CTA unlocked the dashboard.", "auth"),
          ),
        })),
      logout: () =>
        set((state) => ({
          user: {
            ...state.user,
            isAuthenticated: false,
          },
          activeTab: "dashboard",
        })),
      upgradeToPro: () =>
        set((state) => ({
          user: {
            ...state.user,
            tier: "pro",
          },
          upgradeDialogOpen: false,
          activities: pushActivity(
            state.activities,
            toActivity("Pro unlocked", "Unlimited records, reports, and smart predictions are now available.", "system"),
          ),
        })),
      addProperty: (draft) => {
        const state = get();
        if (state.user.tier === "free" && state.properties.length >= FREE_LIMIT) {
          set({ upgradeDialogOpen: true });
          return { ok: false, message: "Free plans are capped at 2 properties." };
        }

        const propertyId = createId("property");
        const contactId = createId("contact");
        const newProperty = {
          id: propertyId,
          ...draft,
        };
        const newContact: ContactItem = {
          id: contactId,
          linkedRecordId: propertyId,
          kind: "tenant",
          displayName: draft.tenantName,
          email: "new-tenant@example.com",
          phone: "(555) 000-0000",
          label: `${draft.address} tenant`,
          notes: draft.note ?? "New tenant record created from property setup.",
          paymentHistory: [],
        };
        const newPayment: PaymentItem = {
          id: createId("payment"),
          kind: "rent",
          recordId: propertyId,
          contactId,
          label: `${draft.address} rent`,
          amount: draft.rentAmount,
          dueDate: nextDueDate(draft.dueDay),
          status: "due",
        };

        set((current) => ({
          properties: [newProperty, ...current.properties],
          contacts: [newContact, ...current.contacts],
          payments: [newPayment, ...current.payments],
          activities: pushActivity(
            current.activities,
            toActivity("Property added", `${draft.address} is now tracked inside your rent board.`, "record"),
          ),
        }));

        return { ok: true, message: "Property saved." };
      },
      updateProperty: (id, draft) => {
        set((state) => ({
          properties: state.properties.map((property) => (property.id === id ? { ...property, ...draft } : property)),
          contacts: updateLinkedContact(state.contacts, id, draft.tenantName, `${draft.address} tenant`),
          payments: state.payments.map((payment) =>
            payment.recordId === id ? { ...payment, label: `${draft.address} rent`, amount: draft.rentAmount } : payment,
          ),
          activities: pushActivity(
            state.activities,
            toActivity("Property updated", `${draft.address} details were refreshed.`, "record"),
          ),
        }));

        return { ok: true, message: "Property updated." };
      },
      addJob: (draft) => {
        const state = get();
        if (state.user.tier === "free" && state.jobs.length >= FREE_LIMIT) {
          set({ upgradeDialogOpen: true });
          return { ok: false, message: "Free plans are capped at 2 jobs." };
        }

        const jobId = createId("job");
        const contactId = createId("contact");

        set((current) => ({
          jobs: [{ id: jobId, ...draft }, ...current.jobs],
          contacts: [
            {
              id: contactId,
              linkedRecordId: jobId,
              kind: "client",
              displayName: draft.clientName,
              email: "client@example.com",
              phone: "(555) 000-0000",
              label: "Client account",
              notes: draft.note ?? "New client record created from job setup.",
              paymentHistory: [],
            },
            ...current.contacts,
          ],
          payments: [
            {
              id: createId("payment"),
              kind: "invoice",
              recordId: jobId,
              contactId,
              label: `${draft.clientName} invoice`,
              amount: draft.amount,
              dueDate: draft.dueDate,
              status: "due",
            },
            ...current.payments,
          ],
          activities: pushActivity(
            current.activities,
            toActivity("Job added", `${draft.clientName} was added to your active pipeline.`, "record"),
          ),
        }));

        return { ok: true, message: "Job saved." };
      },
      updateJob: (id, draft) => {
        set((state) => ({
          jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...draft } : job)),
          contacts: updateLinkedContact(state.contacts, id, draft.clientName, "Client account"),
          payments: state.payments.map((payment) =>
            payment.recordId === id ? { ...payment, label: `${draft.clientName} invoice`, amount: draft.amount } : payment,
          ),
          activities: pushActivity(
            state.activities,
            toActivity("Job updated", `${draft.clientName} details were refreshed.`, "record"),
          ),
        }));

        return { ok: true, message: "Job updated." };
      },
      markPaymentPaid: (paymentId) =>
        set((state) => ({
          payments: state.payments.map((payment) =>
            payment.id === paymentId
              ? {
                  ...payment,
                  status: "paid",
                  paidAt: new Date().toISOString(),
                }
              : refreshPaymentStatus(payment),
          ),
          contacts: state.contacts.map((contact) => {
            const payment = state.payments.find((entry) => entry.id === paymentId);
            if (!payment || contact.id !== payment.contactId) {
              return contact;
            }

            return {
              ...contact,
              paymentHistory: [
                {
                  id: createId("history"),
                  date: new Date().toISOString(),
                  amount: payment.amount,
                  status: "paid" as const,
                  note: `${payment.label} marked paid.`,
                },
                ...contact.paymentHistory,
              ].slice(0, 8),
            };
          }),
          activities: pushActivity(
            state.activities,
            toActivity("Payment marked paid", "Cashflow was refreshed for this month.", "payment"),
          ),
        })),
      updateTaskStatus: (taskId, status) =>
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
          activities: pushActivity(
            state.activities,
            toActivity("Task status changed", `A task was moved to ${status.replace("-", " ")}.`, "task"),
          ),
        })),
      addTask: (draft) =>
        set((state) => ({
          tasks: [
            {
              id: createId("task"),
              mode: state.mode,
              status: "open",
              ...draft,
            },
            ...state.tasks,
          ],
          activities: pushActivity(
            state.activities,
            toActivity("Task created", `${draft.title} was added to the queue.`, "task"),
          ),
        })),
      addExpense: (draft) =>
        set((state) => ({
          expenses: [
            {
              id: createId("expense"),
              ...draft,
            },
            ...state.expenses,
          ],
          activities: pushActivity(
            state.activities,
            toActivity("Expense logged", `${draft.title} was added to your monthly summary.`, "expense"),
          ),
        })),
      simulatePush: (taskId) => {
        const task = get().tasks.find((entry) => entry.id === taskId);
        if (!task) {
          return "Task not found.";
        }

        set((state) => ({
          lastPushAt: new Date().toISOString(),
          activities: pushActivity(
            state.activities,
            toActivity("Push simulated", `${task.title} triggered a mobile-style notification.`, "system"),
          ),
        }));

        return `${task.title} pushed to the phone lockscreen simulation.`;
      },
    }),
    {
      name: APP_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: selectPersistedData,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
