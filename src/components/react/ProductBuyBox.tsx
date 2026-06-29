// ============================================================
//  ProductBuyBox — the interactive PDP buy box. One island so
//  option + quantity state stays consistent. Generic over any
//  Shopify option set: a colour/finish option renders as swatches,
//  everything else as pills. Add to cart / Buy now use the shared
//  cart store; Wishlist uses the localStorage wishlist store.
//  Skinned with the original Aurelis pi-* markup + classes.
// ============================================================
import { useMemo, useState, useEffect, useRef, type CSSProperties } from 'react';
import { useStore } from '@nanostores/react';
import type { Image, ProductOption, ProductOptionValue, ProductVariant } from '~/lib/shopify/types';
import { formatMoney, isOnSale } from '~/lib/utils';
import { addItem, buyNow } from '~/stores/cart';
import { $wishlist, toggleWish, isWished, openWish } from '~/stores/wishlist';
import { $compare, toggleCompare, isCompared, initCompare } from '~/stores/compare';

interface Props {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  image?: Image | null;
  options: ProductOption[];
  variants: ProductVariant[];
  currencyCode: string;
}

/** Best-effort swatch colour from a Shopify option value name. */
const COLOR_MAP: Record<string, string> = {
  obsidian: '#07080C', black: '#0E0E0E', graphite: '#41454d', space: '#1d1d1f', midnight: '#1a2845',
  white: '#ffffff', silver: '#d6d6d6', platinum: '#E7E2D9', ivory: '#F8F6F1', pearl: '#f0ede6',
  gold: '#C9A86A', champagne: '#C9A86A', rose: '#D9A89A', blue: '#2A4D8F', navy: '#1a2845',
  green: '#2f6f4f', red: '#b83a2e', purple: '#5b4b8a', titanium: '#8a8d8f', sand: '#cbb997',
};

/** Resolve a colour from the option value name (map → valid CSS colour → neutral). */
function colorFromName(value: string): string {
  const key = value.toLowerCase();
  for (const k of Object.keys(COLOR_MAP)) if (key.includes(k)) return COLOR_MAP[k];
  // Only use the raw name if it's an actual CSS colour (e.g. "teal"); custom
  // names like "Casal" aren't, and would render as no background.
  if (typeof CSS !== 'undefined' && CSS.supports('color', key)) return key;
  return '#cfcabf'; // neutral fallback so the swatch is never blank
}

/**
 * Swatch style for an option value — prefers Shopify's merchant-assigned
 * swatch (image, then colour hex), and only falls back to name guessing.
 */
