// ============================================================
//  Request context — per-request country for Shopify @inContext
//  currency localization (Shopify Markets).
// ============================================================
// Shopify returns product prices in the shop's BASE currency unless a
// query carries an `@inContext(country:)` directive, while a cart's
// presentment currency is auto-derived from the buyer's IP. That split is
// exactly what makes the catalogue ($) and the cart (e.g. BDT) disagree.
//
// To keep them in lock-step we resolve ONE country code per request and
// pass it as the `$country` variable to BOTH the catalogue queries and the
// cart operations. Because the value is the same for the whole request, the
// storefront and the cart always localize to the same currency.
//
// The value is stored in an AsyncLocalStorage so the service layer can read
// it (`getCountry()`) without every page/route having to thread it through.
import { AsyncLocalStorage } from 'node:async_hooks';
import { SITE } from '~/config/site';

/** Fallback when no region can be detected (see SITE.defaultCountry). */
const DEFAULT_COUNTRY = (SITE.defaultCountry ?? 'US').toUpperCase();

/** Cookie a region/currency selector can set to pin the country explicitly. */
export const COUNTRY_COOKIE = 'omnix_country';

interface RequestContext {
  country: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Run `fn` with the given request context bound for its async lifetime. */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/**
 * The resolved ISO-3166 country for the current request, or the configured
 * default outside a request (e.g. build-time prerender, scripts).
 */
export function getCountry(): string {
  return storage.getStore()?.country ?? DEFAULT_COUNTRY;
}

const VALID = /^[A-Z]{2}$/;
// Sentinels some CDNs emit for "unknown" — never valid market codes.
const UNKNOWN = new Set(['XX', 'T1', 'A1', 'A2', 'O1', 'EU', 'AP', 'ZZ']);

function clean(code: string | null | undefined): string | null {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  return VALID.test(c) && !UNKNOWN.has(c) ? c : null;
}

/** Region subtag from an Accept-Language header, e.g. "en-BD,en;q=0.9" → "BD". */
function fromAcceptLanguage(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(',')) {
    const tag = part.split(';')[0]?.trim(); // "en-BD"
    const region = tag?.split('-')[1]; // "BD"
    const c = clean(region);
    if (c) return c;
  }
  return null;
}

/**
 * Resolve the buyer's country from fast, infrastructure signals only (no API call):
 *   1. Explicit `omnix_country` cookie
 *   2. CDN edge geo headers (Cloudflare, Vercel, Netlify, Fastly, GAE…)
 * Returns null when neither is set — the middleware then falls back to Shopify's
 * own IP-based localization query so currency matches what Shopify uses for the cart.
 *
 * Accept-Language is intentionally excluded: it reflects language preference, not
 * physical location, and commonly causes country mismatches (e.g. "en-US" from a
 * Bangladesh browser produces USD prices while Shopify shows the cart in BDT).
 */
export function resolveCountryFast(
  request: Request,
  cookieValue?: string | null,
): string | null {
  const h = request.headers;

  const cookie = clean(cookieValue);
  if (cookie) return cookie;

  return (
    clean(h.get('cf-ipcountry')) ??
    clean(h.get('x-vercel-ip-country')) ??
    clean(h.get('x-nf-geo-country')) ??
    clean(h.get('x-geo-country')) ??
    clean(h.get('x-country-code')) ??
    clean(h.get('x-appengine-country')) ??
    clean(h.get('fastly-geo-country'))
  );
}

/**
 * Synchronous country resolution with DEFAULT_COUNTRY fallback.
 * Use only where an async call to `getLocalization` isn't possible;
 * the middleware always prefers the Shopify localization path.
 */
export function resolveCountry(
  request: Request,
  cookieValue?: string | null,
): string {
  return resolveCountryFast(request, cookieValue) ?? DEFAULT_COUNTRY;
}

/**
 * Extract the real client IP from proxy/CDN headers (first value in x-forwarded-for).
 * Returns null for loopback/private addresses that Shopify cannot geolocate.
 */
export function extractBuyerIp(request: Request): string | null {
  const h = request.headers;
  const xff = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = xff ?? h.get('cf-connecting-ip') ?? h.get('x-real-ip') ?? null;
  if (!ip) return null;
  // Loopback + RFC-1918 private ranges are useless for geo detection.
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('::ffff:127.')
  ) return null;
  return ip;
}
