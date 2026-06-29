<h1 align="center">Aurelis — Luxury Electronics</h1>
<p align="center">
  Headless Shopify storefront template for luxury electronics — Astro 6 SSR with React islands, server-side cart, multi-currency, faceted filters, and Shopify customer accounts.
</p>
<p align="center">
<a href="#features">Features</a> |
<a href="#pages">Pages</a> |
<a href="#getting-started">Getting Started</a> |
<a href="#customization">Customization</a> |
<a href="#project-structure">Project Structure</a> |
<a href="#license">License</a>
</p>
<p align="center">
<img src="public/preview.jpeg" alt="Aurelis Preview" width="100%" />
</p>

---

## Features

- Astro 6 in SSR mode (`output: "server"`) on the `@astrojs/node` standalone adapter.
- React 19 interactive islands (`@astrojs/react`) with framework-agnostic state via `nanostores`.
- Headless Shopify Storefront API — **all Shopify traffic is server-side**; the private Storefront token never reaches the browser. The client only talks to same-origin `/api/*` routes.
- Server-side cart persisted in an **httpOnly** cookie, with self-healing on stale/expired cart ids; checkout hands off to Shopify's hosted `checkoutUrl`.
- Multi-currency: the live presentment currency is sourced from Shopify and kept in sync across catalogue, mini-cart, and cart page, with a header currency switcher.
- Faceted product filters (availability, brand, size, color) plus a price-range filter and sorting.
- Product variant → image swapping on the product page and product cards, using real Shopify swatch colors.
- Product search (full + predictive), wishlist, compare, quick view, and recently-viewed.
- Customer Account API login (OAuth 2.0 + PKCE) with an account dashboard — degrades gracefully when unconfigured.
- SEO metadata, Open Graph / Twitter cards, and canonical URLs in `src/layouts/BaseLayout.astro`.
- Hand-authored, fully responsive CSS (no Tailwind) with mobile drawers and off-canvas navigation.
- Google Fonts (Sora + Inter) loaded with `preconnect`.

---

## Pages

### Storefront

| Route | File |
| --- | --- |
| `/` | `src/pages/index.astro` |
| `/products` | `src/pages/products/index.astro` |
| `/products/[handle]` | `src/pages/products/[handle].astro` |
| `/collections` | `src/pages/collections/index.astro` |
| `/collections/[handle]` | `src/pages/collections/[handle].astro` |
| `/cart` | `src/pages/cart.astro` |
| `/search` | `src/pages/search.astro` |
| `/about` | `src/pages/about.astro` |
| `/contact` | `src/pages/contact.astro` |

### Blog

| Route | File |
| --- | --- |
| `/blog` | `src/pages/blog/index.astro` |
| `/blog/[handle]` | `src/pages/blog/[handle].astro` |

### Account (Customer Account API)

| Route | File |
| --- | --- |
| `/account` | `src/pages/account/index.astro` |
| `/account/login` | `src/pages/account/login.astro` |
| `/account/authorize` | `src/pages/account/authorize.astro` |
| `/account/logout` | `src/pages/account/logout.astro` |

### API (server endpoints)

| Route | File |
| --- | --- |
| `/api/cart` | `src/pages/api/cart.ts` |
| `/api/cart/add` | `src/pages/api/cart/add.ts` |
| `/api/cart/update` | `src/pages/api/cart/update.ts` |
| `/api/cart/remove` | `src/pages/api/cart/remove.ts` |
| `/api/search` | `src/pages/api/search.ts` |
| `/api/product-quick` | `src/pages/api/product-quick.ts` |
| `/api/recently-viewed` | `src/pages/api/recently-viewed.ts` |

### Template Info

| Route | File |
| --- | --- |
| `/style-guide` | `src/pages/style-guide.astro` |
| `/changelog` | `src/pages/changelog.astro` |
| `/licenses` | `src/pages/licenses.astro` |

### Utility

| Route | File |
| --- | --- |
| `/401` | `src/pages/401.astro` |
| `/404` | `src/pages/404.astro` |

---

## Getting Started

### Prerequisites

- Node.js >= 22.12.0
- yarn (recommended), npm, or pnpm
- A Shopify store with Storefront API access (the storefront is headless — it will not render products without credentials)

### Install

```bash
yarn install
# or
npm install
# or
pnpm install
```

### Environment

