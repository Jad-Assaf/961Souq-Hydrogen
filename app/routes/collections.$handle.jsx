// import '../styles/CollectionSlider.css';
import '../styles/CollectionsHandle.css';
import {redirect} from '@shopify/remix-oxygen';
// import '../styles/HomeSliderWithMoreHeight.css';
import {
  useLoaderData,
  Link,
  useSearchParams,
  useLocation,
  useNavigate,
  data,
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
import React, {useEffect, useRef, useState} from 'react';
import {useMediaQuery} from 'react-responsive';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {FiltersDrawer, ShopifyFilterForm} from '~/components/FiltersDrawer';

function truncateText(text, maxWords) {
  if (!text || typeof text !== 'string') return '';
  const words = text.split(' ');
  return words.length > maxWords
    ? words.slice(0, maxWords).join(' ') + '…'
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
      22,
    ),
    url: `https://961souq.com/collections/${collection?.handle || ''}`,
    image:
      collection?.image?.url ||
      'https://961souq.com/default-collection-image.jpg',
    jsonLd: [
      {
        '@context': 'http://schema.org/',
        '@type': 'CollectionPage',
        name: `${collection?.title || 'Collection'} | Lebanon | 961Souq`,
        url: `https://961souq.com/collections/${collection?.handle || ''}`,
        description: truncateText(collection?.description || '', 22),
        image: {
          '@type': 'ImageObject',
          url:
            collection?.image?.url ||
            'https://961souq.com/default-collection-image.jpg',
        },
      },
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
      {
        '@context': 'http://schema.org/',
        '@type': 'ItemList',
        name: `${collection?.title || 'Collection'} | Lebanon | 961Souq`,
        description: truncateText(collection?.description || '', 22),
        url: `https://961souq.com/collections/${collection?.handle || ''}`,
        itemListElement: collection?.products?.nodes
          ?.slice(0, 10)
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
  return data({
    ...deferredData,
    ...criticalData,
  });
}

/* ----------  data loaders (unchanged) ---------- */
export async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;
  const searchParams = new URL(request.url).searchParams;

  /* numbered-page param -> cursor handling */
  const pageBy = 30;
  const page = Number(searchParams.get('page') || 1);
  const paginationVariables = getPaginationVariables(request, {pageBy});

  if (!handle) throw redirect('/collections');

  /* --- filters / sort code unchanged --- */
  const ALLOWED_FILTERS = [
    'available',
    'price',
    'productMetafield',
    'productType',
    'productVendor',
    'tag',
    'variantMetafield',
    'variantOption',
  ];
  const filterMapping = {
    productVendor: 'productVendor',
    productType: 'productType',
  };
  const filters = [];
  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith('filter.')) continue;
    const filterKey = key.replace('filter.', '');
    if (!ALLOWED_FILTERS.includes(filterKey)) continue;
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
          typeof filterValue === 'object' &&
          'productMetafield' in filterValue
        ) {
          filterValue = filterValue.productMetafield;
        }
      } catch {
        filterValue = value;
      }
    } else {
      try {
        filterValue = JSON.parse(value);
      } catch {
        filterValue = value;
      }
      if (
        typeof filterValue === 'string' &&
        filterValue.startsWith('"') &&
        filterValue.endsWith('"')
      )
        filterValue = filterValue.slice(1, -1);
    }
    filters.push({[field]: filterValue});
  }

  const sortOption = searchParams.get('sort') || 'default';
  const sortMapping = {
    default: {sortKey: 'CREATED', reverse: true},
    priceLowToHigh: {sortKey: 'PRICE', reverse: false},
    priceHighToLow: {sortKey: 'PRICE', reverse: true},
    alphabetical: {sortKey: 'TITLE', reverse: false},
  };
  const {sortKey, reverse} = sortMapping[sortOption] || sortMapping.default;

  /* try collection query (with & without filters) */
  let collectionData;
  try {
    collectionData = await storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        first: pageBy,
        filters: filters.length ? filters : undefined,
        sortKey,
        reverse,
        ...paginationVariables,
      },
    });
  } catch (errWithFilters) {
    console.warn(
      'Collection query failed WITH filters – falling back:',
      errWithFilters,
    );
  }
  if (!collectionData) {
    try {
      collectionData = await storefront.query(COLLECTION_QUERY, {
        variables: {
          handle,
          first: pageBy,
          sortKey,
          reverse,
          ...paginationVariables,
        },
      });
    } catch (errNoFilters) {
      console.error('Collection query failed WITHOUT filters:', errNoFilters);
      collectionData = {
        collection: {
          id: handle,
          handle,
          title: handle,
          description: '',
          image: null,
          products: {
            nodes: [],
            filters: [],
            pageInfo: {
              hasPreviousPage: false,
              hasNextPage: false,
              startCursor: null,
              endCursor: null,
            },
          },
          seo: {title: '', description: ''},
        },
      };
    }
  }

  const {collection} = collectionData;
  if (!collection)
    throw new Response(`Collection ${handle} not found`, {status: 404});

  /* menu / slider collections (unchanged) */
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
  if (menu?.items?.length) {
    try {
      sliderCollections = await Promise.all(
        menu.items.map(async (item) => {
          const sanitizedHandle = sanitizeHandle(item.title);
          if (!sanitizedHandle) return null;
          try {
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
      sliderCollections = sliderCollections.filter(Boolean);
    } catch (error) {
      console.error('Error fetching slider collections:', error);
    }
  }

  return {
    collection,
    sliderCollections,
    currentPage: page,
  };
}

function sanitizeHandle(handle) {
  return handle
    .toLowerCase()
    .replace(/"/g, '')
    .replace(/&/g, '')
    .replace(/\./g, '-')
    .replace(/\s+/g, '-');
}

function loadDeferredData({context}) {
  return {};
}

/* ------------------  COLLECTION component ------------------ */
export default function Collection() {
  const {collection, sliderCollections, currentPage} = useLoaderData();
  const isDesktop = useMediaQuery({minWidth: 1024});
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const currentSort = searchParams.get('sort') || 'default';
  const [columns, setColumns] = useState(1);

  /* keep URL tidy on initial hydration (leave pagination params alone) */
  // useEffect(() => {
  //   const url = new URL(window.location.href);
  //   const query = url.searchParams;
  //   query.delete('direction');
  //   query.delete('cursor');
  //   url.search = query.toString();
  //   window.history.replaceState({}, '', url.toString());
  // }, []);

  /* helpers for numbered pagination */
  /* --- Collection component additions / replacements --- */
  const pageInfo = collection.products.pageInfo;

  const buildPageLink = ({page, cursor, direction}) => {
    const params = new URLSearchParams(location.search);
    params.set('page', page.toString());
    if (cursor) params.set('cursor', cursor);
    if (direction) params.set('direction', direction);
    return `${location.pathname}?${params.toString()}`;
  };

  /* --- FIX: build pageNumbers without padding to 3 --- */
  let pageNumbers = [];

  // only show “page – 1” if there really is a previous page and we're above page 1
  if (pageInfo.hasPreviousPage && currentPage > 1) {
    pageNumbers.push(currentPage - 1);
  }

  // always show the current page
  pageNumbers.push(currentPage);

  // show “page + 1” if there really is a next page
  if (pageInfo.hasNextPage) {
    pageNumbers.push(currentPage + 1);
  }

  // (optional) dedupe, in case edge-cases introduce duplicates
  pageNumbers = Array.from(new Set(pageNumbers));

  const handleSortChange = (e) => {
    const url = new URL(window.location.href);
    url.searchParams.set('sort', e.target.value);
    url.searchParams.set('page', '1');
    url.searchParams.delete('cursor');
    url.searchParams.delete('direction');
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
                          ${sliderCollection.image.url}&width=300 300w,
                          ${sliderCollection.image.url}&width=300 600w,
                          ${sliderCollection.image.url}&width=300 1200w
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
                      <h3>{sliderCollection.title}</h3>
                      {/* <p>{truncateText(sliderCollection.description || '', 10)}</p> */}
                    </div>
                  </Link>
                ),
            )}
          </div>
        </div>
      )}

      <div className="view-sort">
        <div className="sort-options">
          <label htmlFor="sort" className="mob-hide">
            Sort By:{' '}
          </label>
          <select id="sort" value={currentSort} onChange={handleSortChange}>
            <option value="default">Newest</option>
            <option value="priceLowToHigh">Price: Low to High</option>
            <option value="priceHighToLow">Price: High to Low</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
        <div className="grid-columns-options">
          <span className="mob-hide">View: </span>
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
        <div className="flex flex-row w-[100%] collection-bottom">
          <div className="hidden lg:block w-1/4">
            <ShopifyFilterForm filters={collection.products.filters} />
          </div>

          <div className="collections-right-side w-[100%]">
            {collection.products.nodes.length === 0 ? (
              <p className="no-products-collection">
                No products are available in this section right now!
              </p>
            ) : (
              <>
                <div className={`products-grid grid-cols-${columns} w-[100%]`}>
                  {collection.products.nodes.map((product, index) => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      index={index}
                      numberInRow={1}
                    />
                  ))}
                </div>

                <nav className="pagination-nav">
                  <ul className="pagination-list">
                    {currentPage > 1 && pageInfo.hasPreviousPage && (
                      <li className="pagination-item">
                        <Link
                          prefetch="intent"
                          to={buildPageLink({
                            page: currentPage - 1,
                            cursor: pageInfo.startCursor,
                            direction: 'prev',
                          })}
                        >
                          « Prev
                        </Link>
                      </li>
                    )}

                    {pageNumbers.map((n) =>
                      n === currentPage ? (
                        <li key={n} className="pagination-item current-page">
                          {n}
                        </li>
                      ) : (
                        <li key={n} className="pagination-item">
                          <Link
                            prefetch="intent"
                            to={buildPageLink({
                              page: n,
                              cursor:
                                n < currentPage
                                  ? pageInfo.startCursor
                                  : pageInfo.endCursor,
                              direction: n < currentPage ? 'prev' : 'next',
                            })}
                          >
                            {n}
                          </Link>
                        </li>
                      ),
                    )}

                    {pageInfo.hasNextPage && (
                      <li className="pagination-item">
                        <Link
                          prefetch="intent"
                          to={buildPageLink({
                            page: currentPage + 1,
                            cursor: pageInfo.endCursor,
                            direction: 'next',
                          })}
                        >
                          Next »
                        </Link>
                      </li>
                    )}
                  </ul>
                </nav>
              </>
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

/* ------------------  PRODUCT ITEM ------------------ */
const ProductItem = ({product, index, numberInRow}) => {
  const ref = useRef(null);
  const [isSoldOut, setIsSoldOut] = useState(false);

  useEffect(() => {
    setIsSoldOut(
      !product.variants.nodes.some((variant) => variant.availableForSale),
    );
  }, [product]);

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants.nodes[0],
  );
  const variantUrl = useVariantUrl(
    product.handle,
    selectedVariant.selectedOptions,
  );

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
                    ${product.featuredImage.url}&width=400 300w,
                    ${product.featuredImage.url}&width=400 600w,
                    ${product.featuredImage.url}&width=400 1200w
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
        contentId={product.id}
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

/* ------------------  GraphQL snippets (unchanged) ------------------ */
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
    variants(first: 5) {
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
