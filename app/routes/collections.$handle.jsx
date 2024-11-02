import { defer, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useSearchParams, useLocation } from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
  Analytics,
} from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { AnimatedImage } from '~/components/AnimatedImage';
import { truncateText } from '~/components/CollectionDisplay';
import { SortFilter } from '~/modules/sort-filter';
import { FILTER_URL_PREFIX } from '~/lib/const';
import { useState } from 'react';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.collection.title ?? ''} Collection` }];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({ ...deferredData, ...criticalData });
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
export async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;
  const searchParams = new URL(request.url).searchParams;
  const paginationVariables = getPaginationVariables(request, { pageBy: 16 });

  // Extract sort parameter
  const sort = searchParams.get('sort');
  let sortKey;
  let reverse = false;

  switch (sort) {
    case 'price-low-high':
      sortKey = 'PRICE';
      break;
    case 'price-high-low':
      sortKey = 'PRICE';
      reverse = true;
      break;
    case 'best-selling':
      sortKey = 'BEST_SELLING';
      break;
    case 'newest':
      sortKey = 'CREATED';
      reverse = true;
      break;
    case 'featured':
    default:
      sortKey = 'MANUAL';
      break;
  }

  // Extract filters from URL
  const filters = [];
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith(FILTER_URL_PREFIX)) {
      const filterKey = key.replace(FILTER_URL_PREFIX, '');
      filters.push({ [filterKey]: JSON.parse(value) });
    }
  }

  if (!handle) {
    throw redirect('/collections');
  }

  try {
    const { collection } = await storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        ...paginationVariables,
        filters: filters.length ? filters : undefined,
        sortKey,
        reverse,
      },
    });

    if (!collection) {
      throw new Response(`Collection ${handle} not found`, { status: 404 });
    }

    // Process applied filters
    const appliedFilters = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith(FILTER_URL_PREFIX)) {
        const filterKey = key.replace(FILTER_URL_PREFIX, '');
        const filterValue = JSON.parse(value);
        appliedFilters.push({
          label: `${filterKey}: ${value}`,
          filter: { [filterKey]: filterValue },
        });
      }
    });

    return { collection, appliedFilters };
  } catch (error) {
    console.error("Error fetching collection:", error);
    throw new Response("Error fetching collection", { status: 500 });
  }
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({ context }) {
  return {};
}


export default function Collection() {
  const { collection, appliedFilters } = useLoaderData();

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      
      <SortFilter
        filters={collection.products.filters}
        appliedFilters={appliedFilters}
      >
        <PaginatedResourceSection
          connection={collection.products}
          resourcesClassName="products-grid"
        >
          {({ node: product, index }) => (
            <ProductItem
              key={product.id}
              product={product}
              loading={index < 16 ? 'eager' : undefined}
            />
          )}
        </PaginatedResourceSection>
      </SortFilter>

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}
/**
 * @param {{
 *   product: ProductItemFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
function ProductItem({ product, loading }) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  return (
    <Link
      className="product-item-collection"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {product.featuredImage && (
        <AnimatedImage
          srcSet={`${product.featuredImage.url}?width=300&quality=30 300w,
                   ${product.featuredImage.url}?width=600&quality=30 600w,
                   ${product.featuredImage.url}?width=1200&quality=30 1200w`}
          alt={product.featuredImage.altText || product.title}
          loading={loading}
          width="180px"
          height="180px"
        />
      )}
      <h4>{truncateText(product.title, 20)}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        filters: $filters,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        filters {
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
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */