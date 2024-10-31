import {defer, redirect} from '@shopify/remix-oxygen';
import {useLoaderData, Link} from '@remix-run/react';
import { useState } from 'react';
import {
  getPaginationVariables,
  Image,
  Money,
  Analytics,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import { AnimatedImage } from '~/components/AnimatedImage';
import { truncateText } from '~/components/CollectionDisplay';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  return [{title: `Hydrogen | ${data?.collection.title ?? ''} Collection`}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 15, tag: selectedTag || undefined,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{ collection }, tagsData] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: { handle, ...paginationVariables },
    }),
    storefront.query(COLLECTION_TAGS_QUERY, {
      variables: { handle },
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, { status: 404 });
  }

  const allTags = Array.from(new Set(tagsData.collection.products.nodes.flatMap((product) => product.tags)));

  return {
    collection,
    allTags, // Pass all tags as part of the initial loader data
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  return {};
}

function FilterMenu({ tags, onFilterChange }) {
  return (
    <div className="filter-menu">
      <label>Filter by Tag:</label>
      <select onChange={(e) => onFilterChange(e.target.value)}>
        <option value="">All</option>
        {tags.map((tag) => (
          <option key={tag} value={tag}>{tag}</option>
        ))}
      </select>
    </div>
  );
}

export default function Collection() {
  const { collection, allTags } = useLoaderData();
  const [selectedTag, setSelectedTag] = useState('');

  // Add filter to pagination variables for the next paginated fetch
  const paginationVariables = selectedTag ? { tag: selectedTag } : {};

  return (
    <div className="collection">
      <h1>{collection.title}</h1>

      <FilterMenu tags={allTags} onFilterChange={setSelectedTag} />

      <PaginatedResourceSection
        connection={{
          ...collection.products,
          nodes: collection.products.nodes.filter((product) =>
            !selectedTag || product.tags.includes(selectedTag)
          ),
        }}
        resourcesClassName="products-grid"
        paginationVariables={paginationVariables}
      >
        {({ node: product, index }) => (
          <ProductItem key={product.id} product={product} loading={index < 15 ? 'eager' : undefined} />
        )}
      </PaginatedResourceSection>

      <Analytics.CollectionView
        data={{
          collection: { id: collection.id, handle: collection.handle },
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
          // src={product.featuredImage.url}
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

const COLLECTION_TAGS_QUERY = `#graphql
  query CollectionTags($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 100) {  // Adjust the number as needed
        nodes {
          tags
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

// NOTE: https://shopify.dev/docs/api/storefront/2022-04/objects/collection
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
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
        after: $endCursor
      ) {
        nodes {
          ...ProductItem
          tags
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