Copy the example env file and fill in your Shopify credentials (server-only — no `PUBLIC_` prefix, so they never ship to the browser):

```bash
cp .env.example .env
```

**Storefront API (required):**

| Variable | Description |
| --- | --- |
| `SHOPIFY_SHOP_DOMAIN` | Your `*.myshopify.com` domain |
| `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` | Storefront API private (delegate) token |
| `SHOPIFY_API_VERSION` | Storefront API version (e.g. `2026-04`) |

**Customer Account API (optional — enables Sign In / account pages):**

| Variable | Description |
| --- | --- |
| `CUSTOMER_ACCOUNT_API_CLIENT_ID` | Public OAuth client id (PKCE) |
| `SHOPIFY_SHOP_ID` | Numeric shop id |
| `CUSTOMER_ACCOUNT_API_VERSION` | Customer Account API version (default `2025-01`) |

> Shopify rejects `http`/`localhost` for the Customer Account API — use an HTTPS tunnel when testing login locally, and register `https://<host>/account/authorize` as the callback and `https://<host>` as the JavaScript origin.

### Development

```bash
yarn dev
```

### Build

```bash
yarn build
```

### Preview / Run

```bash
yarn preview
# or run the standalone server build directly:
HOST=0.0.0.0 PORT=4321 node ./dist/server/entry.mjs
```

---

## Customization

### Brand, Navigation & Copy

- Site name, tagline, description, announcement bar, primary nav, footer, payments, and homepage category handles live in `src/config/site.ts`.

### Colors & Typography

- Design tokens (palette, fonts, radii, spacing) are CSS custom properties in `src/styles/tokens.css`.
- Section/page styles are hand-authored CSS in `src/styles/` (`base.css`, `layout.css`, `drawers.css`, `product-card.css`, and `src/styles/pages/*.css`).
- Fonts are declared in `src/layouts/BaseLayout.astro` (Sora + Inter via Google Fonts).

### SEO Defaults

- Title, description, Open Graph/Twitter cards, and canonical URLs are set in `src/layouts/BaseLayout.astro` (overridable per page via props).

### Page Content

- Product, collection, and blog content come from **Shopify** via the data layer in `src/lib/shopify/` (`client.ts` → `graphql/*` → `services/*` → `transforms.ts`). Never call Shopify directly from a page or component — always go through the service layer.
- Static marketing copy (nav, footer, value props, announcements) lives in `src/config/site.ts`.

### Images & Fonts

- Optimized images processed by Astro: `src/assets/`
- Static images / video / OG images: `public/images/`

---

## Project Structure

```
public/
  images/               # Static images, video, OG images
src/
  assets/               # Optimized assets (processed by Astro)
  components/           # .astro sections + React islands (components/react/*)
  config/
    site.ts             # Brand, nav, footer, announcement, currency, categories
  layouts/
    BaseLayout.astro    # HTML shell, head, meta, OG/Twitter, fonts, global islands
  lib/
    shopify/            # Storefront API: client, graphql, services, transforms
    shopify/customer/   # Customer Account API (OAuth 2.0 + PKCE) login
    cart-server.ts      # Server-side cart helpers (httpOnly cookie)
  pages/                # SSR pages + /api/* server routes
  stores/               # nanostores (cart, wishlist, compare, ui)
  styles/               # Hand-authored CSS (tokens, base, layout, pages/*)
astro.config.mjs
package.json
tsconfig.json
```

---

## Tech Stack

| Dependency | Version | Purpose |
| --- | --- | --- |
| Astro | ^6.4.7 | SSR site framework |
| @astrojs/node | ^10 | Standalone Node server adapter |
| @astrojs/react | ^4 | React islands integration |
| react / react-dom | ^19 | Interactive islands |
| nanostores | ^0.11 | Framework-agnostic cross-island state |
| @nanostores/react | ^0.8 | React bindings for nanostores |
| lucide-react | ^1.20.0 | Icons |
| clsx | ^2.1.1 | Conditional class names |

---

## Available Scripts

| Command | Description |
| --- | --- |
| `yarn dev` | Start the development server |
| `yarn build` | Build the production site |
| `yarn preview` | Preview the production build |
| `yarn astro` | Run Astro CLI commands (e.g. `yarn astro check` for type checking) |

---

## License

Released under the [MIT License](LICENSE).
