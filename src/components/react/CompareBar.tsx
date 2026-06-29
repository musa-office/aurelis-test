// ============================================================
//  CompareBar — sticky bottom bar that appears when products are
//  queued for comparison. Shows up to 4 thumbnails + "Compare"
//  button. "Compare" opens a full-screen modal with columns for
//  each selected product.
// ============================================================
import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { useFocusTrap } from './useFocusTrap';
import {
  $compare,
  $compareOpen,
  initCompare,
  removeCompare,
  clearCompare,
  openCompare,
  closeCompare,
  type CompareItem,
} from '~/stores/compare';
import { lockScroll, unlockScroll } from '~/stores/ui';

export default function CompareBar() {
  const items = useStore($compare);
  const open = useStore($compareOpen);
  const modalRef = useFocusTrap<HTMLElement>(open);

  useEffect(() => {
    initCompare();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCompare();
    document.addEventListener('keydown', onKey);
    lockScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
    };
  }, [open]);

  const visible = items.length > 0;

  return (
    <>
      {/* ── Bottom compare bar ── */}
      <div className={`compare-bar${visible ? ' visible' : ''}`} aria-hidden={!visible}>
        <div className="compare-bar-inner">
          <div className="compare-bar-slots">
            {Array.from({ length: 4 }).map((_, i) => {
              const item = items[i];
              return (
                <div key={i} className={`compare-slot${item ? ' filled' : ''}`}>
                  {item ? (
                    <>
                      {item.image
                        ? <img src={item.image} alt={item.title} className="compare-slot-img" loading="lazy" />
                        : <span className="compare-slot-no-img" />
                      }
                      <span className="compare-slot-name">{item.title}</span>
                      <button
                        className="compare-slot-remove"
                        onClick={() => removeCompare(item.id)}
                        aria-label={`Remove ${item.title} from compare`}
                      >
                        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <span className="compare-slot-empty">Add product</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="compare-bar-actions">
            <button
              className="compare-bar-btn compare-now-btn"
              onClick={openCompare}
              disabled={items.length < 2}
            >
              Compare ({items.length})
            </button>
            <button className="compare-bar-btn compare-clear-btn" onClick={clearCompare}>
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* ── Compare modal backdrop ── */}
      <div
        className={`compare-modal-backdrop${open ? ' open' : ''}`}
        onClick={closeCompare}
        aria-hidden="true"
      />

      {/* ── Compare modal ── */}
      <section
        ref={modalRef}
        className={`compare-modal${open ? ' open' : ''}`}
        role="dialog"
        aria-label="Compare products"
        aria-modal="true"
        aria-hidden={!open}
        tabIndex={-1}
      >
        <div className="compare-modal-head">
          <h2 className="compare-modal-title">
            Compare <em>({items.length} {items.length === 1 ? 'product' : 'products'})</em>
          </h2>
          <button
            className="compare-modal-close"
            onClick={closeCompare}
            aria-label="Close comparison"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="compare-modal-body">
          {items.length < 2 ? (
            <div className="compare-modal-empty">
              <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
              <p>Add at least 2 products to compare</p>
              <button className="compare-modal-close-link" onClick={closeCompare}>Continue Shopping</button>
            </div>
          ) : (
            <div className="compare-cols">
              {items.map((item) => (
                <CompareCol key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function CompareCol({ item }: { item: CompareItem }) {
  return (
    <div className="compare-col">
      <div className="compare-col-media">
        <a href={`/products/${item.handle}`} onClick={closeCompare}>
          {item.image
            ? <img src={item.image} alt={item.title} className="compare-col-img" loading="lazy" />
            : <span className="compare-col-no-img" />
          }
        </a>
      </div>
      {item.vendor && <p className="compare-col-vendor">{item.vendor}</p>}
      <h3 className="compare-col-title">
        <a href={`/products/${item.handle}`} onClick={closeCompare}>{item.title}</a>
      </h3>
      <p className="compare-col-price">{item.price}</p>
      <div className="compare-col-foot">
        <a
          href={`/products/${item.handle}`}
          className="compare-col-view"
          onClick={closeCompare}
        >
          View Product
        </a>
        <button className="compare-col-remove" onClick={() => removeCompare(item.id)}>
          Remove
        </button>
      </div>
    </div>
  );
}
