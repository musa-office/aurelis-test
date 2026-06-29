// ============================================================
//  UI store — shared open/close state for global overlays that
//  aren't owned by a data store (e.g. the search overlay). The
//  cart drawer uses $cartOpen in stores/cart.ts; the wishlist
//  drawer uses $wishOpen in stores/wishlist.ts.
// ============================================================
import { atom } from 'nanostores';

export const $searchOpen = atom<boolean>(false);

export function openSearch(): void {
  $searchOpen.set(true);
}
export function closeSearch(): void {
  $searchOpen.set(false);
}

/**
 * Toggle a body class so CSS can lock scroll while any drawer/overlay
 * is open. Reference-counted so closing one overlay doesn't unlock the
 * page while another is still open.
 */
let lockCount = 0;
export function lockScroll(): void {
  lockCount += 1;
  document.body.classList.add('drawer-open');
}
export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.classList.remove('drawer-open');
}
