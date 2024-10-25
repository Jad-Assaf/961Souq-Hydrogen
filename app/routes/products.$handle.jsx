import { Suspense } from 'react';
import { defer, redirect } from '@shopify/remix-oxygen';
import { Await, useLoaderData } from '@remix-run/react';
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
 * Loader function to fetch product data and variants.
 */
export async function loader(args) {
  const criticalData = await loadCriticalData(args);
  const deferredData = loadDeferredData(args);
  return defer({ ...criticalData, ...deferredData });
}

/**
 * Fetch product data including all images and variants.
 */
async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  try {
    const { product } = await storefront.query(PRODUCT_QUERY, {
      variables: { handle, selectedOptions: getSelectedProductOptions(request) },
    });

    if (!product?.id) {
      throw new Response('Product not found', { status: 404 });
    }

    const firstVariant = product.variants.nodes[0];
    const firstVariantIsDefault = firstVariant.selectedOptions.some(
      (option) => option.name === 'Title' && option.value === 'Default Title'
    );

    product.selectedVariant = firstVariantIsDefault
      ? firstVariant
      : product.selectedVariant || firstVariant;

    return { product };
  } catch (error) {
    console.error('Error loading product data:', error);
    throw new Response('Error loading product data', { status: 500 });
  }
}


function loadDeferredData({ context, params }) {
  return {
    variants: context.storefront
      .query(VARIANTS_QUERY, { variables: { handle: params.handle } })
      .catch((error) => {
        console.error('Error fetching variants:', error);
        return { product: { variants: { nodes: [] } } }; // Fallback
      }),
  };
}


/**
 * Redirect to first variant if no selected variant is found.
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
    { status: 302 }
  );
}

/**
 * Product component rendering product details with images and variants.
 */
export default function Product() {
  const { product, variants } = useLoaderData();
  const selectedVariant = useOptimisticVariant(
    product?.selectedVariant,
    variants
  );

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="product">
      <ProductImage images={product.images?.nodes || []} />
      <div className="product-main">
        <h1>{product.title}</h1>
        <ProductPrice
          price={selectedVariant?.price}
          compareAtPrice={selectedVariant?.compareAtPrice}
        />
        <Suspense
          fallback={<ProductForm product={product} selectedVariant={selectedVariant} variants={[]} />}
        >
          <Await resolve={variants}>
            {(data) => (
              <ProductForm
                product={product}
                selectedVariant={selectedVariant}
                variants={data?.product?.variants?.nodes || []}
              />
            )}
          </Await>
        </Suspense>
        <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price?.amount || '0',
                vendor: product.vendor,
                variantId: selectedVariant?.id || '',
                variantTitle: selectedVariant?.title || '',
                quantity: 1,
              },
            ],
          }}
        />
      </div>
    </div>
  );
}


/**
 * GraphQL Query to fetch product data with images and variants.
 */
const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      vendor
      handle
      descriptionHtml
      images(first: 10) {
        nodes {
          id
          url
          altText
          width
          height
        }
      }
      variants(first: 1) {
        nodes {
          ...ProductVariant
        }
      }
      selectedVariant: variantBySelectedOptions(
        selectedOptions: $selectedOptions
      ) {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    title
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    image {
      id
      url
      altText
      width
      height
    }
    selectedOptions {
      name
      value
    }
  }
`;

const VARIANTS_QUERY = `#graphql
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
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
