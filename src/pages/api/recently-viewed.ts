import type { APIRoute } from 'astro';
import { getProduct } from '~/lib/shopify';

export const GET: APIRoute = async ({ url }) => {
  const raw = url.searchParams.get('handles') ?? '';
  const handles = raw
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (!handles.length) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const results = await Promise.all(
    handles.map(async (handle) => {
      try {
        const product = await getProduct(handle);
        if (!product) return null;
        const firstVariant = product.variants[0] ?? null;
        return {
          handle: product.handle,
          title: product.title,
          vendor: product.vendor ?? null,
          featuredImage: product.featuredImage ?? null,
          price: product.priceRange.minVariantPrice,
          compareAt: product.compareAtPriceRange?.minVariantPrice ?? null,
          availableForSale: product.availableForSale,
          firstVariantId: firstVariant?.id ?? null,
        };
      } catch {
        return null;
      }
    }),
  );

  return new Response(JSON.stringify(results.filter(Boolean)), {
    headers: { 'Content-Type': 'application/json' },
  });
};
