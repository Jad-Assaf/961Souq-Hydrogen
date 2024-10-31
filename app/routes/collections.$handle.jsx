import { defer, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { useState, useEffect } from 'react';
import {
  getPaginationVariables,
  Money,
  Analytics,
} from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { AnimatedImage } from '~/components/AnimatedImage';
import { truncateText } from '~/components/CollectionDisplay';

export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.collection.title ?? ''} Collection` }];
};

export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return defer({ ...deferredData, ...criticalData });
}

async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, { pageBy: 15 });

  if (!handle) throw redirect('/collections');

  const [{ collection }] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: { handle, ...paginationVariables },
    }),
  ]);

  if (!collection) throw new Response(`Collection ${handle} not found`, { status: 404 });

  return { collection };
}

function loadDeferredData({ context }) {
  return {};
}

// Price Filter Component
function PriceFilterMenu({ priceRange, onPriceChange }) {
  return (
    <div className="filter-menu">
      <label>Price Range:</label>
      <input
        type="number"
        placeholder="Min Price"
        value={priceRange.min}
        onChange={(e) => onPriceChange({ ...priceRange, min: e.target.value })}
      />
      <input
        type="number"
        placeholder="Max Price"
        value={priceRange.max}
        onChange={(e) => onPriceChange({ ...priceRange, max: e.target.value })}
      />
    </div>
  );
}

export default function Collection() {
  const { collection } = useLoaderData();
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [filteredProducts, setFilteredProducts] = useState(collection.products.nodes);

  // Update filtered products on price range change
  useEffect(() => {
    setFilteredProducts(
      collection.products.nodes.filter((product) => {
        const productPrice = parseFloat(product.priceRange.minVariantPrice.amount);
        const matchesMinPrice = priceRange.min ? productPrice >= parseFloat(priceRange.min) : true;
        const matchesMaxPrice = priceRange.max ? productPrice <= parseFloat(priceRange.max) : true;
        return matchesMinPrice && matchesMaxPrice;
      })
    );
  }, [priceRange, collection.products.nodes]);

  return (
    <div className="collection">
      <h1>{collection.title}</h1>

      {/* Price Filter Menu */}
      <PriceFilterMenu priceRange={priceRange} onPriceChange={setPriceRange} />

      <PaginatedResourceSection
        connection={{ ...collection.products, nodes: filteredProducts }}
        resourcesClassName="products-grid"
        onLoadMore={(newProducts) => {
          // Apply filters to the new products before adding them to the existing filtered list
          const newFilteredProducts = newProducts.nodes.filter((product) => {
            const productPrice = parseFloat(product.priceRange.minVariantPrice.amount);
            const matchesMinPrice = priceRange.min ? productPrice >= parseFloat(priceRange.min) : true;
            const matchesMaxPrice = priceRange.max ? productPrice <= parseFloat(priceRange.max) : true;
            return matchesMinPrice && matchesMaxPrice;
          });
          setFilteredProducts((prev) => [...prev, ...newFilteredProducts]);
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