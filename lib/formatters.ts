export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatShortDate(input: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(input));
}

export function formatLongDate(input: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(input));
}

export function formatDateTime(input: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(input));
}

export function formatRelativeTime(input: string) {
  const diffHours = Math.round((new Date(input).getTime() - Date.now()) / (1000 * 60 * 60));

  if (Math.abs(diffHours) < 24) {
    return `${Math.abs(diffHours)}h ${diffHours <= 0 ? "ago" : "from now"}`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${Math.abs(diffDays)}d ${diffDays <= 0 ? "ago" : "from now"}`;
}

export function isDatePast(input: string) {
  return new Date(input).getTime() < Date.now();
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
