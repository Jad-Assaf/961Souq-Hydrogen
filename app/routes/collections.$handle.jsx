import {defer, redirect} from '@shopify/remix-oxygen';
import {
  useLoaderData,
  Link,
  useSearchParams,
  useLocation,
  useNavigate,
} from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
  Analytics,
  VariantSelector,
  getSeoMeta,
} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import React, {useEffect, useRef, useState} from 'react';
import {useMediaQuery} from 'react-responsive';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import '../styles/CollectionSlider.css';
import '../styles/CollectionsHandle.css';
import {FiltersDrawer, ShopifyFilterForm} from '~/components/FiltersDrawer';

function truncateText(text, maxWords) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const words = text.split(' ');
  return words.length > maxWords
    ? words.slice(0, maxWords).join(' ') + '...'
    : text;
}

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  const collection = data?.collection;
  return getSeoMeta({
    title: `${collection?.title || 'Collection'} | Lebanon | 961Souq`,
    description: truncateText(
      collection?.description || 'Explore our latest collection at 961Souq.',
      20,
    ),
    url: `https://961souq.com/collections/${collection?.handle || ''}`,
    image:
      collection?.image?.url ||
      'https://961souq.com/default-collection-image.jpg',
    jsonLd: [
      // CollectionPage Schema
      {
        '@context': 'http://schema.org/',
        '@type': 'CollectionPage',
        name: `${collection?.title || 'Collection'} | Lebanon | 961Souq`,
        url: `https://961souq.com/collections/${collection?.handle || ''}`,
        description: truncateText(collection?.description || '', 20),
        image: {
          '@type': 'ImageObject',
          url:
            collection?.image?.url ||
            'https://961souq.com/default-collection-image.jpg',
        },
      },
      // BreadcrumbList Schema
      {
        '@context': 'http://schema.org/',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://961souq.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: `${collection?.title || 'Collection'} | Lebanon | 961Souq`,
            item: `https://961souq.com/collections/${collection?.handle || ''}`,
          },
        ],
      },
      // ItemList Schema
      {
        '@context': 'http://schema.org/',
        '@type': 'ItemList',
        name: `${collection?.title || 'Collection'} | Lebanon | 961Souq`,
        description: truncateText(collection?.description || '', 20),
        url: `https://961souq.com/collections/${collection?.handle || ''}`,
        itemListElement: collection?.products?.nodes
          ?.slice(0, 20)
          .map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://961souq.com/products/${encodeURIComponent(
              product?.handle,
            )}`,
            name: truncateText(product?.title || 'Product', 10),
            image: {
              '@type': 'ImageObject',
              url:
                product?.featuredImage?.url ||
                'https://961souq.com/default-product-image.jpg',
            },
          })),
      },
    ],
  });
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return defer(
    {
      ...deferredData,
      ...criticalData,
    },
  );
}

/**
 * Load critical data with new filter and sort support.
 *
 * URL parameters prefixed with "filter." are mapped to Shopify filter objects.
 * Also, we now support a "sort" query parameter.
 *
 * @param {LoaderFunctionArgs} { context, params, request }
 */
export async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;
  const searchParams = new URL(request.url).searchParams;
  const paginationVariables = getPaginationVariables(request, {pageBy: 20});

  if (!handle) {
    throw redirect('/collections');
  }

  // Mapping for known filter keys.
  const filterMapping = {
    productVendor: 'productVendor',
    productType: 'productType',
  };

  // Build filters array by scanning URL parameters that start with "filter."
  const filters = [];
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter.')) {
      const filterKey = key.replace('filter.', '');
      const field = filterMapping[filterKey] || filterKey;
      let filterValue;
      if (field === 'available') {
        filterValue = value.toLowerCase() === 'true';
      } else if (field === 'price' || field === 'productMetafield') {
        try {
          filterValue = JSON.parse(value);
          if (
            field === 'productMetafield' &&
            filterValue &&
            typeof filterValue === 'object'
          ) {
            if ('productMetafield' in filterValue) {
              filterValue = filterValue.productMetafield;
            }
          }
        } catch (e) {
          filterValue = value;
        }
      } else {
        try {
          filterValue = JSON.parse(value);
        } catch (e) {
          filterValue = value;
        }
        if (
          typeof filterValue === 'string' &&
          filterValue.startsWith('"') &&
          filterValue.endsWith('"')
        ) {
          filterValue = filterValue.slice(1, -1);
        }
      }
      filters.push({[field]: filterValue});
    }
  }

  // Read the sort option from URL; default to 'default'
  const sortOption = searchParams.get('sort') || 'default';
  // Map sortOption to Shopify sortKey and reverse flag.
  // Adjust these keys as needed per Shopify’s Storefront API.
  const sortMapping = {
    default: {sortKey: 'CREATED', reverse: true},
    priceLowToHigh: {sortKey: 'PRICE', reverse: false},
    priceHighToLow: {sortKey: 'PRICE', reverse: true},
    alphabetical: {sortKey: 'TITLE', reverse: false},
  };
  const {sortKey, reverse} = sortMapping[sortOption] || sortMapping.default;

  try {
    const {collection} = await storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        first: 20,
        filters: filters.length > 0 ? filters : undefined,
        sortKey, // Pass the sort key
        reverse, // Pass the reverse flag
        ...paginationVariables,
      },
    });

    if (!collection) {
      throw new Response(`Collection ${handle} not found`, {status: 404});
    }

    let menu = null;
    let sliderCollections = [];

    try {
      const menuResult = await storefront.query(MENU_QUERY, {
        variables: {handle},
      });
      menu = menuResult.menu;
    } catch (error) {
      console.error('Error fetching menu:', error);
    }

    if (menu && menu.items && menu.items.length > 0) {
      try {
        sliderCollections = await Promise.all(
          menu.items.map(async (item) => {
            try {
              const sanitizedHandle = sanitizeHandle(item.title);
              const {collection} = await storefront.query(
                COLLECTION_BY_HANDLE_QUERY,
                {variables: {handle: sanitizedHandle}},
              );
              return collection;
            } catch (error) {
              console.error(
                `Error fetching collection for ${item.title}:`,
                error,
              );
              return null;
            }
          }),
        );
        sliderCollections = sliderCollections.filter(
          (collection) => collection !== null,
        );
      } catch (error) {
        console.error('Error fetching slider collections:', error);
      }
    }

    return {
      collection,
      sliderCollections,
      seo: {
        title: collection?.seo?.title || `${collection.title} Collection`,
        description:
          collection?.seo?.description || collection.description || '',
        image: collection?.image?.url || null,
      },
    };
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw new Response('Error fetching collection', {status: 500});
  }
}

function sanitizeHandle(handle) {
  return handle
    .toLowerCase()
    .replace(/"/g, '')
    .replace(/&/g, '')
    .replace(/\./g, '-')
    .replace(/\s+/g, '-');
}

/**
 * Load deferred data.
 * @param {LoaderFunctionArgs} { context }
 */
function loadDeferredData({context}) {
  return {};
}

// ------------------
// Modified COLLECTION component
// ------------------
export default function Collection() {
  const {collection, sliderCollections} = useLoaderData();
  const isDesktop = useMediaQuery({minWidth: 1024});
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Read current sort from URL (or default)
  const currentSort = searchParams.get('sort') || 'default';

  // New state for grid columns (1–5)
  const [columns, setColumns] = useState(1);

  // Remove unwanted pagination params on initial load.
  useEffect(() => {
    const url = new URL(window.location.href);
    const query = url.searchParams;
    query.delete('direction');
    query.delete('cursor');
    const cleanUrl = `${url.origin}${url.pathname}?${query.toString()}`;
    window.history.replaceState({}, '', cleanUrl);
  }, []);

  // When sort changes, update the URL so that loader refetches sorted data.
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    const url = new URL(window.location.href);
    url.searchParams.set('sort', newSort);
    // Reset pagination parameters if needed.
    url.searchParams.delete('cursor');
    window.location.href = url.toString();
  };

  return (
    <div className="collection">
      <h1>{collection.title}</h1>

      {sliderCollections && sliderCollections.length > 0 && (
        <div className="slide-con">
          <div className="category-slider">
            {sliderCollections.map(
              (sliderCollection) =>
                sliderCollection && (
                  <Link
                    key={sliderCollection.id}
                    to={`/collections/${sliderCollection.handle}`}
                    className="category-container"
                  >
                    {sliderCollection.image && (
                      <img
                        sizes="(min-width: 45em) 20vw, 40vw"
                        srcSet={`
                          ${sliderCollection.image.url}?width=300&quality=7 300w,
                          ${sliderCollection.image.url}?width=600&quality=7 600w,
                          ${sliderCollection.image.url}?width=1200&quality=7 1200w
                        `}
                        alt={
                          sliderCollection.image.altText ||
                          sliderCollection.title
                        }
                        className="category-image"
                        width="150"
                        height="150"
                        loading="eager"
                      />
                    )}
                    <div className="category-title">
                      {sliderCollection.title}
                    </div>
                  </Link>
                ),
            )}
          </div>
        </div>
      )}
      {/* Grid Columns Options */}
      <div className="view-sort">
        {/* Sort Options */}
        <div className="sort-options">
          <label htmlFor="sort">Sort By: </label>
          <select id="sort" value={currentSort} onChange={handleSortChange}>
            <option value="default">Newest</option>
            <option value="priceLowToHigh">Price: Low to High</option>
            <option value="priceHighToLow">Price: High to Low</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
        {/* Grid Columns Options */}
        <div className="grid-columns-options">
          <span>View: </span>
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => setColumns(num)}
              className={`col-btn-${num}`}
              style={{
                marginRight: '0.5rem',
                padding: '0.1rem 0.5rem',
                borderRadius: '2px',
                border:
                  columns === num ? '2px solid #2172af' : '1px solid #ccc',
              }}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
      {/* Mobile Filters Drawer */}
      <div className="lg:hidden mobile-filter-container">
        <div className="my-4">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="mobile-filter-btn"
          >
            Filters
          </button>
        </div>
        <FiltersDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          filters={collection.products.filters}
        />
      </div>
      <hr className="col-hr" />
      <div className="flex w-full">
        <div className="flex mt-10 flex-row w-[100%]">
          <div className="hidden lg:block w-1/4">
            <ShopifyFilterForm filters={collection.products.filters} />
          </div>
          <div className="collections-right-side w-[100%]">
            {/* Check if there are products in the collection */}
            {collection.products.nodes.length === 0 ? (
              <p className="no-products-collection">
                No products are available in this section right now!
              </p>
            ) : (
              <PaginatedResourceSection
                key="products-grid"
                connection={collection.products}
                resourcesClassName={`products-grid grid-cols-${columns} w-[100%]`}
              >
                {({node: product, index}) => (
                  <ProductItem
                    key={product.id}
                    product={product}
                    index={index}
                    numberInRow={1}
                  />
                )}
              </PaginatedResourceSection>
            )}
          </div>
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
const ProductItem = ({product, index, numberInRow}) => {
  const ref = useRef(null);
  const [isSoldOut, setIsSoldOut] = useState(false);

  useEffect(() => {
    const soldOut = !product.variants.nodes.some(
      (variant) => variant.availableForSale,
    );
    setIsSoldOut(soldOut);
  }, [product]);

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.nodes[0],
  );

  const variantUrl = useVariantUrl(
    product.handle,
    selectedVariant.selectedOptions,
  );

  const hasDiscount =
    product.compareAtPriceRange &&
    product.compareAtPriceRange.minVariantPrice.amount >
      product.priceRange.minVariantPrice.amount;

  return (
    <div className="product-item-collection product-card" ref={ref}>
      <div>
        <div className="mobile-container">
          <Link
            key={product.id}
            prefetch="intent"
            to={variantUrl}
            className="collection-product-link"
          >
            {product.featuredImage && (
              <div className="collection-product-image">
                <div
                  className="sold-out-ban"
                  style={{display: isSoldOut ? 'flex' : 'none'}}
                >
                  <p>Sold Out</p>
                </div>
                <img
                  srcSet={`
                    ${product.featuredImage.url}?width=300&quality=15 300w,
                    ${product.featuredImage.url}?width=600&quality=15 600w,
                    ${product.featuredImage.url}?width=1200&quality=15 1200w
                  `}
                  alt={product.featuredImage.altText || product.title}
                  loading="lazy"
                  width="180"
                  height="180"
                />
              </div>
            )}
          </Link>
          <div className="product-info-container">
            <Link key={product.id} prefetch="intent" to={variantUrl}>
              <h4>{truncateText(product.title, 30)}</h4>
              <p className="product-description">
                {truncateText(product.description, 90)}
              </p>
              <div className="price-container">
                <small
                  className={`product-price ${
                    Number(selectedVariant.price.amount) > 0 &&
                    selectedVariant.compareAtPrice &&
                    parseFloat(selectedVariant.compareAtPrice.amount) >
                      parseFloat(selectedVariant.price.amount)
                      ? 'discounted'
                      : ''
                  }`}
                >
                  {selectedVariant?.price &&
                  Number(selectedVariant.price.amount) === 0 ? (
                    <span>Call For Price</span>
                  ) : (
                    <Money data={selectedVariant.price} />
                  )}
                </small>

                {Number(selectedVariant.price.amount) > 0 &&
                  selectedVariant.compareAtPrice &&
                  parseFloat(selectedVariant.compareAtPrice.amount) >
                    parseFloat(selectedVariant.price.amount) && (
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
        </div>
        <ProductForm
          product={product}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
        />
      </div>
    </div>
  );
};

/**
 * @param {{
 *   product: ProductFragment;
 *   selectedVariant: ProductVariantFragment;
 *   setSelectedVariant: (variant: ProductVariantFragment) => void;
 * }}
 */
function ProductForm({product, selectedVariant, setSelectedVariant}) {
  const {open} = useAside();
  const hasVariants = product.variants.nodes.length > 1;

  return (
    <div className="product-form">
      <AddToCartButton
        disabled={
          !selectedVariant ||
          !selectedVariant.availableForSale ||
          (selectedVariant?.price && Number(selectedVariant.price.amount) === 0)
        }
        onClick={() => {
          if (hasVariants) {
            window.location.href = `/products/${encodeURIComponent(
              product.handle,
            )}`;
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
        {selectedVariant?.price && Number(selectedVariant.price.amount) === 0
          ? 'Call For Price'
          : !selectedVariant?.availableForSale
          ? 'Sold out'
          : hasVariants
          ? 'Select Options'
          : 'Add to cart'}
      </AddToCartButton>
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
    description
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
    variants(first: 25) {
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

// Note: COLLECTION_QUERY now accepts two extra variables: $sortKey and $reverse
const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        title
        description
      }
      image {
        url
        altText
      }
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
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
