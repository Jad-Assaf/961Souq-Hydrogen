import { defer, redirect, json } from '@shopify/remix-oxygen';
import { useLoaderData, Link, useSearchParams, useLocation, useNavigate } from '@remix-run/react';
import { getPaginationVariables, Money, Analytics } from '@shopify/hydrogen';
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

export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.collection.title ?? ''} Collection` }];
};

export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return defer({ ...deferredData, ...criticalData });
}

export async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;
  const searchParams = new URL(request.url).searchParams;
  const paginationVariables = getPaginationVariables(request, { pageBy: 50 });

  const sort = searchParams.get('sort');
  let sortKey;
  let reverse = false;

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

    // Fetch menu items using the current collection's handle
    const { menu } = await storefront.query(MENU_QUERY, {
      variables: { handle },
    });

    // Fetch collections for the slider
    const sliderCollections = await Promise.all(
      menu.items.map(async (item) => {
        const { collection } = await storefront.query(COLLECTION_BY_HANDLE_QUERY, {
          variables: { handle: item.title.toLowerCase().replace(/\s+/g, '-') },
        });
        return collection;
      })
    );

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

    return json({ collection, sliderCollections, appliedFilters });
  } catch (error) {
    console.error("Error fetching collection:", error);
    throw new Response("Error fetching collection", { status: 500 });
  }
}

function loadDeferredData({ context }) {
  return {};
}

export default function Collection() {
  const { collection, sliderCollections, appliedFilters } = useLoaderData();
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

      <div className="flex flex-col lg:flex-row">
        {isDesktop && (
          <div className="w-[15%] pr-4">
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

          {/* Slider Collection */}
          <div className="slider-collection">
            <h2>Related Collections</h2>
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
        before: $start Cursor,
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

const MENU_QUERY = `#graphql
  query GetMenu($handle: String!) {
    menu(handle: $handle) {
      items {
        id
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

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */