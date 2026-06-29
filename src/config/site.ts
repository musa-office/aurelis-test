// ============================================================
//  Site configuration — brand, nav, announcements, footer.
//  Single source of truth (DRY) for the non-Shopify content of
//  the Aurelis Luxury storefront. Values mirror the original design.
// ============================================================

export const SITE = {
  name: 'Aurelis',
  /** Rendered as "Aurelis." with a gold dot. */
  brandDot: '.',
  tagline: 'Luxury Electronics',
  description:
    'Premium electronics curated for those who value refinement, performance, and the art of technology at its finest.',
  /** Free-express-delivery threshold referenced in announcements. */
  freeShippingThreshold: 500,
  /**
   * Fallback ISO-3166 country used for Shopify market/currency localization
   * (@inContext) when a visitor's region can't be detected from CDN geo
   * headers, the region cookie, or Accept-Language. Must be a country your
   * Shopify Markets config supports; otherwise Shopify returns base-currency
   * prices. See `src/lib/shopify/context.ts`.
   */
  defaultCountry: 'US',
} as const;

/** Top-left + top-right links of the slim announcement bar. */
export const ANN_BAR = {
  left: [
    { label: 'Track Order', href: '/account' },
    { label: 'Store Finder', href: '/contact' },
  ],
  right: [
    // Slot 0 is the locale/currency indicator — its label is overridden at
    // render time with the live currency for the request's country
    // (see Announcement.astro). The value here is just the fallback.
    { label: 'EN / USD $', href: '#' },
    // Slot 1 is the auth link — Announcement swaps it to "Log out" when the
    // visitor is signed in.
    { label: 'Sign In', href: '/account/login' },
  ],
  /** Rotating center messages. `strong` is the bolded lead-in. */
  slides: [
    { strong: 'New Collection 2025', rest: '— Complimentary Express Delivery on Orders Over $500' },
    { strong: 'Limited Time:', rest: 'Up to 20% Off on Premium Bundles — Shop Now' },
    { strong: 'Free 2-Year Warranty', rest: 'on All Laptops & Smartphones — While Stocks Last' },
    { strong: 'Aurelis Members', rest: 'get Early Access to New Arrivals — Join Free Today' },
  ],
} as const;

/**
 * Handle of the product shown in the home page "Product Spotlight" section.
 * Set to a real Shopify product handle (e.g. 'aura-phone-pro-max').
 * Leave empty to automatically use the top best-selling product.
 */
export const SPOTLIGHT_HANDLE = 'smart-phone-12';

/**
 * Handle of the Shopify blog to pull articles from for the home page "The Edit" section.
 * The default Shopify blog handle is "news". Change to match your store's blog handle.
 * Set to empty string '' to fall back to static placeholder articles.
 */
export const BLOG_HANDLE = 'news';

/**
 * Bundle configurations for the home page "Deals" section.
 * Set productHandles to your actual Shopify product handles (3 per bundle).
 * Leave productHandles as an empty array — the section shows placeholder/static content.
 *
 * heroImage (optional): path to a bundle hero image. Falls back to the first product's image.
 */
export interface BundleConfig {
  id: string;
  name: string;
  /** Fractional discount applied to the bundle total. 0.16 = 16% off. */
  discount: number;
  badge: string | null;
  tag: string;
  heroImage?: string;
  productHandles: string[];
}

export const BUNDLE_CONFIGS: BundleConfig[] = [
  {
    id: 'b1',
    name: 'Home Office Pro Bundle',
    discount: 0.16,
    badge: null,
    tag: 'Best Value',
    heroImage: '/images/bundle save-01.jpg',
    productHandles: [],
    // productHandles: ['probook-ultra-x1', 'visionpro-4k-monitor', 'keycraft-wireless-set'],
  },
  {
    id: 'b2',
    name: 'Lifestyle Premium Bundle',
    discount: 0.18,
    badge: 'Most Popular',
    tag: 'Best Seller',
    heroImage: '/images/bundle save-02.jpg',
    productHandles: [],
    // productHandles: ['aura-phone-pro-max', 'soundcraft-anc-pro', 'visionwatch-s3-pro'],
  },
  {
    id: 'b3',
    name: 'Creator Studio Bundle',
    discount: 0.15,
    badge: null,
    tag: 'Pro Pick',
    heroImage: '/images/bundle save-03.jpg',
    productHandles: [],
    // productHandles: ['probook-ultra-x1-oled', 'aura-phone-pro-max-512', 'soundcraft-elite-studio'],
  },
];

/**
 * Ordered list of collection handles shown in the home page category slider.
 * Must match actual Shopify collection handles — collections without an image
 * or that don't exist in the store will be silently skipped.
 */
