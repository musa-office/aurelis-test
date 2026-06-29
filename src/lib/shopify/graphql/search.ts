// ============================================================
//  Search GraphQL operations (Storefront API 2026-04)
// ============================================================
import { IMAGE_FRAGMENT, CARD_FRAGMENTS } from './fragments';

/** Full search results page (products). */
export const SEARCH_QUERY = /* GraphQL */ `
  ${CARD_FRAGMENTS}
  query Search(
    $query: String!
    $first: Int
    $last: Int
    $after: String
    $before: String
    $types: [SearchType!] = [PRODUCT]
    $sortKey: SearchSortKeys = RELEVANCE
    $reverse: Boolean = false
    $productFilters: [ProductFilter!]
    $country: CountryCode
  ) @inContext(country: $country) {
    search(
      query: $query
      first: $first
      last: $last
      after: $after
      before: $before
      types: $types
      sortKey: $sortKey
      reverse: $reverse
      productFilters: $productFilters
    ) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
      productFilters {
        id
        label
        type
        values {
          id
          label
          count
          input
        }
      }
      edges {
        node {
          ... on Product {
            ...ProductCard
          }
        }
      }
    }
  }
`;

/** Predictive (instant) search for the header autocomplete. */
export const PREDICTIVE_SEARCH_QUERY = /* GraphQL */ `
  ${IMAGE_FRAGMENT}
  query PredictiveSearch(
    $query: String!
    $limit: Int = 6
    $types: [PredictiveSearchType!] = [PRODUCT, COLLECTION, QUERY]
    $limitScope: PredictiveSearchLimitScope = EACH
    $country: CountryCode
  ) @inContext(country: $country) {
    predictiveSearch(query: $query, limit: $limit, types: $types, limitScope: $limitScope) {
      queries {
        text
        styledText
      }
      products {
        id
        title
        handle
        featuredImage {
          ...ImageFields
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
      collections {
        id
        title
        handle
        image {
          ...ImageFields
        }
      }
    }
  }
`;
