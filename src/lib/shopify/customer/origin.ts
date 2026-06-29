// ============================================================
//  Resolve the request's public origin (scheme://host).
//  The Customer Account API token endpoint REQUIRES an `Origin`
//  header matching the app's registered JavaScript origin, and
//  the OAuth redirect_uri must be absolute — both are derived
//  from the forwarded proto/host so this works behind an HTTPS
//  tunnel (Shopify rejects http/localhost for this API).
// ============================================================
import type { APIContext } from 'astro';

export function getOrigin(context: APIContext | { request: Request }): string {
  const req = context.request;
  const headers = req.headers;
  const forwardedProto = headers.get('x-forwarded-proto');
  const forwardedHost = headers.get('x-forwarded-host') ?? headers.get('host');

  if (forwardedHost) {
    // Honor the forwarded scheme; Shopify needs https for this API.
    const proto = forwardedProto ?? 'https';
    return `${proto}://${forwardedHost}`;
  }
  // Fallback to the request URL's origin.
  return new URL(req.url).origin;
}

/** Absolute redirect_uri for the OAuth callback. */
export function getRedirectUri(
  context: APIContext | { request: Request },
  callbackPath: string,
): string {
  return `${getOrigin(context)}${callbackPath}`;
}
