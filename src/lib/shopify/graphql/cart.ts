// ============================================================
//  Cart GraphQL operations (Storefront API 2026-04)
// ============================================================
// The Cart API *is* the checkout: build a cart, then send the
// buyer to cart.checkoutUrl. There is no checkoutCreate anymore.
import { CART_FRAGMENTS } from './fragments';

export const CART_CREATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENTS}
  mutation CartCreate($input: CartInput!, $country: CountryCode) @inContext(country: $country) {
    cartCreate(input: $input) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
`;

export const CART_QUERY = /* GraphQL */ `
  ${CART_FRAGMENTS}
  query GetCart($id: ID!, $country: CountryCode) @inContext(country: $country) {
    cart(id: $id) {
      ...CartFields
    }
  }
`;

/** Re-prices an existing cart into a new country's presentment currency.
 *  (@inContext alone does NOT re-price a cart; its buyerIdentity does.) */
export const CART_BUYER_IDENTITY_UPDATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENTS}
  mutation CartBuyerIdentityUpdate($cartId: ID!, $countryCode: CountryCode!, $country: CountryCode) @inContext(country: $country) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: { countryCode: $countryCode }) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENTS}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $country: CountryCode) @inContext(country: $country) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENTS}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, $country: CountryCode) @inContext(country: $country) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENTS}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!, $country: CountryCode) @inContext(country: $country) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
        target
      }
    }
  }
`;

export const CART_DISCOUNT_CODES_UPDATE_MUTATION = /* GraphQL */ `
  ${CART_FRAGMENTS}
  mutation CartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!, $country: CountryCode) @inContext(country: $country) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
    }
  }
`;