export const HOME_CATEGORY_HANDLES = [
  'phone-tablet',
  'pc-laptop',
  'kitchen-appliances',
  'home-appliances-1',
  'accessories',
  'sale',
] as const;

/**
 * Primary header navigation. Used as a fallback / default; can later be
 * driven by a Shopify menu. `badge` renders the small gold pill; `accent`
 * paints the link gold (the "Sale" treatment in the design).
 */
export interface NavLink {
  title: string;
  url: string;
  badge?: string;
  accent?: boolean;
}
export const NAV: NavLink[] = [
  { title: 'New Arrivals', url: '/products?sort=newest', badge: 'New' },
  { title: 'Phones', url: '/collections/phone-tablet' },
  { title: 'Audio', url: '/collections/kitchen-appliances' },
  { title: 'Laptops', url: '/collections/pc-laptop' },
  { title: 'Wearables', url: '/collections/home-appliances-1' },
  { title: 'Accessories', url: '/collections/accessories' },
  { title: 'Sale', url: '/collections/sale', accent: true },
];

/** Footer scrolling-marquee phrases. `outlined` renders the stroke-only style. */
export const FOOTER_MARQUEE = [
  { text: 'Premium Electronics', outlined: false },
  { text: 'Curated Excellence', outlined: true },
  { text: 'Luxury Tech', outlined: false },
  { text: 'Free Worldwide Shipping', outlined: true },
  { text: '2-Year Warranty', outlined: false },
  { text: 'Expert Curation', outlined: true },
] as const;

/** Footer link columns. */
export interface FooterLink {
  label: string;
  href: string;
  badge?: string;
  accent?: boolean;
}
export interface FooterColumn {
  title: string;
  links: FooterLink[];
}
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Shop',
    links: [
      { label: 'New Arrivals', href: '/products?sort=newest', badge: 'New' },
      { label: 'Laptops', href: '/collections/laptops' },
      { label: 'Smartphones', href: '/collections/phones' },
      { label: 'Headphones & Audio', href: '/collections/audio' },
      { label: 'Wearables', href: '/collections/wearables' },
      { label: 'Accessories', href: '/collections/accessories' },
      { label: 'Sale', href: '/collections/sale', badge: '20% Off', accent: true },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/pages/help' },
      { label: '2-Year Warranty', href: '/pages/warranty' },
      { label: 'Returns & Refunds', href: '/pages/returns' },
      { label: 'Track Your Order', href: '/pages/track-order' },
      { label: 'Live Chat', href: '/contact' },
      { label: 'Store Locations', href: '/pages/stores' },
      { label: 'Trade-In Program', href: '/pages/trade-in' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Aurelis', href: '/about' },
      { label: 'Careers', href: '/pages/careers' },
      { label: 'Press & Media', href: '/pages/press' },
      { label: 'Sustainability', href: '/pages/sustainability' },
      { label: 'Partnerships', href: '/pages/partnerships' },
      { label: 'The Edit — Blog', href: '/blog' },
      { label: 'Investor Relations', href: '/pages/investors' },
    ],
  },
  {
    title: 'Aurelis Programs',
    links: [
      { label: 'Aurelis Membership', href: '/pages/membership' },
      { label: 'Business & Enterprise', href: '/pages/business' },
      { label: 'Student Discount', href: '/pages/student' },
      { label: 'Refer & Earn', href: '/pages/refer' },
      { label: 'Gift Cards', href: '/pages/gift-cards' },
      { label: 'Affiliate Program', href: '/pages/affiliate' },
    ],
  },
];

/** Social icons in the footer brand column (icon key → href). */
export const SOCIALS = [
  { label: 'X / Twitter', icon: 'x', href: '#' },
  { label: 'Instagram', icon: 'instagram', href: '#' },
  { label: 'YouTube', icon: 'youtube', href: '#' },
  { label: 'LinkedIn', icon: 'linkedin', href: '#' },
  { label: 'TikTok', icon: 'tiktok', href: '#' },
] as const;

/** Payment chips in the footer secure-payments strip. */
export const PAYMENTS = ['VISA', 'MC', 'AMEX', 'PayPal', 'Apple Pay', 'Google Pay', 'Klarna'] as const;

/** Footer bottom-bar legal links. */
export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/pages/privacy' },
  { label: 'Terms of Service', href: '/pages/terms' },
  { label: 'Cookie Settings', href: '/pages/cookies' },
  { label: 'Accessibility', href: '/pages/accessibility' },
] as const;

export const COPYRIGHT = '© 2025 Aurelis Electronics Ltd. All rights reserved.';
