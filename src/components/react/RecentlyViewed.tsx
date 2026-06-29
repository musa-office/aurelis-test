import { useState, useEffect } from 'react';

const LS_KEY = 'omnix_recently_viewed';
const MAX_DISPLAY = 4;

interface Money { amount: string; currencyCode: string; }
interface RVImage { url: string; altText?: string | null; }

interface RVProduct {
  handle: string;
  title: string;
  vendor: string | null;
  featuredImage: RVImage | null;
  price: Money;
  compareAt: Money | null;
  availableForSale: boolean;
  firstVariantId: string | null;
}

function fmt(amount: string, code: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(Number(amount));
}

function discountPct(price: Money, compareAt: Money | null): number | null {
  if (!compareAt || Number(compareAt.amount) <= Number(price.amount)) return null;
  return Math.round((1 - Number(price.amount) / Number(compareAt.amount)) * 100);
}

function EyeIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function RVCard({ p }: { p: RVProduct }) {
  const onSale = p.compareAt && Number(p.compareAt.amount) > Number(p.price.amount);
  const off = discountPct(p.price, p.compareAt);

  return (
    <article className="product-card">
      <div className="pc-media">
        <a href={`/products/${p.handle}`} style={{ display: 'block', width: '100%', height: '100%' }}>
          {p.featuredImage && (
            <>
              <img
                className="pc-img-main"
                src={p.featuredImage.url}
                alt={p.featuredImage.altText ?? p.title}
                loading="lazy"
              />
              <img
                className="pc-img-alt"
                src={p.featuredImage.url}
                alt=""
                loading="lazy"
              />
            </>
          )}
        </a>
        <div className="pc-badges">
          {onSale && off != null && <span className="pc-badge is-disc">-{off}%</span>}
          {!p.availableForSale && <span className="pc-badge">Sold Out</span>}
        </div>
        <div className="pc-quick">
          <button
            type="button"
            className="pc-quick-view"
            aria-label={`Quick view ${p.title}`}
            onClick={() =>
              window.dispatchEvent(new CustomEvent('qv:open', { detail: { handle: p.handle } }))
            }
          >
            <EyeIcon />
            View
          </button>
          <button
            type="button"
            className="pc-quick-add"
            aria-label={`Add ${p.title} to cart`}
            disabled={!p.availableForSale || !p.firstVariantId}
            onClick={() => {
              if (p.firstVariantId)
                window.dispatchEvent(
                  new CustomEvent('atc:quick', { detail: { variantId: p.firstVariantId } }),
                );
            }}
          >
            <CartIcon />
            Add to Cart
          </button>
        </div>
      </div>
      <div className="pc-body">
        {p.vendor && <div className="pc-brand">{p.vendor}</div>}
        <h3 className="pc-name">
          <a href={`/products/${p.handle}`}>{p.title}</a>
        </h3>
        <div className="pc-foot">
          <div className="pc-price-row">
            <span className="pc-price">{fmt(p.price.amount, p.price.currencyCode)}</span>
            {onSale && p.compareAt && (
              <span className="pc-price-orig">
                {fmt(p.compareAt.amount, p.compareAt.currencyCode)}
              </span>
            )}
          </div>
          <span className={`pc-stock ${p.availableForSale ? 'in' : 'out'}`}>
            {p.availableForSale ? 'In Stock' : 'Sold Out'}
          </span>
        </div>
      </div>
    </article>
  );
}

interface Props {
  currentHandle: string;
}

export default function RecentlyViewed({ currentHandle }: Props) {
  const [products, setProducts] = useState<RVProduct[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
      const handles = stored.filter((h) => h !== currentHandle).slice(0, MAX_DISPLAY);
      if (!handles.length) {
        setReady(true);
        return;
      }
      fetch(`/api/recently-viewed?handles=${handles.join(',')}`)
        .then((r) => r.json())
        .then((data: RVProduct[]) => {
          // preserve localStorage order (most recent first)
          const map = new Map(data.map((p) => [p.handle, p]));
          setProducts(handles.map((h) => map.get(h)).filter(Boolean) as RVProduct[]);
        })
        .catch(() => {})
        .finally(() => setReady(true));
    } catch {
      setReady(true);
    }
  }, [currentHandle]);

  if (!ready || !products.length) return null;

  return (
    <section style={{ padding: '80px 0', borderTop: '1px solid var(--line)' }}>
      <div className="container">
        <div className="sec-head">
          <div className="sec-eyebrow">
            <span className="sec-eyebrow-line" />
            <span className="sec-eyebrow-text">Your Journey</span>
            <span className="sec-eyebrow-line" />
          </div>
          <h2 className="sec-title">
            Recently <span className="t-gold">Viewed</span>
          </h2>
        </div>
        <div className="related-grid">
          {products.map((p) => (
            <RVCard key={p.handle} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
