// ============================================================
//  Cart services — the Cart API is the checkout (2026-04)
// ============================================================
import { shopifyFetch, type ShopifyFetchOptions } from '../client';
import {
  CART_CREATE_MUTATION,
  CART_QUERY,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_BUYER_IDENTITY_UPDATE_MUTATION,
} from '../graphql/cart';
import { getCountry } from '../context';
import { mapCart } from '../transforms';
import type { Cart } from '../types';

export interface UserError {
  field?: string[] | null;
  message: string;
}

export interface CartResult {
  cart: Cart | null;
  userErrors: UserError[];
}

export interface CartLineInput {
  merchandiseId: string;
  quantity: number;
}

export interface CartLineUpdateInput {
  id: string;
  quantity?: number;
  merchandiseId?: string;
}

function result(mutationPayload: any): CartResult {
  return {
    cart: mapCart(mutationPayload?.cart),
    userErrors: mutationPayload?.userErrors ?? [],
  };
}

/** Create a cart, optionally with initial lines. */
export async function createCart(
  lines: CartLineInput[] = [],
  opts: ShopifyFetchOptions = {},
): Promise<CartResult> {
  const country = getCountry();
  const data = await shopifyFetch<{ cartCreate: any }>(
    CART_CREATE_MUTATION,
    {
      input: {
        lines,
        // Pin the cart's presentment currency to the same country the
        // catalogue is localized to, so prices and the cart never disagree.
        buyerIdentity: { countryCode: country },
        attributes: [{ key: 'source', value: 'astro-storefront' }],
      },
      country,
    },
    opts,
  );
  return result(data.cartCreate);
}

/** Re-price an existing cart into `countryCode`'s presentment currency. */
export async function updateCartBuyerIdentity(
  cartId: string,
  countryCode: string,
  opts: ShopifyFetchOptions = {},
): Promise<CartResult> {
  const data = await shopifyFetch<{ cartBuyerIdentityUpdate: any }>(
    CART_BUYER_IDENTITY_UPDATE_MUTATION,
    { cartId, countryCode, country: countryCode },
    opts,
  );
  return result(data.cartBuyerIdentityUpdate);
}

/**
 * Fetch a cart by id; returns null when the cart no longer exists. If the
 * cart's currency country differs from the request's active country (e.g. the
 * shopper just switched currency), re-price it so the mini-cart and cart page
 * match the catalogue. `@inContext` alone does NOT re-price an existing cart.
 */
export async function getCart(
  cartId: string,
  opts: ShopifyFetchOptions = {},
): Promise<Cart | null> {
  const country = getCountry();
  const data = await shopifyFetch<{ cart: any | null }>(
    CART_QUERY,
    { id: cartId, country },
    opts,
  );
  const cart = mapCart(data.cart);
  if (cart && country && cart.buyerCountry !== country) {
    const repriced = await updateCartBuyerIdentity(cartId, country, opts);
    if (repriced.cart) return repriced.cart;
  }
  return cart;
}

export async function addCartLines(
  cartId: string,
  lines: CartLineInput[],
  opts: ShopifyFetchOptions = {},
): Promise<CartResult> {
  const data = await shopifyFetch<{ cartLinesAdd: any }>(
    CART_LINES_ADD_MUTATION,
    { cartId, lines, country: getCountry() },
    opts,
  );
  return result(data.cartLinesAdd);
}

export async function updateCartLines(
  cartId: string,
  lines: CartLineUpdateInput[],
  opts: ShopifyFetchOptions = {},
): Promise<CartResult> {
  const data = await shopifyFetch<{ cartLinesUpdate: any }>(
    CART_LINES_UPDATE_MUTATION,
    { cartId, lines, country: getCountry() },
    opts,
  );
  return result(data.cartLinesUpdate);
}

export async function removeCartLines(
  cartId: string,
  lineIds: string[],
  opts: ShopifyFetchOptions = {},
): Promise<CartResult> {
  const data = await shopifyFetch<{ cartLinesRemove: any }>(
    CART_LINES_REMOVE_MUTATION,
    { cartId, lineIds, country: getCountry() },
    opts,
  );
  return result(data.cartLinesRemove);
}
