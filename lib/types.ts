export type Role = "landlord" | "tenant";
export type Tier = "free" | "pro";
export type PaymentStatus = "paid" | "due" | "overdue";
export type RequestStatus = "open" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high";
export type PropertyStatus = "occupied" | "attention";
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
  dueDate: string;
  status: PaymentStatus;
  paidAt?: string;
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

export interface ActionResult {
  ok: boolean;
  message: string;
}
