import { defer, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useSearchParams, useLocation, useNavigate } from '@remix-run/react';
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
import { DrawerFilter } from '~/modules/drawer-filter';
import { FILTER_URL_PREFIX } from '~/lib/const';
import { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { FiltersDrawer } from '../modules/drawer-filter';
import { getAppliedFilterLink } from '../lib/filter';
import { useCart } from '@shopify/hydrogen';

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
  const paginationVariables = getPaginationVariables(request, { pageBy: 50 });

  const sort = searchParams.get('sort');
  let sortKey;
  let reverse = false;

  // Map sort values to Shopify's sortKey and reverse
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
    // Fetch main collection
    const { collection } = await storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        filters: filters.length ? filters : undefined,
        sortKey,
        reverse,
        ...paginationVariables,
      },
    });

    if (!collection) {
      throw new Response(`Collection ${handle} not found`, { status: 404 });
    }

    let menu = null;
    let sliderCollections = [];

    try {
      // Fetch menu for slider collections
      const menuResult = await storefront.query(MENU_QUERY, {
        variables: { handle },
      });
      menu = menuResult.menu;
    } catch (error) {
      console.error("Error fetching menu:", error);
      // Don't throw here, just log the error and continue with an empty menu
    }

    // Only fetch slider collections if menu exists and has items
    if (menu && menu.items && menu.items.length > 0) {
      try {
        // Fetch collections for the slider based on the menu items
        sliderCollections = await Promise.all(
          menu.items.map(async (item) => {
            try {
              const sanitizedHandle = sanitizeHandle(item.title);
              const { collection } = await storefront.query(COLLECTION_BY_HANDLE_QUERY, {
                variables: { handle: sanitizedHandle },
              });
              return collection;
            } catch (error) {
              console.error(`Error fetching collection for ${item.title}:`, error);
              return null; // Return null for failed collection fetches
            }
          })
        );
        // Filter out any null results
        sliderCollections = sliderCollections.filter(collection => collection !== null);
      } catch (error) {
        console.error("Error fetching slider collections:", error);
        // If there's an error fetching slider collections, we'll just use an empty array
      }
    }

    // Process applied filters
    const appliedFilters = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith(FILTER_URL_PREFIX)) {
        const filterKey = key.replace(FILTER_URL_PREFIX, '');
        const filterValue = JSON.parse(value);
        appliedFilters.push({
          label: `${value}`,
          filter: { [filterKey]: filterValue },
        });
      }
    });

    return { collection, appliedFilters, sliderCollections };
  } catch (error) {
    console.error("Error fetching collection:", error);
    throw new Response("Error fetching collection", { status: 500 });
  }
}

function sanitizeHandle(handle) {
  return handle
    .toLowerCase()
    .replace(/"/g, '')  // Remove all quotes
    .replace(/&/g, '')  // Remove all quotes
    .replace(/\./g, '-')  // Replace periods with hyphens
    .replace(/\s+/g, '-');  // Replace spaces with hyphens (keeping this from the original code)
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
  const { collection, appliedFilters, sliderCollections } = useLoaderData();
  const [numberInRow, setNumberInRow] = useState(4);
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLayoutChange = (number) => {
    setNumberInRow(number);
  };

  const handleFilterRemove = (filter) => {
    const newUrl = getAppliedFilterLink(filter, searchParams, location);
    navigate(newUrl);
  };

  return (
    <div className="collection">
      <h1>{collection.title}</h1>

      {sliderCollections && sliderCollections.length > 0 && (
        <div className="slide-con">
          <div className="category-slider">
            {sliderCollections.map((sliderCollection) => (
              sliderCollection && (
                <Link
                  key={sliderCollection.id}
                  to={`/collections/${sliderCollection.handle}`}
                  className="category-container"
                >
                  {sliderCollection.image && (
                    <img
                      src={sliderCollection.image.url}
                      alt={sliderCollection.image.altText || sliderCollection.title}
                      className="category-image"
                      width={150}
                      height={150}
                    />
                  )}
                  <div className="category-title">{sliderCollection.title}</div>
                </Link>
              )
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row w-[100%]">
        {isDesktop && (
          <div className="w-[220px]">
            <FiltersDrawer
              filters={collection.products.filters}
              appliedFilters={appliedFilters}
              onRemoveFilter={handleFilterRemove}
            />
          </div>
        )}

        <div className="flex-1">
          <DrawerFilter
            filters={collection.products.filters}
            appliedFilters={appliedFilters}
            numberInRow={numberInRow}
            onLayoutChange={handleLayoutChange}
            productNumber={collection.products.nodes.length}
            isDesktop={isDesktop}
          />

          <hr className='col-hr'></hr>

          <PaginatedResourceSection
            connection={collection.products}
            resourcesClassName={`products-grid grid-cols-${numberInRow}`}
          >
            {({ node: product, index }) => (
              <ProductItem
                key={product.id}
                product={product}
                loading={index < 50 ? 'eager' : undefined}
              />
            )}
          </PaginatedResourceSection>
        </div>
      </div>

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
  const { lines, status, addLine } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);
  const [isHovered, setIsHovered] = useState(false);

  const hasDiscount = product.compareAtPriceRange &&
    product.compareAtPriceRange.minVariantPrice.amount >
    product.priceRange.minVariantPrice.amount;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addLine({
        merchandiseId: variant.id,
        quantity: 1
      });
      // Optionally, you can add some feedback here, like a toast notification
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Optionally, show an error message to the user
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link
      className="product-item-collection relative"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-container relative">
        {product.featuredImage && (
          <AnimatedImage
            srcSet={`${product.featuredImage.url}?width=300&quality=30 300w,
                     ${product.featuredImage.url}?width=600&quality=30 600w,
                     ${product.featuredImage.url}?width=1200&quality=30 1200w`}
            alt={product.featuredImage.altText || product.title}
            loading={loading}
            width="100%"
            height="auto"
          />
        )}

        {/* Add to Cart Button */}
        <div
          className={`add-to-cart-overlay ${isHovered ? 'visible' : ''}`}
        >
          <button
            onClick={handleAddToCart}
            className={`add-to-cart-button ${isAdding ? 'loading' : ''}`}
            disabled={isAdding || status === 'updating'}
            aria-label="Add to Cart"
          >
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>

      <h4>{truncateText(product.title, 20)}</h4>
      <div className="price-container">
        <small className={`current-price ${hasDiscount ? 'discounted' : ''}`}>
          <Money data={product.priceRange.minVariantPrice} />
        </small>
        {hasDiscount && (
          <small className="original-price">
            <Money data={product.compareAtPriceRange.minVariantPrice} />
          </small>
        )}
      </div>
    </Link>
  );
}

const MENU_QUERY = `#graphql
  query GetMenu($handle: String!) {
    menu(handle: $handle) {
      items {
        title
        url
      }
    }
  }
`;

const COLLECTION_BY_HANDLE_QUERY = `#graphql
  query GetCollectionByHandle($handle: String!) {
    collection(handle: $handle) {
      id
      title
      handle
      image {
        url
        altText
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
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 1) {
      nodes {
        id
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) {
    collection(handle: $handle) {
      id
      handle
      title
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
