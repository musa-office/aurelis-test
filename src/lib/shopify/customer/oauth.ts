// ============================================================
//  Customer Account API — OAuth 2.0 + PKCE flow.
//
//  IMPORTANT (public client, no secret):
//  The `authorization_code` token response returns an access
//  token that is used DIRECTLY as the Customer Account GraphQL
//  `Authorization` header — there is NO second token-exchange
//  step (that exchange is Hydrogen-only and is rejected here
//  with `unsupported_grant_type`).
//
//  The token endpoint REQUIRES an `Origin` header matching the
//  app's registered JavaScript origin (see origin.ts).
// ============================================================
import { CLIENT_ID, ENDPOINTS, OAUTH_SCOPES, CUSTOMER_API_USER_AGENT } from './config';
import { randomString, codeChallengeS256 } from './pkce';

export interface AuthorizeInit {
  url: string;
  verifier: string;
  state: string;
}

/** Build the Shopify authorize URL + the PKCE values to persist for the callback. */
export async function buildAuthorizeUrl(redirectUri: string): Promise<AuthorizeInit> {
  const verifier = randomString(32);
  const state = randomString(16);
  const nonce = randomString(16);
  const challenge = await codeChallengeS256(verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: OAUTH_SCOPES,
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  return { url: `${ENDPOINTS.authorize}?${params.toString()}`, verifier, state };
}

export interface TokenResponse {
  access_token: string;
  expires_in?: number;
  id_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

/** Exchange an authorization code for tokens (public client → no secret). */
export async function exchangeCodeForToken(opts: {
  code: string;
  redirectUri: string;
  verifier: string;
  origin: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID!,
    redirect_uri: opts.redirectUri,
    code: opts.code,
    code_verifier: opts.verifier,
  });

  const res = await fetch(ENDPOINTS.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Ask explicitly for JSON — without this the endpoint can answer
      // errors with an HTML page, which then fails JSON.parse.
      Accept: 'application/json',
      // A browser-like UA so Shopify's abuse protection doesn't 403 the
      // header-less Cloudflare Worker request (see config.ts).
      'User-Agent': CUSTOMER_API_USER_AGENT,
      // Required: must match the registered JavaScript origin.
      Origin: opts.origin,
    },
    body,
  });

  // Read as text first so a non-JSON (e.g. HTML error page) response is
  // surfaced with its status and a snippet instead of a cryptic
  // "Unexpected token '<'" JSON parse crash.
  const raw = await res.text();
  let data: TokenResponse;
  try {
    data = JSON.parse(raw) as TokenResponse;
  } catch {
    throw new Error(
      `Token endpoint returned non-JSON (HTTP ${res.status}) from ${ENDPOINTS.token} ` +
        `[origin=${opts.origin}]: ${raw.slice(0, 300)}`,
    );
  }
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || `Token exchange failed (${res.status})`);
  }
  return data;
}

/** Shopify logout URL — ends the Customer Account session, then returns home. */
export function buildLogoutUrl(idToken: string, postLogoutRedirectUri: string): string {
  const params = new URLSearchParams({
    id_token_hint: idToken,
    post_logout_redirect_uri: postLogoutRedirectUri,
  });
  return `${ENDPOINTS.logout}?${params.toString()}`;
}
