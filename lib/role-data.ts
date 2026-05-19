import {
  Account,
  MaintenanceRequestItem,
  MessageItem,
  PaymentItem,
  PersistedAppData,
  PropertyItem,
  SessionUser,
  TenantItem,
  TenantPaymentProfile,
} from "@/lib/types";

type DataShape = Pick<
  PersistedAppData,
  "accounts" | "currentUser" | "properties" | "tenants" | "payments" | "paymentProfiles" | "requests" | "expenses" | "messages"
>;

export function getLandlordAccount(data: Pick<PersistedAppData, "accounts">): Account | undefined {
  return data.accounts.find((account) => account.role === "landlord");
}

export function getCurrentTenant(data: DataShape): TenantItem | undefined {
  if (!data.currentUser || data.currentUser.role !== "tenant" || !data.currentUser.linkedTenantId) {
    return undefined;
  }

  return data.tenants.find((tenant) => tenant.id === data.currentUser?.linkedTenantId);
}

export function getTenantAccount(data: Pick<PersistedAppData, "accounts" | "tenants">, tenantId: string) {
  const tenant = data.tenants.find((entry) => entry.id === tenantId);
  if (!tenant) {
    return undefined;
  }

  return data.accounts.find((account) => account.id === tenant.accountId);
}

export function getTenantByAccountId(data: Pick<PersistedAppData, "tenants">, accountId: string) {
  return data.tenants.find((tenant) => tenant.accountId === accountId);
}

export function getCurrentProperty(data: DataShape): PropertyItem | undefined {
  const currentTenant = getCurrentTenant(data);
  if (!currentTenant) {
    return undefined;
  }

  return data.properties.find((property) => property.id === currentTenant.propertyId);
}

export function getPropertyTenants(data: Pick<PersistedAppData, "tenants">, propertyId: string) {
  return data.tenants.filter((tenant) => tenant.propertyId === propertyId);
}

export function getTenantPayments(data: Pick<PersistedAppData, "payments">, tenantId: string): PaymentItem[] {
  return data.payments
    .filter((payment) => payment.tenantId === tenantId)
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
}

export function getCurrentDuePayment(data: Pick<PersistedAppData, "payments">, tenantId: string) {
  return getTenantPayments(data, tenantId)
    .filter((payment) => payment.status !== "paid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
}

export function getTenantPaymentProfile(
  data: Pick<PersistedAppData, "paymentProfiles">,
  tenantId: string,
): TenantPaymentProfile | undefined {
  return data.paymentProfiles.find((profile) => profile.tenantId === tenantId);
}

export function getCurrentTenantPaymentProfile(data: DataShape) {
  const currentTenant = getCurrentTenant(data);
  if (!currentTenant) {
    return undefined;
  }

  return getTenantPaymentProfile(data, currentTenant.id);
}

export function getTenantRequests(data: Pick<PersistedAppData, "requests">, tenantId: string): MaintenanceRequestItem[] {
  return data.requests
    .filter((request) => request.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getConversationMessages(
  data: Pick<PersistedAppData, "accounts" | "tenants" | "messages">,
  tenantId: string,
): MessageItem[] {
  const landlordAccount = getLandlordAccount(data);
  const tenantAccount = getTenantAccount(data, tenantId);

  if (!landlordAccount || !tenantAccount) {
    return [];
  }

  return data.messages
    .filter(
      (message) =>
        (message.from === landlordAccount.id && message.to === tenantAccount.id) ||
        (message.from === tenantAccount.id && message.to === landlordAccount.id),
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export function getUnreadMessageCount(data: Pick<PersistedAppData, "accounts" | "currentUser" | "messages">) {
  if (!data.currentUser) {
    return 0;
  }

  return data.messages.filter((message) => message.to === data.currentUser?.id && !message.read).length;
}

export function getLandlordSentMessageCount(
  data: Pick<PersistedAppData, "accounts" | "messages">,
  currentUser?: SessionUser | null,
) {
  const landlordAccount = currentUser?.role === "landlord" ? currentUser : getLandlordAccount(data);
  if (!landlordAccount) {
    return 0;
  }

  return data.messages.filter((message) => message.from === landlordAccount.id).length;
}
