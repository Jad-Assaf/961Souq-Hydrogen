import { Suspense } from 'react';
import { defer, redirect } from '@shopify/remix-oxygen';
import { Await, useLoaderData } from '@remix-run/react';
import { Image } from '@shopify/hydrogen';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
} from '@shopify/hydrogen';
import { getVariantUrl } from '~/lib/variants';
import { ProductPrice } from '~/components/ProductPrice';
import { ProductImage } from '~/components/ProductImage';
import { ProductForm } from '~/components/ProductForm';

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.product.title ?? ''}` }];
};

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{ product }] = await Promise.all([
    storefront.query(PRODUCT_QUERY, {
      variables: { handle, selectedOptions: getSelectedProductOptions(request) },
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  if (!product?.id) {
    throw new Response(null, { status: 404 });
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option) => option.name === 'Title' && option.value === 'Default Title',
    ),
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else {
    if (!product.selectedVariant) {
      throw redirectToFirstVariant({ product, request });
    }
  }

  return { product };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({ context, params }) {
  const variants = context.storefront
    .query(VARIANTS_QUERY, { variables: { handle: params.handle } })
    .catch((error) => {
      console.error(error);
      return null;
    });

  return { variants };
}

/**
 * @param {{
 *   product: ProductFragment;
 *   request: Request;
 * }}
 */
function redirectToFirstVariant({ product, request }) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: url.pathname,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    { status: 302 },
  );
}

export default function ProductPage() {
  const product = useLoaderData();

  return (
    <div className="product-page">
      <h1>{product.title}</h1>
      <div className="product-images">
        {product.images.edges.map(({ node: image }) => (
          <Image
            key={image.id}
            data={image}
            alt={image.altText || 'Product Image'}
            aspectRatio="1/1"
          />
        ))}
      </div>

      <Suspense fallback={<p>Loading product details...</p>}>
        <Await resolve={product.variants}>
          {(data) =>
            data.nodes.map((variant) => (
              <div key={variant.id} className="variant-info">
                <h2>{variant.title}</h2>
                <ProductPrice
                  price={variant.price}
                  compareAtPrice={variant.compareAtPrice}
                />
                <Image
                  data={variant.image}
                  alt={variant.image.altText || 'Variant Image'}
                  aspectRatio="1/1"
                />
              </div>
            ))
          }
        </Await>
      </Suspense>

      <div className="product-description">
        <strong>Description</strong>
        <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
      </div>

      <ProductForm product={product} />
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: product.variants.nodes[0]?.price.amount || '0',
              vendor: product.vendor,
              variantId: product.variants.nodes[0]?.id || '',
              variantTitle: product.variants.nodes[0]?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

/**
 * Loader function to fetch product with all images
 */
export async function loader({ context, params }) {
  const { storefront } = context;
  const { handle } = params;

  try {
    const data = await storefront.query(PRODUCT_WITH_ALL_IMAGES_QUERY, { variables: { handle } });

    if (!data.product) {
      throw new Response('Product not found', { status: 404 });
    }

    return data.product;
  } catch (error) {
    console.error('Failed to load product:', error);
    throw new Response('Internal Server Error', { status: 500 });
  }
}

const PRODUCT_WITH_ALL_IMAGES_QUERY = `#graphql
  query ProductWithAllImages($handle: String!) {
    product(handle: $handle) {
      id
      title
      descriptionHtml
      images(first: 20) {
        edges {
          node {
            id
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 1) {
        nodes {
          id
          title
          price {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      amount
      currencyCode
    }
    id
    image {
      __typename
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
    product {
      title
      handle
    }
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
    title
    vendor
    handle
    descriptionHtml
    options {
      name
      values
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product($handle: String!) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const VARIANTS_QUERY = `#graphql
  query ProductVariants($handle: String!) {
    product(handle: $handle) {
      variants(first: 250) {
        nodes {
          ...ProductVariant
        }
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').SelectedOption} SelectedOption */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
