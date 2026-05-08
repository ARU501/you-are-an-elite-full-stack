export type AppMode = "landlord" | "contractor";
export type AppTab =
  | "dashboard"
  | "records"
  | "contacts"
  | "billing"
  | "tasks"
  | "expenses"
  | "reports";
export type Tier = "free" | "pro";
export type ContactKind = "tenant" | "client";
export type PaymentStatus = "paid" | "due" | "overdue";
export type TaskStatus = "open" | "in-progress" | "done";
export type ActivityType = "payment" | "task" | "expense" | "record" | "auth" | "system";

export interface UserProfile {
  name: string;
  email: string;
  tier: Tier;
  isAuthenticated: boolean;
}

export interface PropertyItem {
  id: string;
  address: string;
  tenantName: string;
  rentAmount: number;
  dueDay: number;
  note?: string;
}

export interface JobItem {
  id: string;
  clientName: string;
  description: string;
  amount: number;
  dueDate: string;
  note?: string;
}

export interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: PaymentStatus;
  note: string;
}

export interface ContactItem {
  id: string;
  linkedRecordId?: string;
  kind: ContactKind;
  displayName: string;
  email: string;
  phone: string;
  label: string;
  notes: string;
  paymentHistory: PaymentHistoryItem[];
}

export interface PaymentItem {
  id: string;
  kind: "rent" | "invoice";
  recordId?: string;
  contactId: string;
  label: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paidAt?: string;
}

export interface TaskItem {
  id: string;
  mode: AppMode;
  title: string;
  detail: string;
  linkedRecordId?: string;
  linkedName: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  notifyByPush: boolean;
  status: TaskStatus;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  linkedRecordId?: string;
  linkedName: string;
  amount: number;
  date: string;
  note?: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  type: ActivityType;
}

export interface PersistedAppData {
  activeTab: AppTab;
  mode: AppMode;
  selectedContactId: string | null;
  user: UserProfile;
  properties: PropertyItem[];
  jobs: JobItem[];
  contacts: ContactItem[];
  payments: PaymentItem[];
  tasks: TaskItem[];
  expenses: ExpenseItem[];
  activities: ActivityItem[];
  lastPushAt: string | null;
}

export interface PropertyDraft {
  address: string;
  tenantName: string;
  rentAmount: number;
  dueDay: number;
  note?: string;
}

export interface JobDraft {
  clientName: string;
  description: string;
  amount: number;
  dueDate: string;
  note?: string;
}

export interface ExpenseDraft {
  title: string;
  category: string;
  linkedRecordId?: string;
  linkedName: string;
  amount: number;
  date: string;
  note?: string;
}

export interface TaskDraft {
  title: string;
  detail: string;
  linkedRecordId?: string;
  linkedName: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  notifyByPush: boolean;
}
