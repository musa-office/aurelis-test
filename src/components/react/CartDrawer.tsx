// ============================================================
//  CartDrawer — Aurelis slide-over cart. Mounted once, globally.
//  Reads the shared nanostore so it stays in sync with the header
//  badge and every add-to-cart button. All mutations hit the
//  same-origin /api/cart/* routes (server-side Shopify).
//  Skinned with the original Aurelis Luxury markup + classes.
// ============================================================
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { useFocusTrap } from './useFocusTrap';
import {
  $cart,
  $cartOpen,
  $cartBusy,
  $busyLines,
  $cartError,
  closeCart,
  updateItem,
  removeItem,
  checkout,
} from '~/stores/cart';
import type { CartLine } from '~/lib/shopify/types';
import { formatMoney } from '~/lib/utils';
import { SITE } from '~/config/site';
import { lockScroll, unlockScroll } from '~/stores/ui';

export default function CartDrawer() {
  const cart = useStore($cart);
  const open = useStore($cartOpen);
  const busy = useStore($cartBusy);
  const error = useStore($cartError);
  const panelRef = useFocusTrap<HTMLElement>(open);

  // Esc to close + body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart();
    document.addEventListener('keydown', onKey);
    lockScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
    };
  }, [open]);

  const lines = cart?.lines ?? [];
  const count = cart?.totalQuantity ?? 0;
  const currency = cart?.cost?.subtotalAmount?.currencyCode ?? 'USD';
  const subtotal = Number(cart?.cost?.subtotalAmount?.amount ?? 0);
  const threshold = SITE.freeShippingThreshold;
  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, threshold > 0 ? (subtotal / threshold) * 100 : 0);
  const empty = lines.length === 0;

  return (
    <>
      <div
        className={`cart-backdrop${open ? ' open' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        className={`cart-drawer${open ? ' open' : ''}`}
        aria-label="Shopping cart"
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className="cart-drawer-head">
          <div className="cart-drawer-title">
            Your Cart <em>({count} {count === 1 ? 'item' : 'items'})</em>
          </div>
          <button className="cart-close-btn" onClick={closeCart} aria-label="Close cart">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!empty && (
          <div className="cart-shipping-bar">
            <div className="cart-shipping-text">
              {remaining > 0 ? (
                <>You're <strong>{formatMoney(remaining, currency)}</strong> away from free shipping</>
              ) : (
                <strong>You've unlocked free shipping ✦</strong>
              )}
            </div>
            <div className="cart-shipping-track">
              <div className="cart-shipping-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {empty ? (
          <div className="cart-empty show">
            <div className="cart-empty-icon">
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <h4 className="cart-empty-title">Your cart is empty</h4>
            <p className="cart-empty-sub">Discover premium electronics curated just for you.</p>
            <button
              className="cart-checkout-btn"
              onClick={closeCart}
              style={{ background: 'var(--gold)', color: 'var(--obsidian)', marginBottom: 0 }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {lines.map((line) => (
                <CartItemRow key={line.id} line={line} currency={currency} />
              ))}
            </div>

            <div className="cart-drawer-foot">
              {error && <div className="cart-error" role="alert">{error}</div>}
              <div className="cart-totals-row">
                <span>Subtotal</span>
                <span id="cart-subtotal">{formatMoney(subtotal, currency)}</span>
              </div>
              <div className="cart-totals-row">
                <span>Shipping</span>
                <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                  {remaining > 0 ? 'Calculated at checkout' : 'Free'}
                </span>
              </div>
              <div className="cart-totals-row total">
                <span>Total</span>
                <span className="cart-total-amount">{formatMoney(subtotal, currency)}</span>
              </div>
              <button className="cart-checkout-btn" onClick={checkout} disabled={busy}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {busy ? 'Working…' : 'Secure Checkout'}
              </button>
              <a href="/cart" className="cart-view-link">View full cart</a>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function CartItemRow({ line, currency }: { line: CartLine; currency: string }) {
  const busyLines = useStore($busyLines);
  const busy = !!busyLines[line.id];
  const m = line.merchandise;
  const image = m.image ?? m.product?.featuredImage ?? null;
  const variant = m.selectedOptions
    .filter((o) => o.value !== 'Default Title')
    .map((o) => o.value)
    .join(' · ');

  return (
    <div className="cart-item">
      <a href={`/products/${m.product.handle}`} className="cart-item-img" onClick={closeCart}>
        {image ? (
          <img src={image.url} alt={image.altText ?? m.product.title} loading="lazy" />
        ) : (
          <span className="cart-item-img-ph" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
            </svg>
          </span>
        )}
      </a>

      <div className="cart-item-info">
        <a
          href={`/products/${m.product.handle}`}
          className="cart-item-name"
          onClick={closeCart}
          style={{ display: 'block' }}
        >
          {m.product.title}
        </a>
        {variant && <div className="cart-item-variant">{variant}</div>}
        <div className="cart-item-qty">
          <button
            className="cart-qty-btn"
            onClick={() => updateItem(line.id, line.quantity - 1)}
            disabled={busy}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="cart-qty-val">{line.quantity}</span>
          <button
            className="cart-qty-btn"
            onClick={() => updateItem(line.id, line.quantity + 1)}
            disabled={busy}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="cart-item-right">
        <div className="cart-item-price">{formatMoney(line.cost.totalAmount.amount, currency)}</div>
        <button
          className="cart-item-remove"
          onClick={() => removeItem(line.id)}
          disabled={busy}
          aria-label={`Remove ${m.product.title}`}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
