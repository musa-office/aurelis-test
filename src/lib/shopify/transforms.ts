// ============================================================
//  Transforms — flatten Shopify edges/node envelopes into the
//  clean domain shapes defined in types.ts.
// ============================================================
import type {
  Cart,
  CartLine,
  Collection,
  PageInfo,
  Paginated,
  Product,
  ProductCard,
  ProductRating,
  ProductVariant,
} from './types';

interface Edge<T> {
  cursor?: string;
  node: T;
}
interface Connection<T> {
  edges?: Edge<T>[];
  pageInfo?: PageInfo;
}

/** Pull the node list out of a Relay-style connection. */
export function nodes<T>(connection?: Connection<T> | null): T[] {
  return connection?.edges?.map((e) => e.node) ?? [];
}

const EMPTY_PAGE_INFO: PageInfo = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null,
  endCursor: null,
};

/** Flatten a connection into { items, pageInfo }. */
export function paginate<TRaw, TOut>(
  connection: Connection<TRaw> | null | undefined,
  map: (node: TRaw) => TOut,
): Paginated<TOut> {
  return {
    items: nodes(connection).map(map),
    pageInfo: connection?.pageInfo ?? EMPTY_PAGE_INFO,
  };
}

// Raw shapes only need the connection-ish bits typed loosely.
type Raw = Record<string, any>;

const COLOR_HEX: Record<string, string> = {
  black: '#1a1d24',
  white: '#f8f6f1',
  silver: '#c0c0c0',
  gold: '#c9a86a',
  blue: '#2c4a7c',
  navy: '#1a2a4a',
  red: '#c0392b',
  green: '#3d6b4f',
  pink: '#e8a0a0',
  purple: '#6b3d6b',
  yellow: '#d4b84a',
  orange: '#d4874a',
  grey: '#888888',
  gray: '#888888',
  'space gray': '#57595d',
  'space grey': '#57595d',
  'rose gold': '#b76e79',
  graphite: '#383838',
  titanium: '#8a8a8a',
  midnight: '#1a1d24',
  starlight: '#f2ede3',
  'space black': '#1a1d24',
  'sky blue': '#6ab0d4',
  'deep purple': '#4a1a6b',
  'alpine green': '#4a6b4a',
  bronze: '#9c6b3d',
  coral: '#e8735a',
  teal: '#2a7c7c',
};

function nameToHex(name: string): string {
  const lower = name.toLowerCase().trim();
  if (lower.startsWith('#')) return name;
  return COLOR_HEX[lower] ?? '#888888';
}

function parseRating(p: Raw): ProductRating | null {
  const mfs: Raw[] = p.metafields ?? [];
  const ratingMf = mfs.find((m: Raw) => m?.key === 'rating');
  const countMf = mfs.find((m: Raw) => m?.key === 'rating_count');
  if (!ratingMf?.value) return null;
  try {
    const parsed = JSON.parse(ratingMf.value);
    const value = Number(parsed?.value ?? parsed);
    const count = Number(countMf?.value ?? 0);
    if (isNaN(value) || value <= 0) return null;
    return { value, count };
  } catch {
    return null;
  }
}

