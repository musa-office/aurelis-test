// ============================================================
//  Middleware — resolve the buyer's country once per request and
//  bind it for the request's async lifetime so the Shopify service
//  layer localizes catalogue prices AND the cart to one currency.
// ============================================================
import { defineMiddleware } from 'astro:middleware';
import { resolveCountryFast, extractBuyerIp, runWithContext, COUNTRY_COOKIE } from '~/lib/shopify/context';
import { getLocalization } from '~/lib/shopify/services/content';
import { SITE } from '~/config/site';

const DEFAULT_COUNTRY = ((SITE.defaultCountry as string | undefined) ?? 'US').toUpperCase();

export const onRequest = defineMiddleware(async (context, next) => {
  const cookieVal = context.cookies.get(COUNTRY_COOKIE)?.value;

  // Fast path: cookie → CDN geo header → Accept-Language subtag (no Shopify call).
  // This is satisfied on every production request behind a CDN.
  let country = resolveCountryFast(context.request, cookieVal);

  if (!country) {
    // Slow path: ask Shopify which country it detects for this buyer's IP.
    // In local dev the buyer IP is loopback so we pass null — Shopify then uses
    // the server's connecting IP, which IS the buyer's machine → correct country.
    // In production without a CDN we pass the real client IP extracted from
    // x-forwarded-for, giving the same detection Shopify uses for the cart.
    const buyerIp = extractBuyerIp(context.request);
    country = await getLocalization(buyerIp) ?? DEFAULT_COUNTRY;
  }

  context.locals.country = country;
  return runWithContext({ country }, () => next());
});
