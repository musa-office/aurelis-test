// ============================================================
//  Customer Account API GraphQL — profile + recent orders.
// ============================================================
import { customerFetch } from './client';

export interface CustomerProfile {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  emailAddress?: { emailAddress?: string | null } | null;
  defaultAddress?: {
    formatted?: string[] | null;
  } | null;
  orders?: {
    edges: {
      node: {
        id: string;
        name: string;
        processedAt: string;
        totalPrice?: { amount: string; currencyCode: string } | null;
        fulfillmentStatus?: string | null;
      };
    }[];
  } | null;
}

const CUSTOMER_QUERY = /* GraphQL */ `
  query CustomerProfile {
    customer {
      firstName
      lastName
      displayName
      emailAddress { emailAddress }
      defaultAddress { formatted }
      orders(first: 5, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            name
            processedAt
            totalPrice { amount currencyCode }
            fulfillmentStatus
          }
        }
      }
    }
  }
`;

/** Fetch the signed-in customer's profile + recent orders. */
export async function getCustomer(accessToken: string): Promise<CustomerProfile | null> {
  const data = await customerFetch<{ customer: CustomerProfile | null }>(accessToken, CUSTOMER_QUERY);
  return data.customer ?? null;
}