function extractColorSwatches(p: Raw): { name: string; hex: string; image?: string | null }[] {
  const variants: Raw[] = nodes(p.variants);

  // First variant image per colour value → lets a swatch click swap the card image.
  const imageByColor: Record<string, string | null> = {};
  for (const v of variants) {
    const sel = (v.selectedOptions as { name: string; value: string }[])?.find(
      (o) => o.name.toLowerCase() === 'color' || o.name.toLowerCase() === 'colour',
    );
    if (!sel) continue;
    if (!(sel.value in imageByColor)) imageByColor[sel.value] = v.image?.url ?? null;
  }

  // Prefer the colour option's merchant-assigned swatch colours; only fall
  // back to guessing from the value name (so custom names like "Casal" show
  // their real colour instead of a generic grey).
  const options: Raw[] = p.options ?? [];
  const colorOpt = options.find(
    (o) => o.name?.toLowerCase() === 'color' || o.name?.toLowerCase() === 'colour',
  );
  if (colorOpt?.optionValues?.length) {
    return colorOpt.optionValues.map((ov: Raw) => ({
      name: ov.name,
      hex: ov.swatch?.color || nameToHex(ov.name),
      image: imageByColor[ov.name] ?? null,
    }));
  }

  // Fallback: derive distinct colour values from the variants (no swatch data).
  const seen = new Set<string>();
  const swatches: { name: string; hex: string; image?: string | null }[] = [];
  for (const v of variants) {
    const sel = (v.selectedOptions as { name: string; value: string }[])?.find(
      (o) => o.name.toLowerCase() === 'color' || o.name.toLowerCase() === 'colour',
    );
    if (!sel) continue;
    if (seen.has(sel.value)) continue;
    seen.add(sel.value);
    swatches.push({ name: sel.value, hex: nameToHex(sel.value), image: v.image?.url ?? null });
  }
  return swatches;
}

export function mapProductCard(p: Raw): ProductCard {
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    vendor: p.vendor,
    availableForSale: p.availableForSale ?? true,
    featuredImage: p.featuredImage ?? null,
    priceRange: p.priceRange,
    compareAtPriceRange: p.compareAtPriceRange,
    colorSwatches: extractColorSwatches(p),
    firstVariantId: (nodes(p.variants)[0] as Raw)?.id ?? null,
    rating: parseRating(p),
  };
}

export function mapVariant(v: Raw): ProductVariant {
  return {
    id: v.id,
    title: v.title,
    availableForSale: v.availableForSale ?? false,
    quantityAvailable: v.quantityAvailable ?? null,
    selectedOptions: v.selectedOptions ?? [],
    price: v.price,
    compareAtPrice: v.compareAtPrice ?? null,
    image: v.image ?? null,
  };
}

export function mapProduct(p: Raw): Product {
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    description: p.description ?? '',
    descriptionHtml: p.descriptionHtml ?? '',
    vendor: p.vendor ?? '',
    productType: p.productType ?? '',
    tags: p.tags ?? [],
    availableForSale: p.availableForSale ?? false,
    featuredImage: p.featuredImage ?? null,
    images: nodes(p.images),
    priceRange: p.priceRange,
    compareAtPriceRange: p.compareAtPriceRange,
    options: p.options ?? [],
    variants: nodes<Raw>(p.variants).map(mapVariant),
    seo: p.seo ?? {},
    rating: parseRating(p),
  };
}

export function mapCollection(c: Raw): Collection {
  return {
    id: c.id,
    title: c.title,
    handle: c.handle,
    description: c.description ?? '',
    descriptionHtml: c.descriptionHtml ?? '',
    image: c.image ?? null,
    seo: c.seo ?? {},
  };
}

function mapCartLine(l: Raw): CartLine {
  return {
    id: l.id,
    quantity: l.quantity,
    cost: l.cost,
    merchandise: {
      id: l.merchandise?.id,
      title: l.merchandise?.title,
      availableForSale: l.merchandise?.availableForSale ?? true,
      selectedOptions: l.merchandise?.selectedOptions ?? [],
      price: l.merchandise?.price,
      image: l.merchandise?.image ?? null,
      product: l.merchandise?.product,
    },
  };
}

export function mapCart(c: Raw | null | undefined): Cart | null {
  if (!c) return null;
  return {
    id: c.id,
    checkoutUrl: c.checkoutUrl,
    totalQuantity: c.totalQuantity ?? 0,
    note: c.note ?? null,
    cost: c.cost,
    lines: nodes<Raw>(c.lines).map(mapCartLine),
    buyerCountry: c.buyerIdentity?.countryCode ?? null,
  };
}
