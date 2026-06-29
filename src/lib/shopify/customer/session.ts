// ============================================================
//  Customer session — httpOnly cookies hold the OAuth tokens so
//  they are never readable by client JS. Transient verifier/state
//  cookies bridge the login → callback round-trip only.
// ============================================================
import type { AstroCookies } from 'astro';

const ACCESS = 'omnix_ca_access';   // Customer Account access token
const ID_TOKEN = 'omnix_ca_idtok';  // OpenID id_token (needed for logout)
const REFRESH = 'omnix_ca_refresh'; // refresh token
const EXPIRY = 'omnix_ca_exp';      // access-token expiry (epoch ms)
const VERIFIER = 'omnix_ca_pkce';   // transient: PKCE code_verifier
const STATE = 'omnix_ca_state';     // transient: OAuth state

const secure = import.meta.env.PROD;
const base = { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' };

export interface CustomerTokens {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  /** Seconds until the access token expires. */
  expiresIn?: number;
}

export function setSession(cookies: AstroCookies, t: CustomerTokens): void {
  const maxAge = Math.max(60, t.expiresIn ?? 7200);
  cookies.set(ACCESS, t.accessToken, { ...base, maxAge });
  if (t.idToken) cookies.set(ID_TOKEN, t.idToken, { ...base, maxAge: 60 * 60 * 24 * 7 });
  if (t.refreshToken) cookies.set(REFRESH, t.refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
  cookies.set(EXPIRY, String(Date.now() + maxAge * 1000), { ...base, maxAge });
}

export function getAccessToken(cookies: AstroCookies): string | undefined {
  return cookies.get(ACCESS)?.value || undefined;
}

export function getIdToken(cookies: AstroCookies): string | undefined {
  return cookies.get(ID_TOKEN)?.value || undefined;
}

export function getRefreshToken(cookies: AstroCookies): string | undefined {
  return cookies.get(REFRESH)?.value || undefined;
}

/** Cheap server-side "is the visitor signed in?" check (presence of token). */
export function isLoggedIn(cookies: AstroCookies): boolean {
  return Boolean(getAccessToken(cookies));
}

export function clearSession(cookies: AstroCookies): void {
  for (const name of [ACCESS, ID_TOKEN, REFRESH, EXPIRY, VERIFIER, STATE]) {
    cookies.delete(name, { path: '/' });
  }
}

// ── Transient PKCE bridge (login → callback) ────────────────
export function setPkce(cookies: AstroCookies, verifier: string, state: string): void {
  const opts = { ...base, maxAge: 60 * 10 }; // 10 minutes is plenty for a login
  cookies.set(VERIFIER, verifier, opts);
  cookies.set(STATE, state, opts);
}

export function getPkce(cookies: AstroCookies): { verifier?: string; state?: string } {
  return { verifier: cookies.get(VERIFIER)?.value, state: cookies.get(STATE)?.value };
}

export function clearPkce(cookies: AstroCookies): void {
  cookies.delete(VERIFIER, { path: '/' });
  cookies.delete(STATE, { path: '/' });
}
