import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ActivityRow,
  ApplicationRow,
  ExpenseRow,
  MaintenanceRequestRow,
  MessageRow,
  PaymentEventRow,
  PaymentProfileRow,
  ProfileRow,
  PropertyRow,
  RentPaymentRow,
  TenancyRow,
  mapActivity,
  mapApplication,
  mapExpense,
  mapMessage,
  mapPayment,
  mapPaymentEvent,
  mapPaymentProfile,
  mapProfileToAccount,
  mapProperty,
  mapRequest,
  mapTenancy,
} from "@/lib/supabase/mappers";
import { ApplicationItem, PersistedAppData, SessionUser } from "@/lib/types";

export interface WorkspaceData extends Omit<PersistedAppData, "selectedConversationTenantId"> {
  applications: ApplicationItem[];
}

function toSessionUser(profile: ProfileRow, tenancy?: TenancyRow): SessionUser {
  return {
    id: profile.id,
    role: profile.role,
    name: profile.full_name || profile.email,
    email: profile.email.toLowerCase(),
    tier: profile.tier,
    linkedTenantId: tenancy?.id,
    linkedPropertyId: tenancy?.property_id,
  };
}

// Load everything the signed-in user is allowed to see (RLS scopes every
// query server-side) and shape it exactly like the old demo store state.
export async function loadWorkspace(supabase: SupabaseClient, profile: ProfileRow): Promise<WorkspaceData> {
  // Idempotent housekeeping: link invited tenants, generate this month's
  // rent charges, roll past-due charges to overdue.
  await supabase.rpc("claim_my_tenancies");
  await supabase.rpc("ensure_rent_payments");

  const [
    propertiesRes,
    tenanciesRes,
    paymentsRes,
    paymentProfilesRes,
    paymentEventsRes,
    requestsRes,
    expensesRes,
    messagesRes,
    activitiesRes,
    applicationsRes,
  ] = await Promise.all([
    supabase.from("properties").select("*").order("created_at", { ascending: false }),
    supabase.from("tenancies").select("*").eq("status", "active").order("created_at", { ascending: true }),
    supabase.from("rent_payments").select("*").order("due_date", { ascending: false }),
    supabase.from("payment_profiles").select("*"),
    supabase.from("payment_events").select("*").order("created_at", { ascending: false }).limit(36),
    supabase.from("maintenance_requests").select("*").order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").order("incurred_on", { ascending: false }),
    supabase.from("messages").select("*").order("created_at", { ascending: true }),
    supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(18),
    supabase.from("rental_applications").select("*").order("created_at", { ascending: false }),
  ]);

  const properties = (propertiesRes.data ?? []) as PropertyRow[];
  const tenancies = (tenanciesRes.data ?? []) as TenancyRow[];
  const payments = (paymentsRes.data ?? []) as RentPaymentRow[];
  const paymentProfiles = (paymentProfilesRes.data ?? []) as PaymentProfileRow[];
  const paymentEvents = (paymentEventsRes.data ?? []) as PaymentEventRow[];
  const requests = (requestsRes.data ?? []) as MaintenanceRequestRow[];
  const expenses = (expensesRes.data ?? []) as ExpenseRow[];
  const messages = (messagesRes.data ?? []) as MessageRow[];
  const activities = (activitiesRes.data ?? []) as ActivityRow[];
  const applications = (applicationsRes.data ?? []) as ApplicationRow[];

  // Counterpart profiles (landlord sees tenants, tenant sees landlord).
  const counterpartIds = new Set<string>();
  for (const tenancy of tenancies) {
    if (tenancy.tenant_profile_id) counterpartIds.add(tenancy.tenant_profile_id);
    counterpartIds.add(tenancy.landlord_id);
  }
  counterpartIds.delete(profile.id);

  let counterparts: ProfileRow[] = [];
  if (counterpartIds.size > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", Array.from(counterpartIds));
    counterparts = (data ?? []) as ProfileRow[];
  }

  const ownTenancy = profile.role === "tenant" ? tenancies.find((t) => t.tenant_profile_id === profile.id) : undefined;

  const accounts = [
    mapProfileToAccount(profile, ownTenancy),
    ...counterparts.map((row) => mapProfileToAccount(row, tenancies.find((t) => t.tenant_profile_id === row.id))),
  ];

  // Tenants can also read vacant properties from other landlords through
  // the browse policy; keep only their own leased property in the main list.
  const scopedProperties =
    profile.role === "tenant"
      ? properties.filter((row) => tenancies.some((t) => t.property_id === row.id))
      : properties;

  return {
    currentUser: toSessionUser(profile, ownTenancy),
    accounts,
    properties: scopedProperties.map(mapProperty),
    tenants: tenancies.map(mapTenancy),
    payments: payments.map(mapPayment),
    paymentProfiles: paymentProfiles.map(mapPaymentProfile),
    paymentEvents: paymentEvents.map(mapPaymentEvent),
    requests: requests.map(mapRequest),
    expenses: expenses.map(mapExpense),
    messages: messages.map(mapMessage),
    activities: activities.map(mapActivity),
    applications: applications.map(mapApplication),
  };
}
