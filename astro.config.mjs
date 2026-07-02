// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import cloudflare from "@astrojs/cloudflare";

// Headless Shopify storefront — server-rendered so the private
// Storefront token stays on the server and cart cookies work.
// Styling is hand-authored CSS (Aurelis luxury design), no Tailwind.
//
// Deployed to Cloudflare Workers. Secrets reach the server via
// `process.env` (Cloudflare populates it from Worker vars/secrets when
// `nodejs_compat` + `nodejs_compat_populate_process_env` are on — see
// wrangler.jsonc). `nodejs_compat` also backs `node:async_hooks`
// (AsyncLocalStorage) used in src/lib/shopify/context.ts.
//
// `imageService: 'passthrough'` — all product imagery is served straight
// from the Shopify CDN via plain <img>, so no Cloudflare Images binding
// is required. `platformProxy` lets `astro dev` read .dev.vars locally.
// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "passthrough",
    platformProxy: { enabled: true },
  }),
  integrations: [react()],
  vite: {
    // Allow the tunnel host to reach the dev server (otherwise Vite
    // blocks unknown Host headers). localhost is always allowed.
    server: {
      allowedHosts: true,
    },
    // Force Vite to pre-bundle React to ESM so islands get the
    // named `createRoot` export, and dedupe to a single copy.
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  },
});
