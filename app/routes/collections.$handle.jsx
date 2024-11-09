import { defer, redirect } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useSearchParams, useLocation, useNavigate } from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
  Analytics,
  VariantSelector,
} from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';
import { PaginatedResourceSection } from '~/components/PaginatedResourceSection';
import { AnimatedImage } from '~/components/AnimatedImage';
import { truncateText } from '~/components/CollectionDisplay';
import { DrawerFilter } from '~/modules/drawer-filter';
import { FILTER_URL_PREFIX } from '~/lib/const';
import React, { useRef, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { FiltersDrawer } from '../modules/drawer-filter';
import { getAppliedFilterLink } from '../lib/filter';
import { AddToCartButton } from '../components/AddToCartButton';
import { useAside } from '~/components/Aside';
import { motion, useInView } from 'framer-motion';

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

  const sortedProducts = React.useMemo(() => {
    const products = [...collection.products.nodes];
    return products.sort((a, b) => {
      // Check if any variant is available for sale
      const aInStock = a.variants.nodes.some(variant => variant.availableForSale);
      const bInStock = b.variants.nodes.some(variant => variant.availableForSale);

      if (aInStock && !bInStock) return -1;
      if (!aInStock && bInStock) return 1;
      return 0;
    });
  }, [collection.products.nodes]);

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
                      width={150} height={150}
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
            connection={{
              ...collection.products,
              nodes: sortedProducts, // Use sortedProducts instead of collection.products.nodes
            }}
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
function ProductItem({ product, index }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px 200px 0px' });

  const [selectedVariant, setSelectedVariant] = useState(() => {
    return product.variants.nodes.find(variant => variant.availableForSale) || product.variants.nodes[0];
  });
  const variantUrl = useVariantUrl(product.handle, selectedVariant.selectedOptions);

  const hasDiscount = product.compareAtPriceRange &&
    product.compareAtPriceRange.minVariantPrice.amount >
    product.priceRange.minVariantPrice.amount;

  return (
    <div className="product-item-collection product-card" ref={ref}>
      <Link key={product.id} prefetch="intent" to={variantUrl}>
        {product.featuredImage && isInView && (
          <div style={{ position: 'relative', width: '180px', height: '180px' }}>
            {/* Shimmer Overlay */}
            {!isImageLoaded && (
              <motion.div
                className="shimmer" // Shimmer overlay
                initial={{ opacity: 1 }}
                animate={{ opacity: isImageLoaded ? 0 : 1 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1,
                }}
              />
            )}
            {/* Image with Blur Transition */}
            <motion.div
              initial={{ filter: 'blur(10px)' }}
              animate={{ filter: isImageLoaded ? 'blur(0px)' : 'blur(10px)' }}
              transition={{
                filter: { duration: 0.5, ease: 'easeInOut' },
                delay: index * 0.1,
              }}
              style={{ position: 'relative', zIndex: 2 }}
            >
              <Image
                srcSet={`${product.featuredImage.url}?width=300&quality=30 300w,
                         ${product.featuredImage.url}?width=600&quality=30 600w,
                         ${product.featuredImage.url}?width=1200&quality=30 1200w`}
                alt={product.featuredImage.altText || product.title}
                loading="lazy"
                width={180}
                height={180}
                onLoad={() => setIsImageLoaded(true)}
                style={{ display: isImageLoaded ? 'block' : 'none' }}
              />
            </motion.div>
          </div>
        )}
        <h4>{truncateText(product.title, 50)}</h4>
        <div className="price-container">
          <small className={`product-price ${hasDiscount ? 'discounted' : ''}`}>
            <Money data={selectedVariant.price} />
          </small>
          {hasDiscount && selectedVariant.compareAtPrice && (
            <small className="discountedPrice">
              <Money data={selectedVariant.compareAtPrice} />
            </small>
          )}
        </div>
      </Link>
      <ProductForm
        product={product}
        selectedVariant={selectedVariant}
        setSelectedVariant={setSelectedVariant}
      />
    </div>
  );
}

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductVariantFragment;
 *   setSelectedVariant: (variant: ProductVariantFragment) => void;
 * }}
 */
function ProductForm({ product, selectedVariant, setSelectedVariant }) {
  const { open } = useAside();
  const hasVariants = product.variants.nodes.length > 1;

  return (
    <div className="product-form">
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          if (hasVariants) {
            // Navigate to product page
            window.location.href = `/products/${product.handle}`;
          } else {
            open('cart');
          }
        }}
        lines={
          selectedVariant && !hasVariants
            ? [
              {
                merchandiseId: selectedVariant.id,
                quantity: 1,
                attributes: [],
                product: {
                  ...product,
                  selectedVariant,
                  handle: product.handle,
                },
              },
            ]
            : []
        }
      >
        {!selectedVariant?.availableForSale
          ? 'Sold out'
          : hasVariants
            ? 'Select Options'
            : 'Add to cart'}
      </AddToCartButton>
    </div>
  );
}

/**
 * @param {{ option: VariantOption }}
 */
function ProductOptions({ option }) {
  return (
    <div className="product-options" key={option.name}>
      <h5>{option.name}</h5>
      <div className="product-options-grid">
        {option.values.map(({ value, isAvailable, isActive, to }) => {
          return (
            <Link
              className="product-options-item"
              key={option.name + value}
              prefetch="intent"
              preventScrollReset
              replace
              to={to}
              onClick={(e) => {
                e.preventDefault(); // Add this line
                // Handle variant selection here if needed
              }}
              style={{
                border: isActive ? '1px solid black' : '1px solid transparent',
                opacity: isAvailable ? 1 : 0.3,
              }}
            >
              {value}
            </Link>
          );
        })}
      </div>
    </div>
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
    options {
      name
      values
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
    variants(first: 250) {
      nodes {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        sku
        title
        unitPrice {
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
          availableForSale
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