import { defer, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { useState } from 'react';
import {
  getPaginationVariables,
  Money,
  Analytics,
} from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { AnimatedImage } from '~/components/AnimatedImage';
import { truncateText } from '~/components/CollectionDisplay';

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
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return defer({ ...deferredData, ...criticalData });
}

/**
 * Load critical data for the page
 */
async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 15,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{ collection }] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: { handle, ...paginationVariables },
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, { status: 404 });
  }

  return { collection };
}

function loadDeferredData({ context }) {
  return {};
}

export default function Collection() {
  const { collection } = useLoaderData();
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedProcessor, setSelectedProcessor] = useState('');
  const [selectedProcessorSubFilter, setSelectedProcessorSubFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const filteredProducts = collection.products.nodes.filter((product) => {
    const matchesTag = selectedTag ? product.tags.includes(selectedTag) : true;
    const matchesBrand = selectedBrand ? product.vendor === selectedBrand : true;
    const matchesProcessor = selectedProcessor ? product.metafields.processor_type === selectedProcessor : true;
    const matchesProcessorSubFilter = selectedProcessorSubFilter
      ? product.metafields.processor_subtype === selectedProcessorSubFilter
      : true;
    const matchesPrice =
      (priceRange.min ? parseFloat(product.priceRange.minVariantPrice.amount) >= priceRange.min : true) &&
      (priceRange.max ? parseFloat(product.priceRange.minVariantPrice.amount) <= priceRange.max : true);
    return matchesTag && matchesBrand && matchesProcessor && matchesProcessorSubFilter && matchesPrice;
  });

  return (
    <div className="collection">
      <h1>{collection.title}</h1>

      <FilterMenu
        tags={Array.from(new Set(collection.products.nodes.flatMap((product) => product.tags)))}
        brands={Array.from(new Set(collection.products.nodes.map((product) => product.vendor)))}
        processors={[
          'Intel Core Ultra', 'Intel Core i9', 'Intel Core i7', 'Intel Core i5',
          'Intel Core i3', 'AMD Ryzen 9', 'AMD Ryzen 7', 'AMD Ryzen 5', 'AMD Ryzen 3'
        ]}
        onTagChange={setSelectedTag}
        onBrandChange={setSelectedBrand}
        onProcessorChange={setSelectedProcessor}
        onProcessorSubFilterChange={setSelectedProcessorSubFilter}
        priceRange={priceRange}
        onPriceChange={setPriceRange}
      />

      <PaginatedResourceSection connection={filteredProducts} resourcesClassName="products-grid">
        {({ node: product, index }) => (
          <ProductItem key={product.id} product={product} loading={index < 15 ? 'eager' : undefined} />
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

// Filter Menu Component
function FilterMenu({
  tags,
  brands,
  processors,
  priceRange,
  onTagChange,
  onBrandChange,
  onProcessorChange,
  onProcessorSubFilterChange,
  onPriceChange,
}) {
  return (
    <div className="filter-menu">
      <label>Tag:</label>
      <select onChange={(e) => onTagChange(e.target.value)} defaultValue="">
        <option value="">All</option>
        {tags.map((tag) => (
          <option key={tag} value={tag}>{tag}</option>
        ))}
      </select>

      <label>Brand:</label>
      <select onChange={(e) => onBrandChange(e.target.value)} defaultValue="">
        <option value="">All Brands</option>
        {brands.map((brand) => (
          <option key={brand} value={brand}>{brand}</option>
        ))}
      </select>

      <label>Processor Type:</label>
      <select onChange={(e) => onProcessorChange(e.target.value)} defaultValue="">
        <option value="">All Processors</option>
        {processors.map((processor) => (
          <option key={processor} value={processor}>{processor}</option>
        ))}
      </select>

      {processors.includes(selectedProcessor) && (
        <div>
          <label>Processor Sub-Type:</label>
          <select onChange={(e) => onProcessorSubFilterChange(e.target.value)} defaultValue="">
            <option value="">All Sub-Types</option>
            {getSubFiltersForProcessor(selectedProcessor).map((subFilter) => (
              <option key={subFilter} value={subFilter}>{subFilter}</option>
            ))}
          </select>
        </div>
      )}

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

// Helper function for processor sub-filters
function getSubFiltersForProcessor(processor) {
  const processorSubFilters = {
    'Intel Core Ultra': ['Sub1', 'Sub2'],
    'Intel Core i9': ['Sub1', 'Sub2'],
  };
  return processorSubFilters[processor] || [];
}

// Product Item Component
function ProductItem({ product, loading }) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  return (
    <Link className="product-item-collection" key={product.id} prefetch="intent" to={variantUrl}>
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
