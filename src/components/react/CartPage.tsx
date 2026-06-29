// ============================================================
//  CartPage — the full /cart page body (live cart). Renders the
//  item list + order summary, or the empty state. Skinned with the
//  Aurelis cart.html markup/classes; reuses the shared cart store.
//  (Reward tiers, gift-wrap, promo, shipping selector deferred.)
// ============================================================
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { $cart, $cartError, $busyLines, updateItem, removeItem, checkout } from '~/stores/cart';
import { initCart } from '~/stores/cart';
import { addWish } from '~/stores/wishlist';
import type { CartLine } from '~/lib/shopify/types';
import { formatMoney } from '~/lib/utils';

export default function CartPage() {
  const cart = useStore($cart);
  const error = useStore($cartError);

  useEffect(() => { initCart(); }, []);

  const lines = cart?.lines ?? [];
  const count = cart?.totalQuantity ?? 0;
  const currency = cart?.cost?.subtotalAmount?.currencyCode ?? 'USD';
  const subtotal = Number(cart?.cost?.subtotalAmount?.amount ?? 0);

  if (!cart || lines.length === 0) {
    return (
      <section className="empty-cart is-visible">
        <div className="container">
          <div className="empty-icon">
            <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <h2 className="empty-title">Your cart is empty</h2>
          <p className="empty-desc">Discover curated luxury electronics — laptops, audio, wearables, and more — from the world's most refined brands.</p>
          <div className="empty-actions">
            <a href="/products" className="empty-btn">
              Start Shopping
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </a>
            <a href="/collections" className="empty-btn outline">Browse Collections</a>
          </div>
        </div>
      </section>
    );
  }

  const clearCart = async () => { for (const l of lines) await removeItem(l.id); };

  return (
    <section className="cart-layout">
      <div className="container">
        <div className="cart-grid">
          <div className="cart-left">
            <div className="cart-items-head">
              <div className="cih-title">{count} {count === 1 ? 'Item' : 'Items'} in Cart</div>
              <div className="cih-actions"><button onClick={clearCart}>Clear cart</button></div>
            </div>
            <div className="cart-items">
              {lines.map((line) => <CartItem key={line.id} line={line} currency={currency} />)}
            </div>
          </div>

          <aside className="summary" aria-label="Order summary">
            <div className="sum-head">
              <div className="sum-title">Order Summary</div>
              <div className="sum-sub">Review your order before checkout</div>
            </div>
            <div className="sum-body">
              <div className="sum-row">
                <span className="sum-row-label">Subtotal ({count} items)</span>
                <span className="sum-row-value">{formatMoney(subtotal, currency)}</span>
              </div>
              <div className="sum-row">
                <span className="sum-row-label">Shipping</span>
                <span className="sum-row-value">FREE</span>
              </div>
              <div className="sum-total">
                <span className="sum-total-label">Total</span>
                <div className="sum-total-block">
                  <div className="sum-total-value">{formatMoney(subtotal, currency)}</div>
                  <div className="sum-total-tax">{currency} · Tax at checkout</div>
                </div>
              </div>
            </div>
            {error && <p className="cart-error" role="alert">{error}</p>}
            <div className="checkout-block">
              <button className="checkout-btn" onClick={checkout}>
                Secure Checkout
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              </button>
              <div className="checkout-meta">
                <svg fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                Encrypted SSL checkout · 256-bit secure
              </div>
            </div>
            <div className="sum-trust">
              <div className="sum-trust-grid">
                <div className="sum-trust-item"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Free 30-day returns</div>
                <div className="sum-trust-item"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>2-year warranty</div>
                <div className="sum-trust-item"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>24/7 concierge</div>
                <div className="sum-trust-item"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /></svg>Authenticity guarantee</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function CartItem({ line, currency }: { line: CartLine; currency: string }) {
  const busyLines = useStore($busyLines);
  const busy = !!busyLines[line.id];
  const m = line.merchandise;
  const image = m.image ?? m.product?.featuredImage ?? null;
  const variants = m.selectedOptions.filter((o) => o.value !== 'Default Title');

  const save = () => {
    addWish({ handle: m.product.handle, title: m.product.title, price: formatMoney(m.price.amount, currency), image: image?.url ?? null, variantId: m.id });
    removeItem(line.id);
  };

  return (
    <article className="cart-item" data-id={line.id}>
      <div className="ci-media">
        <a href={`/products/${m.product.handle}`}>
          {image ? (
            <img src={image.url} alt={m.product.title} loading="lazy" />
          ) : (
            <span className="ci-media-ph" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
              </svg>
            </span>
          )}
        </a>
      </div>
      <div className="ci-info">
        <div className="ci-name"><a href={`/products/${m.product.handle}`}>{m.product.title}</a></div>
        {variants.length > 0 && (
          <div className="ci-variants">
            {variants.map((o) => <span className="ci-variant">{o.name}: <b>{o.value}</b></span>)}
          </div>
        )}
        <div className="ci-stock-row">
          <span className="ci-stock in"><span className="ci-stock-dot"></span>In stock</span>
        </div>
        <div className="ci-actions">
          <button className="ci-action-btn" onClick={save} disabled={busy}>
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
            Save for later
          </button>
          <span className="ci-action-sep">|</span>
          <button className="ci-action-btn remove" onClick={() => removeItem(line.id)} disabled={busy}>
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
            Remove
          </button>
        </div>
      </div>
      <div className="ci-right">
        <div className="ci-qty">
          <button className="ci-qty-btn" onClick={() => updateItem(line.id, line.quantity - 1)} disabled={busy || line.quantity <= 1}>−</button>
          <input type="text" value={line.quantity} readOnly aria-label="Qty" />
          <button className="ci-qty-btn" onClick={() => updateItem(line.id, line.quantity + 1)} disabled={busy}>+</button>
        </div>
        <div className="ci-price-block">
          <div className="ci-price-each">{formatMoney(m.price.amount, currency)} each</div>
          <div className="ci-price">{formatMoney(line.cost.totalAmount.amount, currency)}</div>
        </div>
      </div>
    </article>
  );
}
