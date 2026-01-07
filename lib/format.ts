export const LOCALE = "en-PK";
export const TIMEZONE = "Asia/Karachi";
export const CURRENCY = "PKR";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(LOCALE).format(value);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    dateStyle: "medium",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

