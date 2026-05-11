import { Account, PersistedAppData } from "@/lib/types";

export const LANDLORD_ACCOUNT_ID = "account-landlord";
export const TENANT_DEMO_ACCOUNT_ID = "account-tenant-dana";
export const TENANT_EWAN_ACCOUNT_ID = "account-tenant-evan";
export const TENANT_NINA_ACCOUNT_ID = "account-tenant-nina";

export const DEMO_CREDENTIALS = {
  landlord: {
    email: "landlord@demo.com",
    password: "demo123",
  },
  tenant: {
    email: "tenant@demo.com",
    password: "demo123",
  },
} as const;

function isoAtDayOffset(days: number, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function isoAtMonthOffset(months: number, day: number, hour = 9) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  date.setDate(day);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function monthPayment(tenantId: string, propertyId: string, label: string, amount: number, monthsAgo: number, dueDay: number) {
  const dueDate = isoAtMonthOffset(-monthsAgo, dueDay);
  return {
    id: `payment-${tenantId}-${monthsAgo}`,
    propertyId,
    tenantId,
    label,
    amount,
    dueDate,
    status: "paid" as const,
    paidAt: isoAtMonthOffset(-monthsAgo, dueDay + 1),
  };
}

export function createDemoAccounts(): Account[] {
  return [
    {
      id: LANDLORD_ACCOUNT_ID,
      role: "landlord",
      name: "Morgan Park",
      email: DEMO_CREDENTIALS.landlord.email,
      password: DEMO_CREDENTIALS.landlord.password,
      tier: "free",
    },
    {
      id: TENANT_DEMO_ACCOUNT_ID,
      role: "tenant",
      name: "Dana Cole",
      email: DEMO_CREDENTIALS.tenant.email,
      password: DEMO_CREDENTIALS.tenant.password,
      tier: "free",
      linkedTenantId: "tenant-dana",
      linkedPropertyId: "property-maple",
    },
    {
      id: TENANT_EWAN_ACCOUNT_ID,
      role: "tenant",
      name: "Evan Ross",
      email: "evan@tenantmail.com",
      password: "demo123",
      tier: "free",
      linkedTenantId: "tenant-evan",
      linkedPropertyId: "property-cedar",
    },
    {
      id: TENANT_NINA_ACCOUNT_ID,
      role: "tenant",
      name: "Nina Patel",
      email: "nina@tenantmail.com",
      password: "demo123",
      tier: "free",
      linkedTenantId: "tenant-nina",
      linkedPropertyId: "property-cedar",
    },
  ];
}

export function createDemoState(): PersistedAppData {
  return {
    currentUser: null,
    selectedConversationTenantId: "tenant-dana",
    accounts: createDemoAccounts(),
    properties: [
      {
        id: "property-maple",
        address: "1421 Maple Street",
        unitLabel: "Unit 2",
        monthlyRent: 1650,
        dueDay: 1,
        note: "Recent plumbing report saved. Lease renews in August.",
        status: "attention",
      },
      {
        id: "property-cedar",
        address: "77 Cedar Avenue",
        unitLabel: "Main House",
        monthlyRent: 2100,
        dueDay: 5,
        note: "Shared lease with strong payment history. Landscaping refresh budgeted.",
        status: "occupied",
      },
    ],
    tenants: [
      {
        id: "tenant-dana",
        accountId: TENANT_DEMO_ACCOUNT_ID,
        propertyId: "property-maple",
        name: "Dana Cole",
        email: DEMO_CREDENTIALS.tenant.email,
        phone: "(555) 220-1930",
        leaseLabel: "12-month lease through Aug 31",
        notes: "Prefers text before visits. Usually pays via ACH.",
      },
      {
        id: "tenant-evan",
        accountId: TENANT_EWAN_ACCOUNT_ID,
        propertyId: "property-cedar",
        name: "Evan Ross",
        email: "evan@tenantmail.com",
        phone: "(555) 867-1192",
        leaseLabel: "Co-tenant through Dec 15",
        notes: "Handles auto-pay. Main point of contact for the Cedar house.",
      },
      {
        id: "tenant-nina",
        accountId: TENANT_NINA_ACCOUNT_ID,
        propertyId: "property-cedar",
        name: "Nina Patel",
        email: "nina@tenantmail.com",
        phone: "(555) 408-3309",
        leaseLabel: "Co-tenant through Dec 15",
        notes: "Often flags maintenance issues first. Dog on site.",
      },
    ],
    payments: [
      monthPayment("tenant-dana", "property-maple", "Maple Street rent", 1650, 3, 1),
      monthPayment("tenant-dana", "property-maple", "Maple Street rent", 1650, 2, 1),
      monthPayment("tenant-dana", "property-maple", "Maple Street rent", 1650, 1, 1),
      {
        id: "payment-dana-current",
        propertyId: "property-maple",
        tenantId: "tenant-dana",
        label: "Maple Street May rent",
        amount: 1650,
        dueDate: isoAtDayOffset(-4),
        status: "overdue",
      },
      monthPayment("tenant-evan", "property-cedar", "Cedar Avenue rent", 1050, 3, 5),
      monthPayment("tenant-evan", "property-cedar", "Cedar Avenue rent", 1050, 2, 5),
      monthPayment("tenant-evan", "property-cedar", "Cedar Avenue rent", 1050, 1, 5),
      {
        id: "payment-evan-current",
        propertyId: "property-cedar",
        tenantId: "tenant-evan",
        label: "Cedar Avenue May rent",
        amount: 1050,
        dueDate: isoAtDayOffset(3),
        status: "due",
      },
      monthPayment("tenant-nina", "property-cedar", "Cedar Avenue rent", 1050, 3, 5),
      monthPayment("tenant-nina", "property-cedar", "Cedar Avenue rent", 1050, 2, 5),
      monthPayment("tenant-nina", "property-cedar", "Cedar Avenue rent", 1050, 1, 5),
      {
        id: "payment-nina-current",
        propertyId: "property-cedar",
        tenantId: "tenant-nina",
        label: "Cedar Avenue May rent",
        amount: 1050,
        dueDate: isoAtDayOffset(3),
        status: "paid",
        paidAt: isoAtDayOffset(-1),
      },
    ],
    requests: [
      {
        id: "request-maple-leak",
        propertyId: "property-maple",
        tenantId: "tenant-dana",
        title: "Laundry shutoff leak",
        detail: "Water is dripping slowly behind the washer hookup and the wall feels damp.",
        priority: "high",
        status: "open",
        dueDate: isoAtDayOffset(1),
        createdAt: isoAtDayOffset(-1),
        source: "tenant",
      },
      {
        id: "request-cedar-filter",
        propertyId: "property-cedar",
        tenantId: "tenant-evan",
        title: "HVAC filter replacement",
        detail: "Airflow dropped this week and the upstairs hall is warmer than normal.",
        priority: "medium",
        status: "in-progress",
        dueDate: isoAtDayOffset(3),
        createdAt: isoAtDayOffset(-3),
        source: "tenant",
      },
      {
        id: "request-cedar-paint",
        propertyId: "property-cedar",
        tenantId: "tenant-nina",
        title: "Front door paint touch-up",
        detail: "Exterior paint is peeling near the lock set.",
        priority: "low",
        status: "done",
        dueDate: isoAtDayOffset(-6),
        createdAt: isoAtDayOffset(-9),
        source: "tenant",
      },
    ],
    expenses: [
      {
        id: "expense-1",
        propertyId: "property-maple",
        title: "Water shutoff repair kit",
        category: "Repairs",
        amount: 185,
        date: isoAtDayOffset(-2),
        note: "Plumbing supply pickup for Maple Street.",
      },
      {
        id: "expense-2",
        propertyId: "property-cedar",
        title: "Lawn service",
        category: "Maintenance",
        amount: 92,
        date: isoAtDayOffset(-6),
        note: "Monthly exterior service.",
      },
      {
        id: "expense-3",
        propertyId: "property-cedar",
        title: "Filter pack",
        category: "Supplies",
        amount: 64,
        date: isoAtMonthOffset(-1, 18),
        note: "Bulk filters for Q2.",
      },
      {
        id: "expense-4",
        propertyId: "property-maple",
        title: "Smoke detector batteries",
        category: "Safety",
        amount: 28,
        date: isoAtMonthOffset(-2, 11),
        note: "Preventive replacement before inspection.",
      },
    ],
    messages: [
      {
        id: "message-1",
        from: TENANT_DEMO_ACCOUNT_ID,
        to: LANDLORD_ACCOUNT_ID,
        content: "The laundry shutoff is leaking again. I put a towel under it for now.",
        timestamp: isoAtDayOffset(-1, 8),
        read: true,
      },
      {
        id: "message-2",
        from: LANDLORD_ACCOUNT_ID,
        to: TENANT_DEMO_ACCOUNT_ID,
        content: "Thanks for flagging it. I booked a plumber for tomorrow morning.",
        timestamp: isoAtDayOffset(-1, 9),
        read: false,
      },
      {
        id: "message-3",
        from: TENANT_EWAN_ACCOUNT_ID,
        to: LANDLORD_ACCOUNT_ID,
        content: "The hallway thermostat feels off and airflow upstairs is weak.",
        timestamp: isoAtDayOffset(-2, 11),
        read: false,
      },
      {
        id: "message-4",
        from: LANDLORD_ACCOUNT_ID,
        to: TENANT_EWAN_ACCOUNT_ID,
        content: "HVAC filter swap is in progress. I will send the technician window tonight.",
        timestamp: isoAtDayOffset(-2, 13),
        read: true,
      },
      {
        id: "message-5",
        from: TENANT_NINA_ACCOUNT_ID,
        to: LANDLORD_ACCOUNT_ID,
        content: "Auto-pay posted on my end. Can you confirm it came through?",
        timestamp: isoAtDayOffset(-1, 16),
        read: false,
      },
      {
        id: "message-6",
        from: LANDLORD_ACCOUNT_ID,
        to: TENANT_NINA_ACCOUNT_ID,
        content: "Yes, I see it. Thanks for staying ahead of it.",
        timestamp: isoAtDayOffset(-1, 17),
        read: true,
      },
    ],
    activities: [
      {
        id: "activity-1",
        title: "Overdue rent alert",
        detail: "Dana's Maple Street payment is now 4 days late.",
        timestamp: isoAtDayOffset(-1, 10),
        type: "payment",
      },
      {
        id: "activity-2",
        title: "New tenant message",
        detail: "Nina asked for payment confirmation in Messages.",
        timestamp: isoAtDayOffset(-1, 16),
        type: "message",
      },
      {
        id: "activity-3",
        title: "Maintenance request opened",
        detail: "Laundry shutoff leak was added to the request board.",
        timestamp: isoAtDayOffset(-1, 8),
        type: "request",
      },
      {
        id: "activity-4",
        title: "Expense logged",
        detail: "Water shutoff repair kit added to Maple Street.",
        timestamp: isoAtDayOffset(-2, 12),
        type: "expense",
      },
      {
        id: "activity-5",
        title: "Payment confirmed",
        detail: "Nina's Cedar Avenue rent settled successfully.",
        timestamp: isoAtDayOffset(-1, 18),
        type: "payment",
      },
    ],
  };
}
