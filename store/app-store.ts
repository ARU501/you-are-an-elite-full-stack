"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createDemoState } from "@/lib/demo-data";
import { getCurrentTenant, getLandlordAccount, getLandlordSentMessageCount, getTenantAccount } from "@/lib/role-data";
import {
  Account,
  ActionResult,
  ActivityItem,
  ExpenseDraft,
  MaintenanceRequestDraft,
  MaintenanceRequestItem,
  PersistedAppData,
  PropertyDraft,
  RequestStatus,
  SessionUser,
} from "@/lib/types";

export const APP_STORAGE_KEY = "landlordforge-store-v2";
const FREE_PROPERTY_LIMIT = 2;
const FREE_LANDLORD_MESSAGE_LIMIT = 10;

type AppStore = PersistedAppData & {
  hasHydrated: boolean;
  upgradeDialogOpen: boolean;
  setHasHydrated: (value: boolean) => void;
  setUpgradeDialogOpen: (value: boolean) => void;
  replacePersistedData: (data: PersistedAppData) => void;
  login: (role: Account["role"], email: string, password: string) => ActionResult;
  logout: () => void;
  upgradeToPro: () => void;
  setSelectedConversationTenantId: (tenantId: string | null) => void;
  markConversationRead: (tenantId?: string) => void;
  sendMessage: (content: string, tenantId?: string) => ActionResult;
  broadcastMessage: (content: string) => ActionResult;
  addProperty: (draft: PropertyDraft) => ActionResult;
  updateProperty: (propertyId: string, draft: PropertyDraft) => ActionResult;
  addExpense: (draft: ExpenseDraft) => ActionResult;
  submitMaintenanceRequest: (draft: MaintenanceRequestDraft) => ActionResult;
  updateRequestStatus: (requestId: string, status: RequestStatus) => ActionResult;
  markPaymentPaid: (paymentId: string) => ActionResult;
  payRentForCurrentTenant: () => ActionResult;
};

