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
import React, { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { FiltersDrawer } from '../modules/drawer-filter';
import { getAppliedFilterLink } from '../lib/filter';
import { AddToCartButton } from '../components/AddToCartButton';
import { useAside } from '~/components/Aside';
import { motion, useAnimation, useInView } from 'framer-motion';

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

  // Set default sort to 'newest' if no sort parameter is provided
  const sort = searchParams.get('sort') || 'newest';
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
      sortKey = 'CREATED';
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
  const [numberInRow, setNumberInRow] = useState(5);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1500
  );
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
  if (typeof window !== "undefined") {
    const updateScreenWidth = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      if (width >= 1500) setNumberInRow(5);
      else if (width >= 1200) setNumberInRow(4);
      else if (width >= 550) setNumberInRow(3);
      else setNumberInRow(1);
    };

    updateScreenWidth();
    window.addEventListener("resize", updateScreenWidth);

    return () => {
      window.removeEventListener("resize", updateScreenWidth);
    };
  }
}, []);

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
          {/* Layout controls */}
          <div className="layout-controls mb-4">

            {screenWidth >= 300 && (
              <button
                className={`px-2 py-1 border rounded mr-2 ${numberInRow === 1 ? 'active' : ''}`}
                onClick={() => handleLayoutChange(1)}
              >
                <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2172af"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z" fill="#2172af"></path> </g></svg>
              </button>
            )}
            {screenWidth >= 300 && (
              <button
                className={`px-2 py-1 border rounded mr-2 ${numberInRow === 2 ? 'active' : ''}`}
                onClick={() => handleLayoutChange(2)}
              >
                <svg fill="#2172af" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" stroke="#2172af"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M8.5,10a2,2,0,1,0,2,2A2,2,0,0,0,8.5,10Zm0,7a2,2,0,1,0,2,2A2,2,0,0,0,8.5,17Zm7-10a2,2,0,1,0-2-2A2,2,0,0,0,15.5,7Zm-7-4a2,2,0,1,0,2,2A2,2,0,0,0,8.5,3Zm7,14a2,2,0,1,0,2,2A2,2,0,0,0,15.5,17Zm0-7a2,2,0,1,0,2,2A2,2,0,0,0,15.5,10Z"></path></g></svg>
              </button>
            )}
            {screenWidth >= 550 && (
              <button
                className={`px-2 py-1 border rounded mr-2 ${numberInRow === 3 ? 'active' : ''}`}
                onClick={() => handleLayoutChange(3)}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#2172af"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7 5C7 6.10457 6.10457 7 5 7C3.89543 7 3 6.10457 3 5C3 3.89543 3.89543 3 5 3C6.10457 3 7 3.89543 7 5Z" fill="#2172af"></path> <path d="M14 5C14 6.10457 13.1046 7 12 7C10.8954 7 10 6.10457 10 5C10 3.89543 10.8954 3 12 3C13.1046 3 14 3.89543 14 5Z" fill="#2172af"></path> <path d="M19 7C20.1046 7 21 6.10457 21 5C21 3.89543 20.1046 3 19 3C17.8954 3 17 3.89543 17 5C17 6.10457 17.8954 7 19 7Z" fill="#2172af"></path> <path d="M7 12C7 13.1046 6.10457 14 5 14C3.89543 14 3 13.1046 3 12C3 10.8954 3.89543 10 5 10C6.10457 10 7 10.8954 7 12Z" fill="#2172af"></path> <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" fill="#2172af"></path> <path d="M21 12C21 13.1046 20.1046 14 19 14C17.8954 14 17 13.1046 17 12C17 10.8954 17.8954 10 19 10C20.1046 10 21 10.8954 21 12Z" fill="#2172af"></path> <path d="M5 21C6.10457 21 7 20.1046 7 19C7 17.8954 6.10457 17 5 17C3.89543 17 3 17.8954 3 19C3 20.1046 3.89543 21 5 21Z" fill="#2172af"></path> <path d="M14 19C14 20.1046 13.1046 21 12 21C10.8954 21 10 20.1046 10 19C10 17.8954 10.8954 17 12 17C13.1046 17 14 17.8954 14 19Z" fill="#2172af"></path> <path d="M19 21C20.1046 21 21 20.1046 21 19C21 17.8954 20.1046 17 19 17C17.8954 17 17 17.8954 17 19C17 20.1046 17.8954 21 19 21Z" fill="#2172af"></path> </g></svg>
              </button>
            )}
            {screenWidth >=1200 && (
              <button
                className={`px-2 py-1 border rounded mr-2 ${numberInRow === 4 ? 'active' : ''}`}
                onClick={() => handleLayoutChange(4)}
              >
                <img src="../assets/4dots.svg" />
              </button>
            )}
            {screenWidth >= 1500 && (
              <button
                className={`px-2 py-1 border rounded ${numberInRow === 5 ? 'active' : ''}`}
                onClick={() => handleLayoutChange(5)}
              >
                <img src="../assets/5dots.svg" />
              </button>
            )}
          </div>

          <PaginatedResourceSection
            key={`products-grid-${numberInRow}`} // Forces re-render on change
            connection={{
              ...collection.products,
              nodes: sortedProducts,
            }}
            resourcesClassName={`products-grid grid-cols-${numberInRow}`} // Dynamic class
          >
            {({ node: product, index }) => (
              <ProductItem
                key={product.id}
                product={product}
                index={index}
                numberInRow={numberInRow}
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
export function ProductItem({ product, index, numberInRow }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px 100px 0px' });
  const controls = useAnimation();

  // Calculate row and column delay
  const rowIndex = Math.floor(index / numberInRow);
  const columnIndex = index % numberInRow;
  const delay = rowIndex * 0.3 + columnIndex * 0.1;

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls, index, numberInRow]);

  const [selectedVariant, setSelectedVariant] = useState(() => {
    return product.variants.nodes.find(variant => variant.availableForSale) || product.variants.nodes[0];
  });
  const variantUrl = useVariantUrl(product.handle, selectedVariant.selectedOptions);

  const hasDiscount = product.compareAtPriceRange &&
    product.compareAtPriceRange.minVariantPrice.amount >
    product.priceRange.minVariantPrice.amount;

  return (
    <div className="product-item-collection product-card" ref={ref}>
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={controls}
        variants={{
          visible: {
            opacity: 1,
            x: 0,
            transition: { delay, duration: 0.2 }
          }
        }}
      >
        <Link key={product.id} prefetch="intent" to={variantUrl} className='collection-product-link'>
          {product.featuredImage && isInView && (
            <motion.div
              initial={{ filter: 'blur(10px)', opacity: 0 }}
              animate={{ filter: isImageLoaded ? 'blur(0px)' : 'blur(10px)', opacity: 1 }}
              transition={{ duration: 0.5 }}
              className='collection-product-image'
            >
              <Image
                srcSet={`${product.featuredImage.url}?width=300&quality=30 300w,
                         ${product.featuredImage.url}?width=600&quality=30 600w,
                         ${product.featuredImage.url}?width=1200&quality=30 1200w`}
                alt={product.featuredImage.altText || product.title}
                loading="lazy"
                width="180px"
                height="180px"
                onLoad={() => setIsImageLoaded(true)}
              />
            </motion.div>
          )}
          <div className='product-info-container'>
            <h4>{truncateText(product.title, 50)}</h4>
            {typeof window !== "undefined" &&
              window.innerWidth > 1500 &&
              numberInRow === 1 &&
              product.description && ( // Ensure description exists
                <p className="product-description">
                  {truncateText(product.description, 200)}
                </p>
              )}

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
          </div>
        </Link>
        <ProductForm
          product={product}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
        />
      </motion.div>
    </div>
  );
}


// Animation variants for staggered loading
const staggerVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

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
      description
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