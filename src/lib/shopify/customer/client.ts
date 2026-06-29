// ============================================================
//  Customer Account GraphQL client. The OAuth access token is
//  sent directly as the Authorization header (no Bearer prefix,
//  no token exchange — see oauth.ts).
// ============================================================
import { ENDPOINTS } from './config';

export async function customerFetch<T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(ENDPOINTS.graphql, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || json.errors?.length) {
    throw new Error(json.errors?.[0]?.message ?? `Customer API error (${res.status})`);
  }
  return json.data as T;
}