function swatchStyle(ov: ProductOptionValue): CSSProperties {
  const img = ov.swatch?.image?.previewImage?.url;
  if (img) {
    return { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  }
  return { background: ov.swatch?.color || colorFromName(ov.name) };
}
const isColorOption = (name: string) => /colou?r|finish|shade/i.test(name);

const isDefaultOnly = (options: ProductOption[]) =>
  options.length === 1 &&
  options[0].name === 'Title' &&
  options[0].optionValues.every((v) => v.name === 'Default Title');

function findVariant(variants: ProductVariant[], selected: Record<string, string>) {
  return variants.find((v) => v.selectedOptions.every((o) => selected[o.name] === o.value));
}

export default function ProductBuyBox({ id, handle, title, vendor, image, options, variants, currencyCode }: Props) {
  const singleVariant = isDefaultOnly(options) || options.length === 0;

  const initial = useMemo(() => {
    const base = variants.find((v) => v.availableForSale) ?? variants[0];
    const map: Record<string, string> = {};
    base?.selectedOptions.forEach((o) => (map[o.name] = o.value));
    return map;
  }, [variants]);

  const [selected, setSelected] = useState<Record<string, string>>(initial);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  // Wishlist state (re-renders when the store changes).
  useStore($wishlist);
  const wished = isWished(handle);

  // Compare state.
  useEffect(() => { initCompare(); }, []);
  useStore($compare);
  const compared = isCompared(id);

  const variant = findVariant(variants, selected);

  // Tell the gallery island to show the selected variant's image. Skip the
  // initial mount so the gallery keeps its default (featured) image on load.
  const firstSync = useRef(true);
  const variantImageId = variant?.image?.id ?? null;
  const variantImageUrl = variant?.image?.url ?? null;
  useEffect(() => {
    if (firstSync.current) { firstSync.current = false; return; }
    if (!variantImageId && !variantImageUrl) return;
    window.dispatchEvent(
      new CustomEvent('pdp:variant-image', { detail: { id: variantImageId, url: variantImageUrl } }),
    );
  }, [variantImageId, variantImageUrl]);

  const available = variant?.availableForSale ?? false;
  const price = Number(variant?.price.amount ?? 0);
  const onSale = isOnSale(variant?.price, variant?.compareAtPrice);
  const compareAt = Number(variant?.compareAtPrice?.amount ?? 0);
  const save = onSale ? compareAt - price : 0;
  const lineTotal = price * quantity;

  const valueAvailable = (optionName: string, value: string) =>
    variants.some(
      (v) => v.availableForSale && v.selectedOptions.some((o) => o.name === optionName && o.value === value),
    );

  const pick = (name: string, value: string) => setSelected((prev) => ({ ...prev, [name]: value }));

  const handleAdd = async () => {
    if (!variant || !available) return;
    setAdding(true);
    await addItem(variant.id, quantity);
    setAdding(false);
  };
  const handleBuy = async () => {
    if (!variant || !available) return;
    setBuying(true);
    await buyNow(variant.id, quantity);
    setBuying(false);
  };
  const handleWish = () => {
    const nowWished = toggleWish({
      handle,
      title,
      price: formatMoney(price, currencyCode),
      image: image?.url ?? null,
      variantId: variant?.id ?? null,
    });
    if (nowWished) openWish();
  };

  const handleCompare = () => {
    toggleCompare({
      id,
      handle,
      title,
      price: formatMoney(price, currencyCode),
      image: image?.url ?? null,
      vendor: vendor ?? null,
    });
  };

  return (
    <>
      {/* Price */}
      <div className="pi-price-block">
        <div className="pi-price-row">
          <span className="pi-price" id="pi-price">{variant ? formatMoney(price, currencyCode) : '—'}</span>
          {onSale && (
            <>
              <span className="pi-price-orig">{formatMoney(compareAt, currencyCode)}</span>
              <span className="pi-price-save">Save {formatMoney(save, currencyCode)}</span>
            </>
          )}
        </div>
      </div>

      {/* Stock */}
      <div className="pi-stock">
        <span className="pi-stock-dot" style={available ? undefined : { background: 'var(--taupe)' }} />
        {available ? 'In Stock' : 'Sold Out'}
        {available && variant?.quantityAvailable != null && variant.quantityAvailable <= 10 && (
          <>
            <span className="pi-stock-sep" />
            <span className="pi-stock-meta">Only {variant.quantityAvailable} left</span>
          </>
        )}
      </div>

      {/* Variant options */}
      {!singleVariant &&
        options.map((option) => {
          const color = isColorOption(option.name);
          return (
            <div className="pi-variant" key={option.id}>
              <div className="pi-variant-head">
                <span className="pi-variant-title">{option.name}</span>
                <span className="pi-variant-current">{selected[option.name]}</span>
              </div>
              <div className={color ? 'pi-color-row' : 'pi-pill-row'}>
                {option.optionValues.map((ov) => {
                  const active = selected[option.name] === ov.name;
                  const possible = valueAvailable(option.name, ov.name);
                  if (color) {
                    return (
                      <button
                        key={ov.id}
                        className={`pi-color${active ? ' is-active' : ''}${!possible ? ' is-soldout' : ''}`}
                        data-name={ov.name}
                        onClick={() => pick(option.name, ov.name)}
                        aria-pressed={active}
                        aria-label={`${ov.name}${!possible ? ' (sold out)' : ''}`}
                        title={ov.name}
                      >
                        <span className="pi-color-inner" style={swatchStyle(ov)} />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={ov.id}
                      className={`pi-pill${active ? ' is-active' : ''}${!possible ? ' is-soldout' : ''}`}
                      onClick={() => pick(option.name, ov.name)}
                      aria-pressed={active}
                    >
                      {ov.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

      {/* Qty + Add to cart */}
      <div className="pi-action">
        <div className="pi-qty">
          <button className="pi-qty-btn" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <input
            type="number"
            value={quantity}
            min={1}
            max={10}
            onChange={(e) => setQuantity(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
            aria-label="Quantity"
          />
          <button className="pi-qty-btn" onClick={() => setQuantity((q) => Math.min(10, q + 1))} aria-label="Increase">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
        <button className="pi-add-btn" onClick={handleAdd} disabled={!available || adding || buying}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
          </svg>
          {adding ? 'Adding…' : available ? 'Add to Cart' : 'Sold Out'}
          {available && <span className="pi-add-total">— {formatMoney(lineTotal, currencyCode)}</span>}
        </button>
      </div>

      <button className="pi-buy-now" onClick={handleBuy} disabled={!available || adding || buying}>
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="13 17 18 12 13 7" />
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
        {buying ? 'Redirecting…' : 'Buy It Now'}
      </button>

      {/* Secondary actions */}
      <div className="pi-secondary">
        <button className="pi-sec-btn" onClick={handleWish} aria-pressed={wished}>
          <svg fill={wished ? 'var(--gold)' : 'none'} stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <span>{wished ? 'Wishlisted' : 'Wishlist'}</span>
        </button>
        <button className="pi-sec-btn" onClick={handleCompare} aria-pressed={compared}>
          <svg fill={compared ? 'var(--gold)' : 'none'} stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <span>{compared ? 'Compared' : 'Compare'}</span>
        </button>
        <button className="pi-sec-btn">
          <svg fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span>Share</span>
        </button>
      </div>
    </>
  );
}
