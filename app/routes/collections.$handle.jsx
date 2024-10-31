import { defer, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useFetcher, useSearchParams } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Money, Analytics } from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { AnimatedImage } from '~/components/AnimatedImage';
import { truncateText } from '~/components/CollectionDisplay';

export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.collection.title ?? ''} Collection` }];
};

// Loader function that fetches products based on current filters
export async function loader({ request, context, params }) {
  const url = new URL(request.url);
  const minPrice = parseFloat(url.searchParams.get('minPrice')) || 0;
  const maxPrice = parseFloat(url.searchParams.get('maxPrice')) || Infinity;

  const paginationVariables = getPaginationVariables(request, { pageBy: 15 });

  const { handle } = params;
  const { storefront } = context;

  if (!handle) throw redirect('/collections');

  const { collection } = await storefront.query(COLLECTION_QUERY, {
    variables: {
      handle,
      minPrice,
      maxPrice,
      ...paginationVariables
    },
  });

  if (!collection) throw new Response(`Collection ${handle} not found`, { status: 404 });

  return defer({ collection });
}

// Component for Price Filter
function PriceFilter({ minPrice, maxPrice, onFilterChange }) {
  return (
    <div className="filter-menu">
      <label>Price Range:</label>
      <input
        type="number"
        placeholder="Min Price"
        value={minPrice || ''}
        onChange={(e) => onFilterChange('minPrice', e.target.value)}
      />
      <input
        type="number"
        placeholder="Max Price"
        value={maxPrice || ''}
        onChange={(e) => onFilterChange('maxPrice', e.target.value)}
      />
    </div>
  );
}

export default function Collection() {
  const { collection } = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();

  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';

  const handleFilterChange = (key, value) => {
    searchParams.set(key, value || '');
    setSearchParams(searchParams);
  };

  useEffect(() => {
    fetcher.load(window.location.pathname + '?' + searchParams.toString());
  }, [searchParams, fetcher]);

  return (
    <div className="collection">
      <h1>{collection.title}</h1>

      <PriceFilter minPrice={minPrice} maxPrice={maxPrice} onFilterChange={handleFilterChange} />

      <PaginatedResourceSection
        connection={fetcher.data?.collection.products || collection.products}
        resourcesClassName="products-grid"
        onLoadMore={() => {
          fetcher.load(
            `${window.location.pathname}?${searchParams.toString()}&page=${collection.products.pageInfo.endCursor
            }`
          );
        }}
      >
        {({ node: product, index }) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 15 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>

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

// Product Item Component
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

const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $minPrice: Float!
    $maxPrice: Float!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
        query: "price:>=${minPrice} AND price:<=${maxPrice}"
      ) {
        nodes {
          id
          handle
          title
          tags
          featuredImage {
            id
            altText
            url
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
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

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */