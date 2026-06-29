// Quick-view data endpoint — used by QuickViewModal to fetch product details
// server-side (private token never reaches the browser).
import type { APIRoute } from 'astro';
import { getProduct } from '~/lib/shopify';

export const GET: APIRoute = async ({ url }) => {
  const handle = url.searchParams.get('handle');
  if (!handle) {
    return new Response(JSON.stringify({ error: 'Missing handle' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const product = await getProduct(handle);
    if (!product) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const firstVariant = product.variants[0] ?? null;

    return new Response(
      JSON.stringify({
        handle: product.handle,
        title: product.title,
        vendor: product.vendor ?? null,
        description: product.description ?? null,
        featuredImage: product.featuredImage ?? null,
        images: product.images.slice(0, 4),
        price: product.priceRange.minVariantPrice,
        compareAt: product.compareAtPriceRange?.minVariantPrice ?? null,
        availableForSale: product.availableForSale,
        firstVariantId: firstVariant?.id ?? null,
        rating: product.rating ?? null,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
