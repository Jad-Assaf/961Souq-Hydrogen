import {useLoaderData, Link} from '@remix-run/react';
import {getPaginationVariables, Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import React, {memo, useEffect, useRef, useState} from 'react';
import {truncateText} from '~/components/CollectionDisplay';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = () => {
  return [{title: `Hydrogen | Products`}];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context, request}) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 8,
  });

  const [{products}] = await Promise.all([
    storefront.query(CATALOG_QUERY, {
      variables: {...paginationVariables},
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);
  return {products};
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

export default function Collection() {
  /** @type {LoaderReturnData} */
  const {products} = useLoaderData();

  return (
    <div className="collection">
      <h1>Products</h1>
      <PaginatedResourceSection
        connection={products}
        resourcesClassName="products-grid"
      >
        {({node: product, index}) => (
          <ProductItem
            key={product.id}
            product={product}
            loading={index < 8 ? 'eager' : undefined}
          />
        )}
      </PaginatedResourceSection>
    </div>
  );
}

const ProductItem = React.memo(({product, index, numberInRow}) => {
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
                  ${product.featuredImage.url}&width=300 300w,
                  ${product.featuredImage.url}&width=300 600w,
                  ${product.featuredImage.url}&width=300 1200w
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
            <div className="price-container">
              <small
                className={`product-price ${hasDiscount ? 'discounted' : ''}`}
              >
                {selectedVariant?.price &&
                Number(selectedVariant.price.amount) === 0 ? (
                  <span>Call For Price</span>
                ) : (
                  <Money data={selectedVariant.price} />
                )}
              </small>

              {/* only show compare-at if price > 0 */}
              {Number(selectedVariant.price.amount) > 0 &&
                hasDiscount &&
                selectedVariant?.compareAtPrice && (
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
    </div>
  );
});

function ProductForm({product, selectedVariant, setSelectedVariant}) {
  const {open} = useAside();
  const hasVariants = product.variants.nodes.length > 1;
  const selectedVariantForCart = selectedVariant
    ? {
        id: selectedVariant.id,
        title: selectedVariant.title,
        image: selectedVariant.image,
        selectedOptions: selectedVariant.selectedOptions ?? [],
        product: {
          title: product?.title,
          handle: product?.handle,
        },
      }
    : null;

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
          selectedVariantForCart && !hasVariants
            ? [
                {
                  merchandiseId: selectedVariantForCart.id,
                  quantity: 1,
                  attributes: [],
                  selectedVariant: selectedVariantForCart,
                  product: {
                    ...product,
                    selectedVariant: selectedVariantForCart,
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

// NOTE: https://shopify.dev/docs/api/storefront/2024-01/objects/product
const CATALOG_QUERY = `#graphql
  query Catalog(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
      nodes {
        ...ProductItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        startCursor
        endCursor
      }
    }
  }
  ${PRODUCT_ITEM_FRAGMENT}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
