// ============================================================
//  Customer Account GraphQL client. The OAuth access token is
//  sent directly as the Authorization header (no Bearer prefix,
//  no token exchange — see oauth.ts).
// ============================================================
import { ENDPOINTS, CUSTOMER_API_USER_AGENT } from './config';

export async function customerFetch<T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(ENDPOINTS.graphql, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // Same abuse-protection bypass as the token exchange (see config.ts).
      'User-Agent': CUSTOMER_API_USER_AGENT,
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  // Read text first so a non-JSON block page surfaces its status/body
  // instead of crashing on JSON.parse.
  const raw = await res.text();
  let json: { data?: T; errors?: { message: string }[] };
  try {
    json = JSON.parse(raw) as typeof json;
  } catch {
    throw new Error(`Customer API returned non-JSON (HTTP ${res.status}): ${raw.slice(0, 300)}`);
  }
  if (!res.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message ?? `Customer API error (${res.status})`);
  }
  return json.data as T;
}
