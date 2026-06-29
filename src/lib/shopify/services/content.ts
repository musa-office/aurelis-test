// ============================================================
//  Content services — menus + shop (2026-04)
// ============================================================
import { shopifyFetch } from '../client';
import { MENU_QUERY, SHOP_QUERY, PAGE_QUERY, BLOG_ARTICLES_QUERY, BLOG_ARTICLE_QUERY, LOCALIZATION_QUERY, COUNTRY_CURRENCY_QUERY, AVAILABLE_CURRENCIES_QUERY } from '../graphql/content';
import { countryCurrency } from '../../utils';
import type { BlogArticle, Menu, Shop } from '../types';

type Raw = Record<string, any>;

function nodes<T>(connection?: { edges?: { node: T }[] } | null): T[] {
  return connection?.edges?.map((e) => e.node) ?? [];
}

/**
 * Fetch the latest `count` articles from a Shopify blog.
 * Returns an empty array (never throws) so a missing/empty blog
 * gracefully falls back to static placeholders in the component.
 */
export async function getBlogArticles(blogHandle: string, count = 3): Promise<BlogArticle[]> {
  try {
    const data = await shopifyFetch<{ blog: { articles: { edges: { node: Raw }[] } } | null }>(
      BLOG_ARTICLES_QUERY,
      { handle: blogHandle, first: count },
    );
    if (!data.blog) return [];
    return nodes<Raw>(data.blog.articles).map((a) => ({
      id: a.id,
      title: a.title,
      handle: a.handle,
      blogHandle,
      excerpt: a.excerpt ?? null,
      publishedAt: a.publishedAt,
      image: a.image ?? null,
      authorName: (a.author as { name: string } | null)?.name ?? null,
      tags: (a.tags as string[]) ?? [],
      contentHtml: a.contentHtml ?? '',
    }));
  } catch {
    return [];
  }
}

export interface ShopifyPage {
  id: string;
  title: string;
  handle: string;
  body: string;
  bodySummary?: string;
  seo?: { title?: string | null; description?: string | null };
}

/** A CMS page by handle, or null if it doesn't exist. */
export async function getPage(handle: string): Promise<ShopifyPage | null> {
  const data = await shopifyFetch<{ page: ShopifyPage | null }>(PAGE_QUERY, { handle });
  return data.page ?? null;
}

/** Navigation menu by handle (e.g. "main-menu", "footer"). Null if missing. */
export async function getMenu(handle: string): Promise<Menu | null> {
  const data = await shopifyFetch<{ menu: Menu | null }>(MENU_QUERY, { handle });
  return data.menu ?? null;
}

/** Shop name + primary domain. */
export async function getShop(): Promise<Shop> {
  const data = await shopifyFetch<{ shop: Shop }>(SHOP_QUERY);
  return data.shop;
}

/**
 * Ask Shopify which country it detects for the given buyer IP.
 * Pass buyerIp to forward it as Shopify-Storefront-Buyer-IP; omit/null to let
 * Shopify use the server's connecting IP (useful in local dev where server = buyer machine).
 * Returns the ISO-3166 country code Shopify resolved, or null on any error.
 */
export async function getLocalization(buyerIp?: string | null): Promise<string | null> {
  try {
    const data = await shopifyFetch<{ localization: { country: { isoCode: string } } }>(
      LOCALIZATION_QUERY,
      {},
      { buyerIp: buyerIp ?? undefined },
    );
    return data.localization?.country?.isoCode ?? null;
  } catch {
    return null;
  }
}

// Presentment currency is store configuration (stable per country), so cache
// each country's result for the process lifetime to avoid a Shopify round-trip
// on every page render.
const currencyCache = new Map<string, { code: string; symbol: string }>();

/**
 * The live presentment currency Shopify uses for `country` (code + symbol),
 * sourced from Shopify so it always agrees with the catalogue/cart prices.
 * Falls back to a local country→currency map if the call fails.
 */
export async function getCurrencyForCountry(
  country?: string | null,
): Promise<{ code: string; symbol: string }> {
  const key = (country ?? '').toUpperCase() || 'US';
  const cached = currencyCache.get(key);
  if (cached) return cached;

  let result = countryCurrency(key); // local fallback
  try {
    const data = await shopifyFetch<{
      localization: { country: { currency: { isoCode: string; symbol: string } | null } | null } | null;
    }>(COUNTRY_CURRENCY_QUERY, { country: key });
    const cur = data.localization?.country?.currency;
    if (cur?.isoCode) result = { code: cur.isoCode, symbol: cur.symbol || result.symbol };
  } catch {
    // keep the local fallback
  }
  currencyCache.set(key, result);
  return result;
}

export interface CurrencyChoice {
  /** ISO 4217 currency code, e.g. "USD". */
  code: string;
  /** Display symbol, e.g. "$". */
  symbol: string;
  /** A country code that resolves to this presentment currency (set as the
   *  country cookie to switch). */
  country: string;
}

// Canonical "home" country for currencies that several countries fall back to
// (e.g. many non-Eurozone countries present in USD) — so the switcher shows
// USD via US rather than whichever country happened to come first.
const PRIMARY_COUNTRY: Record<string, string> = {
  USD: 'US', EUR: 'DE', GBP: 'GB', AUD: 'AU', CAD: 'CA', CHF: 'CH',
};

let currenciesCache: CurrencyChoice[] | null = null;

/**
 * The store's available presentment currencies (one entry per currency),
 * for the header currency switcher. Cached for the process lifetime.
 */
export async function getAvailableCurrencies(): Promise<CurrencyChoice[]> {
  if (currenciesCache) return currenciesCache;
  try {
    const data = await shopifyFetch<{
      localization: { availableCountries: { isoCode: string; currency: { isoCode: string; symbol: string } | null }[] } | null;
    }>(AVAILABLE_CURRENCIES_QUERY, {});

    const byCurrency = new Map<string, CurrencyChoice>();
    for (const c of data.localization?.availableCountries ?? []) {
      const cur = c.currency;
      if (!cur?.isoCode) continue;
      const existing = byCurrency.get(cur.isoCode);
      // Keep the first match, but let the canonical home country win if present.
      if (!existing || PRIMARY_COUNTRY[cur.isoCode] === c.isoCode) {
        byCurrency.set(cur.isoCode, { code: cur.isoCode, symbol: cur.symbol, country: c.isoCode });
      }
    }
    const list = [...byCurrency.values()].sort((a, b) => a.code.localeCompare(b.code));
    if (list.length) currenciesCache = list; // don't cache an empty/failed result
    return list;
  } catch {
    return [];
  }
}

/** Fetch a single blog article by blog handle + article handle. Returns null if not found. */
export async function getArticle(blogHandle: string, articleHandle: string): Promise<BlogArticle | null> {
  try {
    const data = await shopifyFetch<{ blog: { articleByHandle: Record<string, any> } | null }>(
      BLOG_ARTICLE_QUERY,
      { blogHandle, articleHandle },
    );
    if (!data.blog?.articleByHandle) return null;
    const a = data.blog.articleByHandle;
    return {
      id: a.id,
      title: a.title,
      handle: a.handle,
      blogHandle,
      excerpt: a.excerpt ?? null,
      publishedAt: a.publishedAt,
      image: a.image ?? null,
      authorName: (a.author as { name: string } | null)?.name ?? null,
      tags: (a.tags as string[]) ?? [],
      contentHtml: a.contentHtml ?? '',
    };
  } catch {
    return null;
  }
}
