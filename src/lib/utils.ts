import clsx, { type ClassValue } from 'clsx';

/** Tailwind-friendly conditional class joiner. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Format a money value using the buyer's currency. */
export function formatMoney(
  amount: string | number | null | undefined,
  currencyCode = 'USD',
  locale = 'en-US',
): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    // Snowboards are whole-dollar-ish; keep cents only when present.
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}

/** True when compareAtPrice is a real, higher price (Shopify returns "0.0"/null otherwise). */
export function isOnSale(
  price?: { amount: string } | null,
  compareAt?: { amount: string } | null,
): boolean {
  const p = Number(price?.amount);
  const c = Number(compareAt?.amount);
  return Number.isFinite(p) && Number.isFinite(c) && c > p;
}

/** Discount percentage as a rounded integer, or null when not a meaningful (>=1%) markdown. */
export function discountPercent(
  price?: { amount: string } | null,
  compareAt?: { amount: string } | null,
): number | null {
  if (!isOnSale(price, compareAt)) return null;
  const p = Number(price!.amount);
  const c = Number(compareAt!.amount);
  const pct = Math.round(((c - p) / c) * 100);
  return pct >= 1 ? pct : null;
}

/** Extract the numeric id from a Shopify gid:// global id. */
export function parseGid(gid: string): string {
  return gid?.split('/').pop() ?? gid;
}

// ISO-3166 country → its default presentment currency. Mirrors Shopify
// Markets' per-country default so the announcement-bar label agrees with
// the prices `@inContext(country:)` actually returns. Extend as you enable
// more markets; unknown countries fall back to USD.
const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string }> = {
  US: { code: 'USD', symbol: '$' },
  CA: { code: 'CAD', symbol: '$' },
  GB: { code: 'GBP', symbol: '£' },
  AU: { code: 'AUD', symbol: '$' },
  NZ: { code: 'NZD', symbol: '$' },
  BD: { code: 'BDT', symbol: '৳' },
  IN: { code: 'INR', symbol: '₹' },
  PK: { code: 'PKR', symbol: '₨' },
  LK: { code: 'LKR', symbol: '₨' },
  JP: { code: 'JPY', symbol: '¥' },
  CN: { code: 'CNY', symbol: '¥' },
  HK: { code: 'HKD', symbol: '$' },
  SG: { code: 'SGD', symbol: '$' },
  MY: { code: 'MYR', symbol: 'RM' },
  AE: { code: 'AED', symbol: 'د.إ' },
  SA: { code: 'SAR', symbol: '﷼' },
  CH: { code: 'CHF', symbol: 'CHF' },
  SE: { code: 'SEK', symbol: 'kr' },
  NO: { code: 'NOK', symbol: 'kr' },
  DK: { code: 'DKK', symbol: 'kr' },
  BR: { code: 'BRL', symbol: 'R$' },
  MX: { code: 'MXN', symbol: '$' },
  ZA: { code: 'ZAR', symbol: 'R' },
  // Eurozone
  DE: { code: 'EUR', symbol: '€' },
  FR: { code: 'EUR', symbol: '€' },
  IT: { code: 'EUR', symbol: '€' },
  ES: { code: 'EUR', symbol: '€' },
  NL: { code: 'EUR', symbol: '€' },
  IE: { code: 'EUR', symbol: '€' },
  PT: { code: 'EUR', symbol: '€' },
  AT: { code: 'EUR', symbol: '€' },
  BE: { code: 'EUR', symbol: '€' },
  FI: { code: 'EUR', symbol: '€' },
};

/** A country's default currency code + symbol (falls back to USD). */
export function countryCurrency(country?: string | null): { code: string; symbol: string } {
  return COUNTRY_CURRENCY[(country ?? '').toUpperCase()] ?? { code: 'USD', symbol: '$' };
}
