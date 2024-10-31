import { defer, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useNavigate, useLocation } from '@remix-run/react';
import { getPaginationVariables, Money, Analytics } from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { AnimatedImage } from '~/components/AnimatedImage';
import { truncateText } from '~/components/CollectionDisplay';
import { useEffect, useState } from 'react';

export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.collection?.title ?? ''} Collection` }];
};

export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return defer({ ...deferredData, ...criticalData });
}

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
  const [activeFilters, setActiveFilters] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const handleFilterChange = (filterType, filterValue) => {
    const updatedFilters = {
      ...activeFilters,
      [filterType]: filterValue,
    };
    setActiveFilters(updatedFilters);

    const searchParams = new URLSearchParams(location.search);
    searchParams.set(filterType, filterValue);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filtersFromUrl = {};
    for (const [key, value] of params.entries()) {
      filtersFromUrl[key] = value;
    }
    setActiveFilters(filtersFromUrl);
  }, [location.search]);

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <FilterMenu filters={collection.filters} activeFilters={activeFilters} onFilterChange={handleFilterChange} />
      <PaginatedResourceSection connection={collection.products} resourcesClassName="products-grid">
        {({ node: product, index }) => (
          <ProductItem key={product.id} product={product} loading={index < 15 ? 'eager' : undefined} />
        )}
      </PaginatedResourceSection>
      <Analytics.CollectionView data={{ collection: { id: collection.id, handle: collection.handle } }} />
    </div>
  );
}

function FilterMenu({ filters, activeFilters, onFilterChange }) {
  return (
    <div className="filter-menu">
      {filters.map((filter) => (
        <div key={filter.label}>
          <label>{filter.label}</label>
          <select value={activeFilters[filter.label] || ''} onChange={(e) => onFilterChange(filter.label, e.target.value)}>
            <option value="">All</option>
            {filter.values.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function ProductItem({ product, loading }) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  return (
    <Link className="product-item-collection" key={product.id} prefetch="intent" to={variantUrl}>
      {product.featuredImage && (
        <AnimatedImage
          srcSet={`${product.featuredImage.url}?width=300&quality=30 300w, ${product.featuredImage.url}?width=600&quality=30 600w, ${product.featuredImage.url}?width=1200&quality=30 1200w`}
          alt={product.featuredImage.altText || product.title}
          loading={loading}
          width="180px"
          height="180px"
        />
      )}
      <h4>{truncateText(product.title, 20)}</h4>
      <small><Money data={product.priceRange.minVariantPrice} /></small>
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
      filters {
        label
        type
        values
      }
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
