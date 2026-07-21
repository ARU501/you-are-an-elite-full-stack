"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { create } from "zustand";

import {
  createReceiptNumber,
  getCollectedAmountCents,
  getSavedPaymentLabel,
  getTotalDueCents,
  resolveBaseAmountCents,
} from "@/lib/payment-processing";
import { getCurrentTenant, getLandlordAccount, getLandlordSentMessageCount, getTenantAccount } from "@/lib/role-data";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  MessageRow,
  PaymentProfileRow,
  ProfileRow,
  PropertyRow,
  RentPaymentRow,
  mapListing,
  mapMessage,
  mapPayment,
  mapPaymentProfile,
  mapProperty,
} from "@/lib/supabase/mappers";
import { loadWorkspace } from "@/lib/supabase/workspace";
import {
  Account,
  ActionResult,
  ApplicationDraft,
  ApplicationItem,
  ExpenseDraft,
  ListingItem,
  MaintenanceRequestDraft,
  PaymentProfileDraft,
  PersistedAppData,
  PropertyDraft,
  RequestStatus,
  Role,
  SignupDraft,
  TenantPaymentSettlement,
} from "@/lib/types";

const FREE_PROPERTY_LIMIT = 2;
const FREE_LANDLORD_MESSAGE_LIMIT = 10;

type PaymentEventOptions = {
  paymentId?: string;
  stripeEventId?: string;
};

type AppStore = PersistedAppData & {
  applications: ApplicationItem[];
  listings: ListingItem[];
  hasHydrated: boolean;
  supabaseConfigured: boolean;
  upgradeDialogOpen: boolean;
  setUpgradeDialogOpen: (value: boolean) => void;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  login: (role: Role, email: string, password: string) => Promise<ActionResult>;
  signup: (role: Role, draft: SignupDraft) => Promise<ActionResult>;
  logout: () => Promise<void>;
  upgradeToPro: () => Promise<ActionResult>;
  setSelectedConversationTenantId: (tenantId: string | null) => void;
  markConversationRead: (tenantId?: string) => Promise<void>;
  sendMessage: (content: string, tenantId?: string) => Promise<ActionResult>;
  broadcastMessage: (content: string) => Promise<ActionResult>;
  addProperty: (draft: PropertyDraft) => Promise<ActionResult>;
  updateProperty: (propertyId: string, draft: PropertyDraft) => Promise<ActionResult>;
  addExpense: (draft: ExpenseDraft) => Promise<ActionResult>;
  submitMaintenanceRequest: (draft: MaintenanceRequestDraft) => Promise<ActionResult>;
  updateRequestStatus: (requestId: string, status: RequestStatus) => Promise<ActionResult>;
  markPaymentPaid: (paymentId: string) => Promise<ActionResult>;
  updateCurrentTenantPaymentProfile: (draft: PaymentProfileDraft) => Promise<ActionResult>;
  recordPaymentEvent: (eventType: string, payload: Record<string, unknown>, options?: PaymentEventOptions) => void;
  payRentForCurrentTenant: (settlement?: TenantPaymentSettlement) => Promise<ActionResult>;
  fetchListings: () => Promise<ActionResult>;
  submitApplication: (draft: ApplicationDraft) => Promise<ActionResult>;
  decideApplication: (applicationId: string, decision: "approved" | "declined") => Promise<ActionResult>;
  generatePropertyInviteCode: (propertyId: string) => Promise<ActionResult>;
  joinPropertyWithCode: (code: string) => Promise<ActionResult>;
};

function emptyData(): PersistedAppData & { applications: ApplicationItem[]; listings: ListingItem[] } {
  return {
    currentUser: null,
    accounts: [],
    properties: [],
    tenants: [],
    payments: [],
    paymentProfiles: [],
    paymentEvents: [],
    requests: [],
    expenses: [],
    messages: [],
    activities: [],
    applications: [],
    listings: [],
    selectedConversationTenantId: null,
  };
}

