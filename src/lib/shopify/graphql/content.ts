// ============================================================
//  Content GraphQL operations — menus, shop (2026-04)
// ============================================================

/** Navigation menu by handle (e.g. "main-menu", "footer"); nests 3 levels. */
export const MENU_QUERY = /* GraphQL */ `
  query Menu($handle: String!) {
    menu(handle: $handle) {
      id
      title
      items {
        id
        title
        url
        type
        items {
          id
          title
          url
          type
          items {
            id
            title
            url
            type
          }
        }
      }
    }
  }
`;

/** Shop name + primary domain — for SEO and footer. */
export const SHOP_QUERY = /* GraphQL */ `
  query Shop {
    shop {
      name
      description
      primaryDomain {
        url
        host
      }
    }
  }
`;

/** Blog articles by blog handle — latest N, sorted newest-first. */
export const BLOG_ARTICLES_QUERY = /* GraphQL */ `
  query BlogArticles($handle: String!, $first: Int = 3) {
    blog(handle: $handle) {
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        edges {
          node {
            id
            title
            handle
            excerpt
            publishedAt
            tags
            image {
              id
              url
              altText
              width
              height
            }
            author: authorV2 {
              name
            }
            contentHtml
          }
        }
      }
    }
  }
`;

/** A CMS page by handle (about, shipping, etc.). */
export const PAGE_QUERY = /* GraphQL */ `
  query Page($handle: String!) {
    page(handle: $handle) {
      id
      title
      handle
      body
      bodySummary
      seo {
        title
        description
      }
    }
  }
`;

/** A single blog article by blog handle + article handle. */
export const BLOG_ARTICLE_QUERY = /* GraphQL */ `
  query BlogArticle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        id
        title
        handle
        excerpt
        publishedAt
        tags
        image {
          id
          url
          altText
          width
          height
        }
        author: authorV2 {
          name
        }
        contentHtml
      }
    }
  }
`;

/**
 * Shopify-detected country for the connecting IP.
 * Called WITHOUT @inContext so Shopify resolves from Shopify-Storefront-Buyer-IP.
 * In dev the server's own IP is used (same machine as buyer), giving the right
 * country without any CDN geo header.
 */
export const LOCALIZATION_QUERY = /* GraphQL */ `
  query Localization {
    localization {
      country {
        isoCode
      }
    }
  }
`;

/**
 * The presentment currency Shopify uses for a given country. Resolved with
 * `@inContext` so it matches exactly what the catalogue/cart prices return
 * (i.e. it respects the store's enabled presentment currencies + fallbacks).
 */
export const COUNTRY_CURRENCY_QUERY = /* GraphQL */ `
  query CountryCurrency($country: CountryCode) @inContext(country: $country) {
    localization {
      country {
        isoCode
        currency {
          isoCode
          symbol
        }
      }
    }
  }
`;

/** Countries the store sells to + each one's presentment currency. Powers the
 *  header currency switcher (deduped to one entry per currency). */
export const AVAILABLE_CURRENCIES_QUERY = /* GraphQL */ `
  query AvailableCurrencies {
    localization {
      availableCountries {
        isoCode
        currency {
          isoCode
          symbol
        }
      }
    }
  }
`;
