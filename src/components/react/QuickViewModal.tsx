import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { addItem, openCart } from '~/stores/cart';

interface Money { amount: string; currencyCode: string; }
interface QVImage { url: string; altText?: string | null; }

interface ProductRating { value: number; count: number; }

interface QuickViewData {
  handle: string;
  title: string;
  vendor: string | null;
  description: string | null;
  featuredImage: QVImage | null;
  images: QVImage[];
  price: Money;
  compareAt: Money | null;
  availableForSale: boolean;
  firstVariantId: string | null;
  rating: ProductRating | null;
}

function fmt(amount: string, code: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(Number(amount));
}

function pct(price: Money, was: Money | null) {
  if (!was || Number(was.amount) <= 0) return null;
  return Math.round((1 - Number(price.amount) / Number(was.amount)) * 100);
}

export default function QuickViewModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<QuickViewData | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setData(null);
    setActiveImg(0);
    setQty(1);
    setAdded(false);
    document.body.classList.remove('drawer-open');
  }, []);

  // Handle quick-add from product cards and the spotlight "Add to Cart" button.
  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent<{ variantId: string; quantity?: number }>).detail;
      const variantId = detail?.variantId;
      if (!variantId) return;
      await addItem(variantId, Math.max(1, detail?.quantity ?? 1));
      openCart();
    };
    window.addEventListener('atc:quick', handler);
    return () => window.removeEventListener('atc:quick', handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const handle = (e as CustomEvent<{ handle: string }>).detail?.handle;
      if (!handle) return;
      setOpen(true);
      setLoading(true);
      setData(null);
      setActiveImg(0);
      setQty(1);
      setAdded(false);
      document.body.classList.add('drawer-open');
      fetch(`/api/product-quick?handle=${encodeURIComponent(handle)}`)
        .then((r) => r.json())
        .then((d: QuickViewData) => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    };
    window.addEventListener('qv:open', handler);
    return () => window.removeEventListener('qv:open', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const handleAddToCart = async () => {
    if (!data?.firstVariantId || !data.availableForSale) return;
    setAdding(true);
    try {
      await addItem(data.firstVariantId, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  };

  if (!open) return null;

  const imgs = data
    ? (data.images.length > 0 ? data.images : data.featuredImage ? [data.featuredImage] : [])
    : [];
  const off = data ? pct(data.price, data.compareAt) : null;
  const onSale = data?.compareAt && Number(data.compareAt.amount) > Number(data.price.amount);

  return createPortal(
    /* Backdrop is the flex-centering wrapper — click outside closes */
    <div className="pqv-backdrop" onClick={close} aria-hidden="true">
      <div
        className="pqv-modal"
        role="dialog"
        aria-modal="true"
        aria-label={data?.title ?? 'Product quick view'}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="pqv-close" onClick={close} aria-label="Close quick view" type="button">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading && (
          <div className="pqv-loading" aria-live="polite">
            <div className="pqv-spinner" />
            <p>Loading product&hellip;</p>
          </div>
        )}

        {!loading && data && (
          <div className="pqv-inner">
            {/* Gallery */}
            <div className="pqv-gallery">
              <div className="pqv-stage">
                {imgs[activeImg] ? (
                  <img
                    src={imgs[activeImg].url}
                    alt={imgs[activeImg].altText ?? data.title}
                    className="pqv-stage-img"
                  />
                ) : (
                  <div className="pqv-stage-empty" />
                )}
                {onSale && off !== null && (
                  <span className="pqv-badge">&minus;{off}%</span>
                )}
              </div>
              {imgs.length > 1 && (
                <div className="pqv-thumbs">
                  {imgs.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`pqv-thumb${i === activeImg ? ' active' : ''}`}
                      onClick={() => setActiveImg(i)}
                      aria-label={`Image ${i + 1}`}
                    >
                      <img src={img.url} alt={img.altText ?? ''} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="pqv-info">
              {data.vendor && <p className="pqv-vendor">{data.vendor}</p>}
              <h2 className="pqv-title">{data.title}</h2>

              {data.rating && (
                <div className="rating-row" style={{ marginBottom: '12px' }}>
                  <span
                    className="rating-stars"
                    aria-label={`${data.rating.value} out of 5 stars`}
                  >
                    <span
                      className="rating-fill"
                      style={{ width: `${((data.rating.value / 5) * 100).toFixed(1)}%` }}
                    >★★★★★</span>
                    ★★★★★
                  </span>
                  <span className="rating-value">{data.rating.value.toFixed(1)}</span>
                  <span className="rating-count">
                    ({data.rating.count >= 1000
                      ? `${(data.rating.count / 1000).toFixed(1)}K`
                      : data.rating.count} reviews)
                  </span>
                </div>
              )}

              <div className="pqv-pricing">
                <span className="pqv-price">{fmt(data.price.amount, data.price.currencyCode)}</span>
                {onSale && data.compareAt && (
                  <span className="pqv-compare">{fmt(data.compareAt.amount, data.compareAt.currencyCode)}</span>
                )}
              </div>

              {data.description && (
                <p className="pqv-desc">
                  {data.description.slice(0, 220)}{data.description.length > 220 ? '…' : ''}
                </p>
              )}

              {/* Qty + ATC */}
              <div className="pqv-actions">
                <div className="pqv-qty">
                  <button
                    type="button"
                    className="pqv-qty-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    disabled={qty <= 1}
                  >&minus;</button>
                  <span className="pqv-qty-val">{qty}</span>
                  <button
                    type="button"
                    className="pqv-qty-btn"
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="Increase quantity"
                  >+</button>
                </div>

                <button
                  type="button"
                  className={`pqv-atc${adding ? ' loading' : ''}${added ? ' added' : ''}`}
                  onClick={handleAddToCart}
                  disabled={!data.availableForSale || !data.firstVariantId || adding}
                >
                  {!data.availableForSale
                    ? 'Sold Out'
                    : adding
                      ? 'Adding…'
                      : added
                        ? '✓ Added'
                        : 'Add to Cart'}
                </button>
              </div>

              <a href={`/products/${data.handle}`} className="pqv-pdp-link" onClick={close}>
                View Full Details
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {!loading && !data && (
          <div className="pqv-loading">
            <p style={{ color: 'var(--taupe)' }}>Could not load product details.</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
