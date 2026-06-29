// ============================================================
//  HeaderActions — the search / wishlist / cart buttons in the
//  header. A single island so all three counts stay live off the
//  shared stores. Mirrors the original Aurelis header markup.
// ============================================================
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $cart, initCart, openCart } from '~/stores/cart';
import { $wishlist, initWishlist, openWish } from '~/stores/wishlist';
import { openSearch } from '~/stores/ui';

export default function HeaderActions() {
  const cart = useStore($cart);
  const wishlist = useStore($wishlist);

  // Hydrate both stores once on first mount.
  useEffect(() => {
    initCart();
    initWishlist();
  }, []);

  const cartCount = cart?.totalQuantity ?? 0;
  const wishCount = wishlist.length;

  return (
    <div className="header-actions">
      <button className="icon-btn" aria-label="Search" onClick={openSearch}>
        <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button className="icon-btn" aria-label="Open wishlist" onClick={openWish}>
        <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        {wishCount > 0 && <span className="wish-count-badge">{wishCount}</span>}
      </button>

      <button className="header-cart-btn" aria-label="Open shopping cart" onClick={openCart}>
        <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
        </svg>
        <span className="cart-label">Cart ({cartCount})</span>
        {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
      </button>
    </div>
  );
}
