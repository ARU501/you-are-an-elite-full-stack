import {
  Account,
  ActivityItem,
  ApplicationItem,
  ExpenseItem,
  ListingItem,
  MaintenanceRequestItem,
  MessageItem,
  PaymentEventItem,
  PaymentItem,
  PropertyItem,
  TenantItem,
  TenantPaymentProfile,
} from "@/lib/types";

// Raw row shapes as returned by Supabase (snake_case, cents, ISO strings).

export interface ProfileRow {
  id: string;
  role: "landlord" | "tenant";
  full_name: string;
  email: string;
  phone: string;
  tier: "free" | "pro";
  created_at: string;
  updated_at: string;
}

export interface PropertyRow {
  id: string;
  landlord_id: string;
  address: string;
  unit_label: string;
  monthly_rent_cents: number;
  due_day: number;
  note: string;
  status: "occupied" | "attention" | "vacant";
  invite_code: string | null;
  created_at: string;
}

export interface TenancyRow {
  id: string;
  landlord_id: string;
  property_id: string;
  tenant_profile_id: string | null;
  tenant_email: string;
  name: string;
  phone: string;
  lease_label: string;
  notes: string;
  status: "active" | "ended";
  created_at: string;
}

export interface RentPaymentRow {
  id: string;
  landlord_id: string;
  tenancy_id: string;
  property_id: string;
  label: string;
  base_amount_cents: number;
  late_fee_cents: number;
  paid_amount_cents: number | null;
  due_date: string;
  status: "due" | "overdue" | "pending" | "paid" | "failed";
  payment_method: "ach" | "card" | null;
  stripe_payment_intent_id: string | null;
  receipt_number: string | null;
  failure_reason: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PaymentProfileRow {
  id: string;
  landlord_id: string;
  tenancy_id: string;
  stripe_customer_id: string;
  autopay_enabled: boolean;
  autopay_method: "ach" | "card" | null;
  saved_payment_label: string | null;
  notification_channels: string[];
  created_at: string;
  updated_at: string;
}

export interface PaymentEventRow {
  id: string;
  landlord_id: string | null;
  rent_payment_id: string | null;
  stripe_event_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface MaintenanceRequestRow {
  id: string;
  landlord_id: string;
  tenancy_id: string;
  property_id: string;
  title: string;
  detail: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in-progress" | "done";
  due_date: string | null;
  source: "landlord" | "tenant";
  created_at: string;
}

export interface ExpenseRow {
  id: string;
  landlord_id: string;
  property_id: string;
  title: string;
  category: string;
  amount_cents: number;
  incurred_on: string;
  note: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  landlord_id: string;
  tenancy_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  landlord_id: string;
  tenancy_id: string | null;
  title: string;
  detail: string;
  type: ActivityItem["type"];
  created_at: string;
}

export interface ApplicationRow {
  id: string;
  landlord_id: string;
  property_id: string;
  applicant_profile_id: string;
  full_name: string;
  email: string;
  phone: string;
  move_in: string;
  income: string;
  message: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
}

// Mappers to the app's existing domain types.

export function mapProfileToAccount(row: ProfileRow, tenancy?: TenancyRow): Account {
  return {
    id: row.id,
    role: row.role,
    name: row.full_name || row.email,
    email: row.email,
    password: "",
    tier: row.tier,
    linkedTenantId: tenancy?.id,
    linkedPropertyId: tenancy?.property_id,
  };
}

export function mapProperty(row: PropertyRow): PropertyItem {
  return {
    id: row.id,
    address: row.address,
    unitLabel: row.unit_label,
    monthlyRent: row.monthly_rent_cents / 100,
    dueDay: row.due_day,
    note: row.note,
    status: row.status,
    inviteCode: row.invite_code ?? undefined,
  };
}

export function mapTenancy(row: TenancyRow): TenantItem {
  return {
    id: row.id,
    accountId: row.tenant_profile_id ?? `pending-${row.id}`,
    propertyId: row.property_id,
    name: row.name,
    email: row.tenant_email,
    phone: row.phone,
    leaseLabel: row.lease_label,
    notes: row.notes,
  };
}

export function mapPayment(row: RentPaymentRow): PaymentItem {
  return {
    id: row.id,
    propertyId: row.property_id,
    tenantId: row.tenancy_id,
    label: row.label,
    amount: row.base_amount_cents / 100,
    baseAmountCents: row.base_amount_cents,
    // 0 means "no fee assessed yet" — leave it undefined so the client's
    // calculateLateFeeCents projects the grace-window fee, matching the amount
    // the create-intent route computes and charges. A stored positive fee is
    // authoritative and passes through.
    lateFeeCents: row.late_fee_cents > 0 ? row.late_fee_cents : undefined,
    paidAmountCents: row.paid_amount_cents ?? undefined,
    dueDate: row.due_date,
    status: row.status,
    paymentMethod: row.payment_method ?? undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? undefined,
    receiptNumber: row.receipt_number ?? undefined,
    failureReason: row.failure_reason ?? undefined,
    paidAt: row.paid_at ?? undefined,
  };
}

export function mapPaymentProfile(row: PaymentProfileRow): TenantPaymentProfile {
  return {
    id: row.id,
    tenantId: row.tenancy_id,
    stripeCustomerId: row.stripe_customer_id,
    autopayEnabled: row.autopay_enabled,
    autopayMethod: row.autopay_method ?? undefined,
    savedPaymentLabel: row.saved_payment_label ?? undefined,
    notificationChannels: row.notification_channels,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPaymentEvent(row: PaymentEventRow): PaymentEventItem {
  return {
    id: row.id,
    rentPaymentId: row.rent_payment_id ?? undefined,
    stripeEventId: row.stripe_event_id ?? undefined,
    eventType: row.event_type,
    payload: row.payload ?? {},
    createdAt: row.created_at,
  };
}

export function mapRequest(row: MaintenanceRequestRow): MaintenanceRequestItem {
  return {
    id: row.id,
    propertyId: row.property_id,
    tenantId: row.tenancy_id,
    title: row.title,
    detail: row.detail,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date ?? row.created_at,
    createdAt: row.created_at,
    source: row.source,
  };
}

export function mapExpense(row: ExpenseRow): ExpenseItem {
  return {
    id: row.id,
    propertyId: row.property_id,
    title: row.title,
    category: row.category,
    amount: row.amount_cents / 100,
    date: row.incurred_on,
    note: row.note || undefined,
  };
}

export function mapMessage(row: MessageRow): MessageItem {
  return {
    id: row.id,
    from: row.sender_id,
    to: row.recipient_id,
    content: row.content,
    timestamp: row.created_at,
    read: row.read,
  };
}

export function mapActivity(row: ActivityRow): ActivityItem {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    timestamp: row.created_at,
    type: row.type,
  };
}

export function mapApplication(row: ApplicationRow): ApplicationItem {
  return {
    id: row.id,
    propertyId: row.property_id,
    applicantId: row.applicant_profile_id,
    name: row.full_name,
    email: row.email,
    phone: row.phone,
    moveIn: row.move_in,
    income: row.income,
    notes: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapListing(row: PropertyRow): ListingItem {
  return {
    id: row.id,
    landlordId: row.landlord_id,
    address: row.address,
    unitLabel: row.unit_label,
    monthlyRent: row.monthly_rent_cents / 100,
    description: row.note,
  };
}