const baseState = createDemoState();

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function trimContent(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function toSessionUser(account: Account): SessionUser {
  return {
    id: account.id,
    role: account.role,
    name: account.name,
    email: account.email.toLowerCase(),
    tier: account.tier,
    linkedPropertyId: account.linkedPropertyId,
    linkedTenantId: account.linkedTenantId,
  };
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

function prependActivity(activities: ActivityItem[], activity: ActivityItem) {
  return [activity, ...activities].slice(0, 18);
}

function normalizeCredentials(email: string) {
  return email.trim().toLowerCase();
}

function syncCurrentUser(accounts: Account[], currentUser: SessionUser | null) {
  if (!currentUser) {
    return null;
  }

  const refreshed = accounts.find((account) => account.id === currentUser.id);
  return refreshed ? toSessionUser(refreshed) : null;
}

export function selectPersistedData(state: AppStore): PersistedAppData {
  return {
    currentUser: state.currentUser,
    accounts: state.accounts,
    properties: state.properties,
    tenants: state.tenants,
    payments: state.payments,
    requests: state.requests,
    expenses: state.expenses,
    messages: state.messages,
    activities: state.activities,
    selectedConversationTenantId: state.selectedConversationTenantId,
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...baseState,
      hasHydrated: false,
      upgradeDialogOpen: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setUpgradeDialogOpen: (upgradeDialogOpen) => set({ upgradeDialogOpen }),
      replacePersistedData: (data) =>
        set((state) => ({
          ...state,
          ...data,
          hasHydrated: true,
        })),
      login: (role, email, password) => {
        const normalizedEmail = normalizeCredentials(email);
        const account = get().accounts.find(
          (entry) =>
            entry.role === role &&
            normalizeCredentials(entry.email) === normalizedEmail &&
            entry.password === password,
        );

        if (!account) {
          return {
            ok: false,
            message:
              role === "landlord"
                ? "Use landlord@demo.com / demo123"
                : "Use tenant@demo.com / demo123",
          };
        }

        set((state) => ({
          currentUser: toSessionUser(account),
          selectedConversationTenantId:
            role === "landlord" ? state.tenants[0]?.id ?? null : account.linkedTenantId ?? null,
          upgradeDialogOpen: role === "landlord" && account.tier === "free",
          activities: prependActivity(
            state.activities,
            toActivity(
              `${account.role === "landlord" ? "Landlord" : "Tenant"} login`,
              `${account.name} opened the ${account.role} workspace.`,
              "auth",
            ),
          ),
        }));

        return { ok: true, message: "Welcome back." };
      },
      logout: () => {
        const resetState = createDemoState();
        set({
          ...resetState,
          upgradeDialogOpen: false,
        });
      },
      upgradeToPro: () =>
        set((state) => {
          if (!state.currentUser) {
            return state;
          }

          const nextAccounts = state.accounts.map((account) =>
            account.id === state.currentUser?.id ? { ...account, tier: "pro" as const } : account,
          );

          return {
            accounts: nextAccounts,
            currentUser: syncCurrentUser(nextAccounts, state.currentUser),
            upgradeDialogOpen: false,
            activities: prependActivity(
              state.activities,
              toActivity(
                "Pro unlocked",
                "Unlimited landlord messaging, broadcast inbox, reports, and premium workspace controls are live.",
                "system",
              ),
            ),
          };
        }),
      setSelectedConversationTenantId: (selectedConversationTenantId) => set({ selectedConversationTenantId }),
      markConversationRead: (tenantId) =>
        set((state) => {
          const currentUser = state.currentUser;
          if (!currentUser) {
            return state;
          }

          const landlordAccount = getLandlordAccount(state);
          const selectedTenantId =
            tenantId ??
            (currentUser.role === "tenant" ? currentUser.linkedTenantId : state.selectedConversationTenantId);

          if (!selectedTenantId || !landlordAccount) {
            return state;
          }

          const tenantAccount = getTenantAccount(state, selectedTenantId);
          if (!tenantAccount) {
            return state;
          }

          const nextMessages = state.messages.map((message) => {
            const shouldMarkRead =
              currentUser.role === "landlord"
                ? message.from === tenantAccount.id && message.to === landlordAccount.id && !message.read
                : message.from === landlordAccount.id && message.to === currentUser.id && !message.read;

            return shouldMarkRead ? { ...message, read: true } : message;
          });

          return {
            messages: nextMessages,
          };
        }),
      sendMessage: (content, tenantId) => {
        const state = get();
        if (!state.currentUser) {
          return { ok: false, message: "Please log in first." };
        }

        const cleaned = trimContent(content);
        if (!cleaned) {
          return { ok: false, message: "Write a message first." };
        }

        const landlordAccount = getLandlordAccount(state);
        if (!landlordAccount) {
          return { ok: false, message: "Landlord account missing." };
        }

        if (
          state.currentUser.role === "landlord" &&
          state.currentUser.tier === "free" &&
          getLandlordSentMessageCount(state, state.currentUser) >= FREE_LANDLORD_MESSAGE_LIMIT
        ) {
          set({ upgradeDialogOpen: true });
          return { ok: false, message: "Free includes 10 landlord-sent messages. Upgrade to keep the inbox live." };
        }

        const targetTenantId =
          state.currentUser.role === "landlord"
            ? tenantId ?? state.selectedConversationTenantId
            : state.currentUser.linkedTenantId ?? null;

        if (!targetTenantId) {
          return { ok: false, message: "Select a tenant conversation first." };
        }

        const tenantAccount = getTenantAccount(state, targetTenantId);
        if (!tenantAccount) {
          return { ok: false, message: "Tenant account missing." };
        }

        const recipientId = state.currentUser.role === "landlord" ? tenantAccount.id : landlordAccount.id;

        set((current) => ({
          messages: [
            ...current.messages,
            {
              id: createId("message"),
              from: current.currentUser!.id,
              to: recipientId,
              content: cleaned,
              timestamp: new Date().toISOString(),
              read: false,
            },
          ],
          selectedConversationTenantId: targetTenantId,
          activities: prependActivity(
            current.activities,
            toActivity(
              "Message sent",
              current.currentUser?.role === "landlord"
                ? `A new message was sent to ${tenantAccount.name}.`
                : "Your landlord received a new tenant message.",
              "message",
            ),
          ),
        }));

        return { ok: true, message: "Message sent." };
      },
      broadcastMessage: (content) => {
        const state = get();
        if (!state.currentUser || state.currentUser.role !== "landlord") {
          return { ok: false, message: "Only landlords can broadcast." };
        }

        if (state.currentUser.tier !== "pro") {
          set({ upgradeDialogOpen: true });
          return { ok: false, message: "Broadcast is a Pro feature." };
        }

        const cleaned = trimContent(content);
        if (!cleaned) {
          return { ok: false, message: "Write a message first." };
        }

        set((current) => ({
          messages: [
            ...current.messages,
            ...current.tenants.map((tenant) => ({
              id: createId("message"),
              from: current.currentUser!.id,
              to: tenant.accountId,
              content: cleaned,
              timestamp: new Date().toISOString(),
              read: false,
            })),
          ],
          activities: prependActivity(
            current.activities,
            toActivity("Broadcast sent", "A one-to-many update was sent to every tenant inbox.", "message"),
          ),
        }));

        return { ok: true, message: "Broadcast delivered to all tenant threads." };
      },
      addProperty: (draft) => {
        const state = get();
        if (!state.currentUser || state.currentUser.role !== "landlord") {
          return { ok: false, message: "Only landlords can add properties." };
        }

        if (state.currentUser.tier === "free" && state.properties.length >= FREE_PROPERTY_LIMIT) {
          set({ upgradeDialogOpen: true });
          return { ok: false, message: "Free plans cap out at 2 properties. Upgrade to add more." };
        }

        set((current) => ({
          properties: [{ id: createId("property"), ...draft }, ...current.properties],
          activities: prependActivity(
            current.activities,
            toActivity("Property added", `${draft.address} ${draft.unitLabel} is now tracked in the portfolio.`, "property"),
          ),
        }));

        return { ok: true, message: "Property saved." };
      },
      updateProperty: (propertyId, draft) => {
        const state = get();
        if (!state.currentUser || state.currentUser.role !== "landlord") {
          return { ok: false, message: "Only landlords can edit properties." };
        }

        set((current) => ({
          properties: current.properties.map((property) =>
            property.id === propertyId ? { ...property, ...draft } : property,
          ),
          activities: prependActivity(
            current.activities,
            toActivity("Property updated", `${draft.address} ${draft.unitLabel} details were refreshed.`, "property"),
          ),
        }));

        return { ok: true, message: "Property updated." };
      },
      addExpense: (draft) => {
        const state = get();
        if (!state.currentUser || state.currentUser.role !== "landlord") {
          return { ok: false, message: "Only landlords can log expenses." };
        }

        set((current) => ({
          expenses: [{ id: createId("expense"), ...draft }, ...current.expenses],
          activities: prependActivity(
            current.activities,
            toActivity("Expense logged", `${draft.title} was added to the monthly summary.`, "expense"),
          ),
        }));

        return { ok: true, message: "Expense saved." };
      },
      submitMaintenanceRequest: (draft) => {
        const state = get();
        const currentTenant = getCurrentTenant(state);
        if (!state.currentUser || state.currentUser.role !== "tenant" || !currentTenant) {
          return { ok: false, message: "Only tenants can submit maintenance requests." };
        }

        const landlordAccount = getLandlordAccount(state);
        if (!landlordAccount) {
          return { ok: false, message: "Landlord account missing." };
        }

        const createdRequest: MaintenanceRequestItem = {
          id: createId("request"),
          propertyId: currentTenant.propertyId,
          tenantId: currentTenant.id,
          title: draft.title,
          detail: draft.detail,
          priority: draft.priority,
          status: "open",
          dueDate: draft.dueDate,
          createdAt: new Date().toISOString(),
          source: "tenant",
        };

        set((current) => ({
          requests: [createdRequest, ...current.requests],
          messages: [
            ...current.messages,
            {
              id: createId("message"),
              from: current.currentUser!.id,
              to: landlordAccount.id,
              content: `Maintenance request: ${draft.title} - ${draft.detail}`,
              timestamp: new Date().toISOString(),
              read: false,
            },
          ],
          activities: prependActivity(
            current.activities,
            toActivity("Request submitted", `${draft.title} was added to the landlord request queue.`, "request"),
          ),
        }));

        return { ok: true, message: "Request submitted." };
      },
      updateRequestStatus: (requestId, status) => {
        const state = get();
        if (!state.currentUser || state.currentUser.role !== "landlord") {
          return { ok: false, message: "Only landlords can update request status." };
        }

        set((current) => ({
          requests: current.requests.map((request) => (request.id === requestId ? { ...request, status } : request)),
          activities: prependActivity(
            current.activities,
            toActivity("Request updated", `A maintenance request moved to ${status.replace("-", " ")}.`, "request"),
          ),
        }));

        return { ok: true, message: "Request updated." };
      },
      markPaymentPaid: (paymentId) => {
        const state = get();
        if (!state.currentUser || state.currentUser.role !== "landlord") {
          return { ok: false, message: "Only landlords can record payments." };
        }

        const payment = state.payments.find((entry) => entry.id === paymentId);
        if (!payment) {
          return { ok: false, message: "Payment record not found." };
        }

        if (payment.status === "paid") {
          return { ok: false, message: "That payment is already marked paid." };
        }

        const tenant = state.tenants.find((entry) => entry.id === payment.tenantId);
        const tenantAccount = tenant ? state.accounts.find((entry) => entry.id === tenant.accountId) : undefined;

        set((current) => ({
          payments: current.payments.map((entry) =>
            entry.id === paymentId
              ? {
                  ...entry,
                  status: "paid",
                  paidAt: new Date().toISOString(),
                }
              : entry,
          ),
          messages: tenantAccount
            ? [
                ...current.messages,
                {
                  id: createId("message"),
                  from: current.currentUser!.id,
                  to: tenantAccount.id,
                  content: `Rent recorded as paid for ${payment.label}.`,
                  timestamp: new Date().toISOString(),
                  read: false,
                },
              ]
            : current.messages,
          activities: prependActivity(
            current.activities,
            toActivity(
              "Payment recorded",
              tenant ? `${tenant.name}'s payment for ${payment.label} was marked paid.` : `${payment.label} was marked paid.`,
              "payment",
            ),
          ),
        }));

        return { ok: true, message: "Payment recorded." };
      },
      payRentForCurrentTenant: () => {
        const state = get();
        const currentTenant = getCurrentTenant(state);
        const landlordAccount = getLandlordAccount(state);
        if (!state.currentUser || state.currentUser.role !== "tenant" || !currentTenant || !landlordAccount) {
          return { ok: false, message: "Only tenants can mark rent paid." };
        }

        const outstandingPayment = state.payments
          .filter((payment) => payment.tenantId === currentTenant.id && payment.status !== "paid")
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

        if (!outstandingPayment) {
          return { ok: false, message: "No outstanding rent to pay right now." };
        }

        set((current) => ({
          payments: current.payments.map((payment) =>
            payment.id === outstandingPayment.id
              ? {
                  ...payment,
                  status: "paid",
                  paidAt: new Date().toISOString(),
                }
              : payment,
          ),
          messages: [
            ...current.messages,
            {
              id: createId("message"),
              from: current.currentUser!.id,
              to: landlordAccount.id,
              content: `I just paid ${outstandingPayment.label}. Thanks.`,
              timestamp: new Date().toISOString(),
              read: false,
            },
          ],
          activities: prependActivity(
            current.activities,
            toActivity("Rent paid", `${currentTenant.name} marked the current rent as paid.`, "payment"),
          ),
        }));

        return { ok: true, message: "Rent marked paid." };
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


