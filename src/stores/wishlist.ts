// ============================================================
//  Wishlist store (nanostores) — client-side only, persisted to
//  localStorage. Shopify has no native wishlist, so this lives
//  entirely in the browser and is shared across every island.
// ============================================================
import { atom } from 'nanostores';

export interface WishItem {
  /** Product handle — the stable key + link target. */
  handle: string;
  title: string;
  /** Display price string (already formatted) or numeric amount. */
  price: string;
  image?: string | null;
  /** Default variant id, so "Add to cart" from the wishlist works. */
  variantId?: string | null;
}

const STORAGE_KEY = 'omnix:wishlist';

export const $wishlist = atom<WishItem[]>([]);
export const $wishOpen = atom<boolean>(false);

let hydrated = false;

/** Load persisted items once on first island mount. */
export function initWishlist(): void {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) $wishlist.set(JSON.parse(raw) as WishItem[]);
  } catch {
    /* corrupt/absent — start empty */
  }
}

function persist(items: WishItem[]): void {
  $wishlist.set(items);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full / unavailable — keep in-memory only */
  }
}

export function isWished(handle: string): boolean {
  return $wishlist.get().some((i) => i.handle === handle);
}

export function addWish(item: WishItem): void {
  if (isWished(item.handle)) return;
  persist([...$wishlist.get(), item]);
}

export function removeWish(handle: string): void {
  persist($wishlist.get().filter((i) => i.handle !== handle));
}

/** Add if absent, remove if present. Returns the new wished state. */
export function toggleWish(item: WishItem): boolean {
  if (isWished(item.handle)) {
    removeWish(item.handle);
    return false;
  }
  addWish(item);
  return true;
}

export function clearWishlist(): void {
  persist([]);
}

export function openWish(): void {
  $wishOpen.set(true);
}
export function closeWish(): void {
  $wishOpen.set(false);
}
