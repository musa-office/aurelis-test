// ============================================================
//  Customer Account API — configuration & endpoint builders.
//  The "new" Shopify Customer Accounts (GraphQL) use a public
//  OAuth 2.0 + PKCE client (no secret). All values are read from
//  server-only env; `isCustomerAuthConfigured` lets the UI and
//  routes degrade gracefully when the store hasn't set it up yet.
// ============================================================

function env(key: string): string | undefined {
  const meta = (import.meta.env as Record<string, string | undefined>)[key];
  if (meta) return meta;
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.[key];
}

/** Public OAuth client id of the Customer Account API app. */
export const CLIENT_ID = env('CUSTOMER_ACCOUNT_API_CLIENT_ID');
/** Numeric shop id (Settings → ... or the Customer Account API page). */
export const SHOP_ID = env('SHOPIFY_SHOP_ID');
/** Customer Account API version (distinct from the Storefront version). */
export const CUSTOMER_API_VERSION = env('CUSTOMER_ACCOUNT_API_VERSION') ?? '2025-01';

/** True only when all required Customer Account API env vars are present. */
export const isCustomerAuthConfigured = Boolean(CLIENT_ID && SHOP_ID);

/** OAuth scopes — `customer-account-api:full` grants the GraphQL customer API. */
export const OAUTH_SCOPES = 'openid email customer-account-api:full';

const AUTH_BASE = SHOP_ID ? `https://shopify.com/authentication/${SHOP_ID}` : '';

export const ENDPOINTS = {
  authorize: `${AUTH_BASE}/oauth/authorize`,
  token: `${AUTH_BASE}/oauth/token`,
  logout: `${AUTH_BASE}/logout`,
  /** Customer Account GraphQL endpoint. */
  graphql: SHOP_ID
    ? `https://shopify.com/${SHOP_ID}/account/customer/api/${CUSTOMER_API_VERSION}/graphql`
    : '',
};

/** The OAuth redirect/callback path (must be registered in the Shopify app). */
export const CALLBACK_PATH = '/account/authorize';
