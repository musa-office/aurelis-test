/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** ISO-3166 country resolved per request for Shopify currency localization. */
    country: string;
  }
}
