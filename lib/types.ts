export type Role = "landlord" | "tenant";
export type Tier = "free" | "pro";
export type PaymentStatus = "due" | "overdue" | "pending" | "paid" | "failed";
export type PaymentMethodType = "ach" | "card";
export type RequestStatus = "open" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high";
export type PropertyStatus = "occupied" | "attention" | "vacant";
export type ApplicationStatus = "pending" | "approved" | "declined";
export type ActivityType = "payment" | "request" | "expense" | "message" | "property" | "auth" | "system";

export interface Account {
  id: string;
  role: Role;
  name: string;
  email: string;
  password: string;
  tier: Tier;
  linkedTenantId?: string;
  linkedPropertyId?: string;
}

export interface SessionUser {
  id: string;
  role: Role;
  name: string;
  email: string;
  tier: Tier;
  linkedTenantId?: string;
  linkedPropertyId?: string;
}

export interface PropertyItem {
  id: string;
  address: string;
  unitLabel: string;
  monthlyRent: number;
  dueDay: number;
  note: string;
  status: PropertyStatus;
}

export interface TenantItem {
  id: string;
  accountId: string;
  propertyId: string;
  name: string;
  email: string;
  phone: string;
  leaseLabel: string;
  notes: string;
}

export interface PaymentItem {
  id: string;
  propertyId: string;
  tenantId: string;
  label: string;
  amount: number;
  baseAmountCents?: number;
  lateFeeCents?: number;
  paidAmountCents?: number;
  dueDate: string;
  status: PaymentStatus;
  paymentMethod?: PaymentMethodType;
  stripePaymentIntentId?: string;
  receiptNumber?: string;
  failureReason?: string;
  paidAt?: string;
}

export interface TenantPaymentProfile {
  id: string;
  tenantId: string;
  stripeCustomerId: string;
  autopayEnabled: boolean;
  autopayMethod?: PaymentMethodType;
  savedPaymentLabel?: string;
  notificationChannels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEventItem {
  id: string;
  rentPaymentId?: string;
  stripeEventId?: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface MaintenanceRequestItem {
  id: string;
  propertyId: string;
  tenantId: string;
  title: string;
  detail: string;
  priority: Priority;
  status: RequestStatus;
  dueDate: string;
  createdAt: string;
  source: Role;
}

export interface ExpenseItem {
  id: string;
  propertyId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export interface MessageItem {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: ActivityType;
}

export interface PersistedAppData {
  currentUser: SessionUser | null;
  accounts: Account[];
  properties: PropertyItem[];
  tenants: TenantItem[];
  payments: PaymentItem[];
  paymentProfiles: TenantPaymentProfile[];
  paymentEvents: PaymentEventItem[];
  requests: MaintenanceRequestItem[];
  expenses: ExpenseItem[];
  messages: MessageItem[];
  activities: ActivityItem[];
  selectedConversationTenantId: string | null;
}

export interface PropertyDraft {
  address: string;
  unitLabel: string;
  monthlyRent: number;
  dueDay: number;
  note: string;
  status: PropertyStatus;
}

export interface ExpenseDraft {
  propertyId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export interface MaintenanceRequestDraft {
  title: string;
  detail: string;
  priority: Priority;
  dueDate: string;
}

export interface PaymentProfileDraft {
  autopayEnabled: boolean;
  autopayMethod?: PaymentMethodType;
  savedPaymentLabel?: string;
  notificationChannels: string[];
}

export interface TenantPaymentSettlement {
  paymentId?: string;
  paymentMethod?: PaymentMethodType;
  paidAmountCents?: number;
  paymentStatus?: PaymentStatus;
  stripePaymentIntentId?: string;
  receiptNumber?: string;
  failureReason?: string;
}

export interface PaymentIntentRequestBody {
  paymentId: string;
  tenantId: string;
  amountCents: number;
  method: PaymentMethodType;
  autopay: boolean;
}

export interface PaymentIntentResponse {
  ok: boolean;
  mode: "demo" | "stripe";
  paymentIntentId: string;
  clientSecret?: string;
  status: "pending" | "paid" | "failed";
  amountCents: number;
  method: PaymentMethodType;
  autopay: boolean;
  receiptNumber?: string;
  message: string;
  error?: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface ApplicationItem {
  id: string;
  propertyId: string;
  applicantId: string;
  name: string;
  email: string;
  phone: string;
  moveIn: string;
  income: string;
  notes: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface ListingItem {
  id: string;
  landlordId: string;
  address: string;
  unitLabel: string;
  monthlyRent: number;
  description: string;
}

export interface ApplicationDraft {
  propertyId: string;
  name: string;
  email: string;
  phone: string;
  moveIn: string;
  income: string;
  notes: string;
}

export interface SignupDraft {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
