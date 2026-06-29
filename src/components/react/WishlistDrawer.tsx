// ============================================================
//  WishlistDrawer — Aurelis slide-over wishlist. Mounted once,
//  globally. Backed by the localStorage wishlist store (Shopify
//  has no native wishlist). "Add to cart" bridges to the cart
//  store when a default variant id is known.
// ============================================================
import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { useFocusTrap } from './useFocusTrap';
import {
  $wishlist,
  $wishOpen,
  closeWish,
  removeWish,
  type WishItem,
} from '~/stores/wishlist';
import { addItem, openCart } from '~/stores/cart';
import { lockScroll, unlockScroll } from '~/stores/ui';

export default function WishlistDrawer() {
  const items = useStore($wishlist);
  const open = useStore($wishOpen);
  const panelRef = useFocusTrap<HTMLElement>(open);
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeWish();
    document.addEventListener('keydown', onKey);
    lockScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
    };
  }, [open]);

  const empty = items.length === 0;

  const addAll = async () => {
    if (addingAll) return;
    const withVariant = items.filter((i) => i.variantId);
    if (withVariant.length === 0) return;
    setAddingAll(true);
    try {
      for (const item of withVariant) {
        await addItem(item.variantId!, 1, { open: false });
      }
      closeWish();
      openCart();
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <>
      <div
        className={`wish-backdrop${open ? ' open' : ''}`}
        onClick={closeWish}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        className={`wish-drawer${open ? ' open' : ''}`}
        aria-label="Wishlist"
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className="wish-drawer-head">
          <div className="wish-drawer-title">
            Wishlist <em>({items.length} {items.length === 1 ? 'item' : 'items'})</em>
          </div>
          <button className="wish-close-btn" onClick={closeWish} aria-label="Close wishlist">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {empty ? (
          <div className="wish-empty show">
            <svg width="52" height="52" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <p>Your wishlist is empty</p>
            <button className="wish-empty-btn" onClick={closeWish}>Continue Shopping</button>
          </div>
        ) : (
          <>
            <div className="wish-items">
              {items.map((item) => (
                <WishItemRow key={item.handle} item={item} />
              ))}
            </div>
            <div className="wish-footer">
              <button className="wish-all-atc-btn" onClick={addAll} disabled={addingAll}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {addingAll ? 'Adding…' : 'Add All to Cart'}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function WishItemRow({ item }: { item: WishItem }) {
  return (
    <div className="wish-item">
      <a href={`/products/${item.handle}`} onClick={closeWish}>
        {item.image ? (
          <img className="wish-item-img" src={item.image} alt={item.title} loading="lazy" />
        ) : (
          <span className="wish-item-img" />
        )}
      </a>
      <div className="wish-item-info">
        <a href={`/products/${item.handle}`} className="wish-item-name" onClick={closeWish} style={{ display: 'block' }}>
          {item.title}
        </a>
        <p className="wish-item-price">{item.price}</p>
        {item.variantId ? (
          <button
            className="wish-item-atc"
            onClick={() => addItem(item.variantId!, 1)}
          >
            Add to Cart
          </button>
        ) : (
          <a className="wish-item-atc" href={`/products/${item.handle}`} onClick={closeWish}>
            View Product
          </a>
        )}
      </div>
      <button className="wish-remove-btn" onClick={() => removeWish(item.handle)} aria-label={`Remove ${item.title}`}>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