function trimContent(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function failure(message: string): ActionResult {
  return { ok: false, message };
}

function isPendingAccountId(accountId: string) {
  return accountId.startsWith("pending-");
}

let initializePromise: Promise<void> | null = null;
let realtimeChannel: RealtimeChannel | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let authListenerBound = false;

export const useAppStore = create<AppStore>()((set, get) => {
  function getSupabase(): SupabaseClient | null {
    if (!isSupabaseConfigured()) {
      return null;
    }
    return createClient();
  }

  async function fetchProfile(supabase: SupabaseClient, userId: string): Promise<ProfileRow | null> {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    return (data as ProfileRow | null) ?? null;
  }

  async function loadForProfile(supabase: SupabaseClient, profile: ProfileRow) {
    const workspace = await loadWorkspace(supabase, profile);
    set((state) => ({
      ...workspace,
      listings: state.listings,
      selectedConversationTenantId:
        state.selectedConversationTenantId &&
        workspace.tenants.some((tenant) => tenant.id === state.selectedConversationTenantId)
          ? state.selectedConversationTenantId
          : workspace.tenants[0]?.id ?? null,
      hasHydrated: true,
      supabaseConfigured: true,
    }));
    subscribeRealtime(supabase);
  }

  function scheduleRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      void get().refresh();
    }, 400);
  }

  function subscribeRealtime(supabase: SupabaseClient) {
    if (realtimeChannel) {
      return;
    }

    realtimeChannel = supabase
      .channel("workspace-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "rent_payments" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "maintenance_requests" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "rental_applications" }, scheduleRefresh)
      .subscribe();
  }

  function teardownRealtime() {
    if (realtimeChannel) {
      void realtimeChannel.unsubscribe();
      realtimeChannel = null;
    }
  }

  async function logActivity(
    title: string,
    detail: string,
    type: "payment" | "request" | "expense" | "message" | "property" | "auth" | "system",
    tenancyId?: string | null,
  ) {
    const supabase = getSupabase();
    const state = get();
    if (!supabase || !state.currentUser) {
      return;
    }

    const landlordAccount = getLandlordAccount(state);
    const landlordId = state.currentUser.role === "landlord" ? state.currentUser.id : landlordAccount?.id;
    const scopedTenancy =
      tenancyId ?? (state.currentUser.role === "tenant" ? state.currentUser.linkedTenantId ?? null : null);
    if (!landlordId) {
      return;
    }
    if (state.currentUser.role === "tenant" && !scopedTenancy) {
      return;
    }

    await supabase.from("activities").insert({
      landlord_id: landlordId,
      tenancy_id: scopedTenancy,
      title,
      detail,
      type,
    });
  }

  async function insertMessage(tenancyId: string, recipientId: string, content: string): Promise<ActionResult> {
    const supabase = getSupabase();
    const state = get();
    if (!supabase || !state.currentUser) {
      return failure("Please log in first.");
    }

    const landlordAccount = getLandlordAccount(state);
    const landlordId = state.currentUser.role === "landlord" ? state.currentUser.id : landlordAccount?.id;
    if (!landlordId) {
      return failure("Landlord account missing.");
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        landlord_id: landlordId,
        tenancy_id: tenancyId,
        sender_id: state.currentUser.id,
        recipient_id: recipientId,
        content,
      })
      .select()
      .single();

    if (error) {
      return failure(error.message);
    }

    set((current) => ({ messages: [...current.messages, mapMessage(data as MessageRow)] }));
    return { ok: true, message: "Message sent." };
  }

  return {
    ...emptyData(),
    hasHydrated: false,
    supabaseConfigured: true,
    upgradeDialogOpen: false,
    setUpgradeDialogOpen: (upgradeDialogOpen) => set({ upgradeDialogOpen }),

    initialize: async () => {
      if (initializePromise) {
        return initializePromise;
      }

      initializePromise = (async () => {
        const supabase = getSupabase();
        if (!supabase) {
          set({ hasHydrated: true, supabaseConfigured: false });
          return;
        }

        if (!authListenerBound) {
          authListenerBound = true;
          supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_OUT") {
              teardownRealtime();
              set({ ...emptyData(), hasHydrated: true, supabaseConfigured: true, upgradeDialogOpen: false });
            }
          });
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          set({ hasHydrated: true, supabaseConfigured: true });
          return;
        }

        const profile = await fetchProfile(supabase, user.id);
        if (!profile) {
          set({ hasHydrated: true, supabaseConfigured: true });
          return;
        }

        await loadForProfile(supabase, profile);
      })().finally(() => {
        initializePromise = null;
      });

      return initializePromise;
    },

    refresh: async () => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser) {
        return;
      }

      const profile = await fetchProfile(supabase, state.currentUser.id);
      if (profile) {
        await loadForProfile(supabase, profile);
      }
    },

    login: async (role, email, password) => {
      const supabase = getSupabase();
      if (!supabase) {
        return failure("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data.user) {
        return failure(error?.message ?? "Login failed. Check your email and password.");
      }

      let profile = await fetchProfile(supabase, data.user.id);
      if (!profile) {
        // The signup trigger normally creates this; recover if it raced.
        const metadata = (data.user.user_metadata ?? {}) as Record<string, string>;
        await supabase.from("profiles").upsert({
          id: data.user.id,
          role: metadata.role === "landlord" ? "landlord" : "tenant",
          full_name: metadata.full_name ?? "",
          email: data.user.email ?? "",
          phone: metadata.phone ?? "",
        });
        profile = await fetchProfile(supabase, data.user.id);
      }

      if (!profile) {
        await supabase.auth.signOut();
        return failure("We could not load your profile. Try again in a moment.");
      }

      if (profile.role !== role) {
        await supabase.auth.signOut();
        return failure(
          role === "landlord"
            ? "This account is a tenant account. Use the Tenant Portal to sign in."
            : "This account is a landlord account. Use the Landlord Portal to sign in.",
        );
      }

      await loadForProfile(supabase, profile);
      void logActivity(
        `${role === "landlord" ? "Landlord" : "Tenant"} login`,
        `${profile.full_name || profile.email} opened the ${role} workspace.`,
        "auth",
      );

      if (role === "landlord" && profile.tier === "free") {
        set({ upgradeDialogOpen: true });
      }

      return { ok: true, message: "Welcome back." };
    },

    signup: async (role, draft) => {
      const supabase = getSupabase();
      if (!supabase) {
        return failure("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
      }

      const { data, error } = await supabase.auth.signUp({
        email: draft.email.trim().toLowerCase(),
        password: draft.password,
        options: {
          data: {
            role,
            full_name: draft.name,
            phone: draft.phone ?? "",
          },
        },
      });

      if (error) {
        return failure(error.message);
      }

      if (!data.session || !data.user) {
        return {
          ok: true,
          message: "Account created. Check your email to confirm your address, then sign in.",
        };
      }

      const profile = await fetchProfile(supabase, data.user.id);
      if (profile) {
        await loadForProfile(supabase, profile);
      }

      return { ok: true, message: "Account created. Welcome to LandlordForge." };
    },

    logout: async () => {
      const supabase = getSupabase();
      teardownRealtime();
      if (supabase) {
        await supabase.auth.signOut();
      }
      set({ ...emptyData(), hasHydrated: true, supabaseConfigured: isSupabaseConfigured(), upgradeDialogOpen: false });
    },

    upgradeToPro: async () => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser) {
        return failure("Please log in first.");
      }

      const { error } = await supabase.from("profiles").update({ tier: "pro" }).eq("id", state.currentUser.id);
      if (error) {
        return failure(error.message);
      }

      const nextAccounts: Account[] = state.accounts.map((account) =>
        account.id === state.currentUser?.id ? { ...account, tier: "pro" as const } : account,
      );

      set({
        accounts: nextAccounts,
        currentUser: state.currentUser ? { ...state.currentUser, tier: "pro" } : null,
        upgradeDialogOpen: false,
      });

      void logActivity(
        "Pro unlocked",
        "Unlimited landlord messaging, broadcast inbox, reports, and premium workspace controls are live.",
        "system",
      );

      return { ok: true, message: "Pro unlocked." };
    },

    setSelectedConversationTenantId: (selectedConversationTenantId) => set({ selectedConversationTenantId }),

    markConversationRead: async (tenantId) => {
      const supabase = getSupabase();
      const state = get();
      const currentUser = state.currentUser;
      if (!supabase || !currentUser) {
        return;
      }

      const selectedTenantId =
        tenantId ?? (currentUser.role === "tenant" ? currentUser.linkedTenantId : state.selectedConversationTenantId);
      if (!selectedTenantId) {
        return;
      }

      const landlordAccount = getLandlordAccount(state);
      const tenantAccount = getTenantAccount(state, selectedTenantId);
      const otherPartyId = currentUser.role === "landlord" ? tenantAccount?.id : landlordAccount?.id;
      if (!otherPartyId || isPendingAccountId(otherPartyId)) {
        return;
      }

      set((current) => ({
        messages: current.messages.map((message) =>
          message.from === otherPartyId && message.to === currentUser.id && !message.read
            ? { ...message, read: true }
            : message,
        ),
      }));

      await supabase
        .from("messages")
        .update({ read: true })
        .eq("recipient_id", currentUser.id)
        .eq("sender_id", otherPartyId)
        .eq("read", false);
    },

    sendMessage: async (content, tenantId) => {
      const state = get();
      if (!state.currentUser) {
        return failure("Please log in first.");
      }

      const cleaned = trimContent(content);
      if (!cleaned) {
        return failure("Write a message first.");
      }

      if (
        state.currentUser.role === "landlord" &&
        state.currentUser.tier === "free" &&
        getLandlordSentMessageCount(state, state.currentUser) >= FREE_LANDLORD_MESSAGE_LIMIT
      ) {
        set({ upgradeDialogOpen: true });
        return failure("Free includes 10 landlord-sent messages. Upgrade to keep the inbox live.");
      }

      const targetTenantId =
        state.currentUser.role === "landlord"
          ? tenantId ?? state.selectedConversationTenantId
          : state.currentUser.linkedTenantId ?? null;
      if (!targetTenantId) {
        return failure("Select a tenant conversation first.");
      }

      const landlordAccount = getLandlordAccount(state);
      const tenantAccount = getTenantAccount(state, targetTenantId);
      const recipientId = state.currentUser.role === "landlord" ? tenantAccount?.id : landlordAccount?.id;

      if (!recipientId) {
        return failure(state.currentUser.role === "landlord" ? "Tenant account missing." : "Landlord account missing.");
      }
      if (isPendingAccountId(recipientId)) {
        return failure("This tenant hasn't created their portal account yet. They can sign up with their lease email.");
      }

      const result = await insertMessage(targetTenantId, recipientId, cleaned);
      if (!result.ok) {
        return result;
      }

      set({ selectedConversationTenantId: targetTenantId });
      void logActivity(
        "Message sent",
        state.currentUser.role === "landlord"
          ? `A new message was sent to ${tenantAccount?.name ?? "a tenant"}.`
          : "Your landlord received a new tenant message.",
        "message",
        targetTenantId,
      );

      return result;
    },

    broadcastMessage: async (content) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser || state.currentUser.role !== "landlord") {
        return failure("Only landlords can broadcast.");
      }

      if (state.currentUser.tier !== "pro") {
        set({ upgradeDialogOpen: true });
        return failure("Broadcast is a Pro feature.");
      }

      const cleaned = trimContent(content);
      if (!cleaned) {
        return failure("Write a message first.");
      }

      const reachableTenants = state.tenants.filter((tenant) => !isPendingAccountId(tenant.accountId));
      if (reachableTenants.length === 0) {
        return failure("No tenants with active portal accounts yet.");
      }

      const { data, error } = await supabase
        .from("messages")
        .insert(
          reachableTenants.map((tenant) => ({
            landlord_id: state.currentUser!.id,
            tenancy_id: tenant.id,
            sender_id: state.currentUser!.id,
            recipient_id: tenant.accountId,
            content: cleaned,
          })),
        )
        .select();

      if (error) {
        return failure(error.message);
      }

      set((current) => ({
        messages: [...current.messages, ...((data ?? []) as MessageRow[]).map(mapMessage)],
      }));

      void logActivity("Broadcast sent", "A one-to-many update was sent to every tenant inbox.", "message");
      return { ok: true, message: "Broadcast delivered to all tenant threads." };
    },

    addProperty: async (draft) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser || state.currentUser.role !== "landlord") {
        return failure("Only landlords can add properties.");
      }

      if (state.currentUser.tier === "free" && state.properties.length >= FREE_PROPERTY_LIMIT) {
        set({ upgradeDialogOpen: true });
        return failure("Free plans cap out at 2 properties. Upgrade to add more.");
      }

      const { data, error } = await supabase
        .from("properties")
        .insert({
          landlord_id: state.currentUser.id,
          address: draft.address,
          unit_label: draft.unitLabel,
          monthly_rent_cents: Math.round(draft.monthlyRent * 100),
          due_day: draft.dueDay,
          note: draft.note,
          status: draft.status,
        })
        .select()
        .single();

      if (error) {
        return failure(error.message);
      }

      set((current) => ({ properties: [mapProperty(data as PropertyRow), ...current.properties] }));
      void logActivity("Property added", `${draft.address} ${draft.unitLabel} is now tracked in the portfolio.`, "property");
      return { ok: true, message: "Property saved." };
    },

    updateProperty: async (propertyId, draft) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser || state.currentUser.role !== "landlord") {
        return failure("Only landlords can edit properties.");
      }

      const { data, error } = await supabase
        .from("properties")
        .update({
          address: draft.address,
          unit_label: draft.unitLabel,
          monthly_rent_cents: Math.round(draft.monthlyRent * 100),
          due_day: draft.dueDay,
          note: draft.note,
          status: draft.status,
        })
        .eq("id", propertyId)
        .select()
        .single();

      if (error) {
        return failure(error.message);
      }

      set((current) => ({
        properties: current.properties.map((property) =>
          property.id === propertyId ? mapProperty(data as PropertyRow) : property,
        ),
      }));
      void logActivity("Property updated", `${draft.address} ${draft.unitLabel} details were refreshed.`, "property");
      return { ok: true, message: "Property updated." };
    },

    addExpense: async (draft) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser || state.currentUser.role !== "landlord") {
        return failure("Only landlords can log expenses.");
      }

      const { data, error } = await supabase
        .from("expenses")
        .insert({
          landlord_id: state.currentUser.id,
          property_id: draft.propertyId,
          title: draft.title,
          category: draft.category,
          amount_cents: Math.round(draft.amount * 100),
          incurred_on: draft.date,
          note: draft.note ?? "",
        })
        .select()
        .single();

      if (error) {
        return failure(error.message);
      }

      set((current) => ({
        expenses: [
          {
            id: (data as { id: string }).id,
            propertyId: draft.propertyId,
            title: draft.title,
            category: draft.category,
            amount: draft.amount,
            date: draft.date,
            note: draft.note,
          },
          ...current.expenses,
        ],
      }));
      void logActivity("Expense logged", `${draft.title} was added to the monthly summary.`, "expense");
      return { ok: true, message: "Expense saved." };
    },

    submitMaintenanceRequest: async (draft) => {
      const supabase = getSupabase();
      const state = get();
      const currentTenant = getCurrentTenant(state);
      if (!supabase || !state.currentUser || state.currentUser.role !== "tenant" || !currentTenant) {
        return failure("Only tenants can submit maintenance requests.");
      }

      const landlordAccount = getLandlordAccount(state);
      if (!landlordAccount) {
        return failure("Landlord account missing.");
      }

      const { data, error } = await supabase
        .from("maintenance_requests")
        .insert({
          landlord_id: landlordAccount.id,
          tenancy_id: currentTenant.id,
          property_id: currentTenant.propertyId,
          title: draft.title,
          detail: draft.detail,
          priority: draft.priority,
          status: "open",
          due_date: draft.dueDate || null,
          source: "tenant",
        })
        .select()
        .single();

      if (error) {
        return failure(error.message);
      }

      const row = data as { id: string; created_at: string };
      set((current) => ({
        requests: [
          {
            id: row.id,
            propertyId: currentTenant.propertyId,
            tenantId: currentTenant.id,
            title: draft.title,
            detail: draft.detail,
            priority: draft.priority,
            status: "open",
            dueDate: draft.dueDate || row.created_at,
            createdAt: row.created_at,
            source: "tenant",
          },
          ...current.requests,
        ],
      }));

      await insertMessage(currentTenant.id, landlordAccount.id, `Maintenance request: ${draft.title} - ${draft.detail}`);
      void logActivity("Request submitted", `${draft.title} was added to the landlord request queue.`, "request");
      return { ok: true, message: "Request submitted." };
    },

    updateRequestStatus: async (requestId, status) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser || state.currentUser.role !== "landlord") {
        return failure("Only landlords can update request status.");
      }

      const { error } = await supabase.from("maintenance_requests").update({ status }).eq("id", requestId);
      if (error) {
        return failure(error.message);
      }

      set((current) => ({
        requests: current.requests.map((request) => (request.id === requestId ? { ...request, status } : request)),
      }));
      void logActivity("Request updated", `A maintenance request moved to ${status.replace("-", " ")}.`, "request");
      return { ok: true, message: "Request updated." };
    },

    markPaymentPaid: async (paymentId) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser || state.currentUser.role !== "landlord") {
        return failure("Only landlords can record payments.");
      }

      const payment = state.payments.find((entry) => entry.id === paymentId);
      if (!payment) {
        return failure("Payment record not found.");
      }
      if (payment.status === "paid") {
        return failure("That payment is already marked paid.");
      }

      const receiptNumber = payment.receiptNumber ?? createReceiptNumber();
      const paidAmountCents = getTotalDueCents(payment);
      const baseAmountCents = resolveBaseAmountCents(payment);

      const { data, error } = await supabase
        .from("rent_payments")
        .update({
          status: "paid",
          late_fee_cents: paidAmountCents - baseAmountCents,
          paid_amount_cents: paidAmountCents,
          receipt_number: receiptNumber,
          paid_at: new Date().toISOString(),
          failure_reason: null,
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (error) {
        return failure(error.message);
      }

      set((current) => ({
        payments: current.payments.map((entry) => (entry.id === paymentId ? mapPayment(data as RentPaymentRow) : entry)),
      }));

      const tenant = state.tenants.find((entry) => entry.id === payment.tenantId);
      if (tenant && !isPendingAccountId(tenant.accountId)) {
        await insertMessage(tenant.id, tenant.accountId, `Rent recorded as paid for ${payment.label}. Receipt ${receiptNumber}.`);
      }

      void logActivity(
        "Payment recorded",
        tenant ? `${tenant.name}'s payment for ${payment.label} was marked paid.` : `${payment.label} was marked paid.`,
        "payment",
      );
      get().recordPaymentEvent(
        "payment.recorded_manually",
        { paymentId: payment.id, receiptNumber, paidAmountCents },
        { paymentId: payment.id },
      );

      return { ok: true, message: "Payment recorded." };
    },

    updateCurrentTenantPaymentProfile: async (draft) => {
      const supabase = getSupabase();
      const state = get();
      const currentTenant = getCurrentTenant(state);
      if (!supabase || !state.currentUser || state.currentUser.role !== "tenant" || !currentTenant) {
        return failure("Only tenants can update payment preferences.");
      }

      const landlordAccount = getLandlordAccount(state);
      if (!landlordAccount) {
        return failure("Landlord account missing.");
      }

      const existingProfile = state.paymentProfiles.find((profile) => profile.tenantId === currentTenant.id);
      const savedPaymentLabel =
        draft.savedPaymentLabel ??
        (draft.autopayMethod ? getSavedPaymentLabel(draft.autopayMethod) : existingProfile?.savedPaymentLabel);

      const { data, error } = await supabase
        .from("payment_profiles")
        .upsert(
          {
            landlord_id: landlordAccount.id,
            tenancy_id: currentTenant.id,
            autopay_enabled: draft.autopayEnabled,
            autopay_method: draft.autopayMethod ?? null,
            saved_payment_label: savedPaymentLabel ?? null,
            notification_channels: draft.notificationChannels,
          },
          { onConflict: "tenancy_id" },
        )
        .select()
        .single();

      if (error) {
        return failure(error.message);
      }

      const mapped = mapPaymentProfile(data as PaymentProfileRow);
      set((current) => ({
        paymentProfiles: [
          mapped,
          ...current.paymentProfiles.filter((profile) => profile.tenantId !== currentTenant.id),
        ],
      }));

      void logActivity(
        "Payment settings updated",
        `${currentTenant.name} refreshed autopay and notification preferences.`,
        "payment",
      );
      return { ok: true, message: "Payment preferences saved." };
    },

    recordPaymentEvent: (eventType, payload, options) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser) {
        return;
      }

      const landlordAccount = getLandlordAccount(state);
      const landlordId = state.currentUser.role === "landlord" ? state.currentUser.id : landlordAccount?.id ?? null;

      void supabase
        .from("payment_events")
        .insert({
          landlord_id: landlordId,
          rent_payment_id: options?.paymentId ?? null,
          stripe_event_id: options?.stripeEventId ?? null,
          event_type: eventType,
          payload,
        })
        .then(({ error }) => {
          if (!error) {
            set((current) => ({
              paymentEvents: [
                {
                  id: `local-${Math.random().toString(36).slice(2, 10)}`,
                  rentPaymentId: options?.paymentId,
                  stripeEventId: options?.stripeEventId,
                  eventType,
                  payload,
                  createdAt: new Date().toISOString(),
                },
                ...current.paymentEvents,
              ].slice(0, 36),
            }));
          }
        });
    },

    payRentForCurrentTenant: async (settlement) => {
      const supabase = getSupabase();
      const state = get();
      const currentTenant = getCurrentTenant(state);
      const landlordAccount = getLandlordAccount(state);
      if (!supabase || !state.currentUser || state.currentUser.role !== "tenant" || !currentTenant || !landlordAccount) {
        return failure("Only tenants can mark rent paid.");
      }

      const outstandingPayment =
        (settlement?.paymentId ? state.payments.find((payment) => payment.id === settlement.paymentId) : undefined) ??
        state.payments
          .filter((payment) => payment.tenantId === currentTenant.id && payment.status !== "paid")
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

      if (!outstandingPayment) {
        return failure("No outstanding rent to pay right now.");
      }
      if (outstandingPayment.status === "pending" && !settlement?.paymentStatus) {
        return failure("That payment is already processing.");
      }

      const paymentStatus = settlement?.paymentStatus ?? "paid";
      const paidAmountCents =
        settlement?.paidAmountCents ??
        (paymentStatus === "paid" ? getTotalDueCents(outstandingPayment) : getCollectedAmountCents(outstandingPayment));
      const receiptNumber =
        paymentStatus === "paid" ? settlement?.receiptNumber ?? createReceiptNumber() : settlement?.receiptNumber;
      const baseAmountCents = resolveBaseAmountCents(outstandingPayment);

      const { data, error } = await supabase
        .from("rent_payments")
        .update({
          status: paymentStatus,
          late_fee_cents: getTotalDueCents(outstandingPayment) - baseAmountCents,
          paid_amount_cents: paymentStatus === "paid" ? paidAmountCents : null,
          payment_method: settlement?.paymentMethod ?? outstandingPayment.paymentMethod ?? null,
          stripe_payment_intent_id: settlement?.stripePaymentIntentId ?? outstandingPayment.stripePaymentIntentId ?? null,
          receipt_number: receiptNumber ?? null,
          failure_reason:
            paymentStatus === "failed" ? settlement?.failureReason ?? "Processor declined the attempt." : null,
          paid_at: paymentStatus === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", outstandingPayment.id)
        .select()
        .single();

      if (error) {
        return failure(error.message);
      }

      set((current) => ({
        payments: current.payments.map((payment) =>
          payment.id === outstandingPayment.id ? mapPayment(data as RentPaymentRow) : payment,
        ),
      }));

      const methodLabel =
        settlement?.paymentMethod === "ach" ? "ACH" : settlement?.paymentMethod === "card" ? "card" : "payment";
      const messageContent =
        paymentStatus === "paid"
          ? `I just paid ${outstandingPayment.label}. Receipt ${receiptNumber}.`
          : paymentStatus === "pending"
            ? `Payment started for ${outstandingPayment.label} via ${methodLabel}.`
            : `Payment attempt for ${outstandingPayment.label} needs attention${settlement?.failureReason ? `: ${settlement.failureReason}` : "."}`;

      await insertMessage(currentTenant.id, landlordAccount.id, messageContent);

      const activityDetail =
        paymentStatus === "paid"
          ? `${currentTenant.name} completed ${outstandingPayment.label}.`
          : paymentStatus === "pending"
            ? `${currentTenant.name} started a payment flow for ${outstandingPayment.label}.`
            : `${currentTenant.name} hit a payment issue for ${outstandingPayment.label}.`;
      void logActivity("Tenant payment update", activityDetail, "payment");

      const eventType =
        paymentStatus === "paid"
          ? "payment_intent.succeeded"
          : paymentStatus === "pending"
            ? "payment_intent.processing"
            : "payment_intent.payment_failed";
      get().recordPaymentEvent(
        eventType,
        {
          paymentId: outstandingPayment.id,
          tenantId: currentTenant.id,
          status: paymentStatus,
          method: settlement?.paymentMethod,
          paidAmountCents,
          failureReason: settlement?.failureReason,
          receiptNumber,
        },
        { paymentId: outstandingPayment.id, stripeEventId: settlement?.stripePaymentIntentId },
      );

      return {
        ok: true,
        message:
          paymentStatus === "paid"
            ? "Rent payment confirmed."
            : paymentStatus === "pending"
              ? "Payment processing. It will settle automatically once the processor confirms."
              : "Payment attempt saved for follow-up.",
      };
    },

    fetchListings: async () => {
      const supabase = getSupabase();
      if (!supabase) {
        return failure("Supabase is not configured.");
      }

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "vacant")
        .order("created_at", { ascending: false });

      if (error) {
        return failure(error.message);
      }

      set({ listings: ((data ?? []) as PropertyRow[]).map(mapListing) });
      return { ok: true, message: "Listings loaded." };
    },

    submitApplication: async (draft) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser) {
        return failure("Please log in first.");
      }

      const { data: propertyRow, error: propertyError } = await supabase
        .from("properties")
        .select("landlord_id")
        .eq("id", draft.propertyId)
        .single();

      if (propertyError || !propertyRow) {
        return failure("That listing is no longer available.");
      }

      const { error } = await supabase.from("rental_applications").insert({
        landlord_id: (propertyRow as { landlord_id: string }).landlord_id,
        property_id: draft.propertyId,
        applicant_profile_id: state.currentUser.id,
        full_name: draft.name,
        email: draft.email,
        phone: draft.phone,
        move_in: draft.moveIn,
        income: draft.income,
        message: draft.notes,
      });

      if (error) {
        return failure(error.message);
      }

      return { ok: true, message: "Application submitted. The landlord has been notified." };
    },

    decideApplication: async (applicationId, decision) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser || state.currentUser.role !== "landlord") {
        return failure("Only landlords can review applications.");
      }

      if (decision === "approved") {
        const { error } = await supabase.rpc("approve_application", { application_id: applicationId });
        if (error) {
          return failure(error.message);
        }
        await get().refresh();
        return { ok: true, message: "Application approved. Tenant, lease, and first rent charge created." };
      }

      const { error } = await supabase
        .from("rental_applications")
        .update({ status: "declined" })
        .eq("id", applicationId);
      if (error) {
        return failure(error.message);
      }

      set((current) => ({
        applications: current.applications.map((application) =>
          application.id === applicationId ? { ...application, status: "declined" } : application,
        ),
      }));
      return { ok: true, message: "Application declined." };
    },

    generatePropertyInviteCode: async (propertyId) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser || state.currentUser.role !== "landlord") {
        return failure("Only landlords can create invite codes.");
      }

      const { data, error } = await supabase.rpc("generate_property_invite_code", { p_property_id: propertyId });
      if (error) {
        return failure(error.message);
      }

      const code = data as string;
      set((current) => ({
        properties: current.properties.map((property) =>
          property.id === propertyId ? { ...property, inviteCode: code } : property,
        ),
      }));
      return { ok: true, message: "Invite code ready to share." };
    },

    joinPropertyWithCode: async (code) => {
      const supabase = getSupabase();
      const state = get();
      if (!supabase || !state.currentUser) {
        return failure("Please log in first.");
      }
      if (state.currentUser.role !== "tenant") {
        return failure("Only tenant accounts can join a property with a code.");
      }

      const cleaned = code.trim();
      if (!cleaned) {
        return failure("Enter the code your landlord gave you.");
      }

      const { error } = await supabase.rpc("join_property_with_code", { p_code: cleaned });
      if (error) {
        return failure(error.message);
      }

      await get().refresh();
      return { ok: true, message: "You're in! Your lease and first rent charge are ready." };
    },
  };
});
