import { Suspense, useState } from 'react';
import { defer, redirect } from '@shopify/remix-oxygen';
import { Await, useLoaderData } from '@remix-run/react';
import {
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
} from '@shopify/hydrogen';
import { getVariantUrl } from '~/lib/variants';
import { ProductPrice } from '~/components/ProductPrice';
import { ProductImages } from '~/components/ProductImage';
import { ProductForm } from '~/components/ProductForm';
import "../styles/ProductPage.css"

export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.product.title ?? ''}` }];
};

export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return defer({ ...deferredData, ...criticalData });
}

async function loadCriticalData({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;

  if (!handle) {
    throw new Error('Expected product handle to be defined');
  }

  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: { handle, selectedOptions: getSelectedProductOptions(request) || [] },
  });

  if (!product?.id) {
    throw new Response('Product not found', { status: 404 });
  }

  const firstVariant = product.variants.nodes[0];
  const firstVariantIsDefault = Boolean(
    firstVariant.selectedOptions.find(
      (option) => option.name === 'Title' && option.value === 'Default Title'
    )
  );

  if (firstVariantIsDefault) {
    product.selectedVariant = firstVariant;
  } else if (!product.selectedVariant) {
    throw redirectToFirstVariant({ product, request });
  }

  return { product };
}

function loadDeferredData({ context, params }) {
  const { storefront } = context;

  const variants = storefront.query(VARIANTS_QUERY, {
    variables: { handle: params.handle },
  }).catch((error) => {
    console.error(error);
    return null;
  });

  return { variants };
}

function redirectToFirstVariant({ product, request }) {
  const url = new URL(request.url);
  const firstVariant = product.variants.nodes[0];

  return redirect(
    getVariantUrl({
      pathname: `/products/${product.handle}`,
      handle: product.handle,
      selectedOptions: firstVariant.selectedOptions,
      searchParams: new URLSearchParams(url.search),
    }),
    { status: 302 }
  );
}

export default function Product() {
  const { product, variants } = useLoaderData();
  const selectedVariant = useOptimisticVariant(
    product.selectedVariant,
    variants
  );

  const [quantity, setQuantity] = useState(1);

  // Add these handler functions
  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const { title, descriptionHtml, images } = product;

  return (
    <div className="product">
      <div className="ProductPageTop">
        <ProductImages images={images.edges} />
        <div className="product-main">
          <h1>{title}</h1>
          <ProductPrice
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />
          <div className="quantity-selector">
            <p>Quantity</p>
            <button onClick={decrementQuantity} className="quantity-btn">-</button>
            <span className="quantity-display">{quantity}</span>
            <button onClick={incrementQuantity} className="quantity-btn">+</button>
          </div>
          <br />
          <Suspense
            fallback={
              <ProductForm
                product={product}
                selectedVariant={selectedVariant}
                variants={[]}
                quantity={Number(quantity)}
              />
            }
          >
            <Await resolve={variants} errorElement="There was a problem loading product variants">
              {(data) => (
                <ProductForm
                  product={product}
                  selectedVariant={selectedVariant}
                  variants={data?.product?.variants.nodes || []}
                />
              )}
            </Await>
          </Suspense>
        </div>
      </div>
      <div className="ProductPageBottom">
        <p><strong>Description</strong></p>
        <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
        <Analytics.ProductView
          data={{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price.amount || '0',
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
      images(first: 30) {
        edges {
          node {
            __typename
            id
            url
            altText
            width
            height
          }
        }
      }
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
    description
    images(first: 30) {
      edges {
        node {
          __typename
          id
          url
          altText
          width
          height
        }
      }
    }
    options {
      name
      values
    }
    selectedVariant: variantBySelectedOptions(selectedOptions: $selectedOptions) {
      ...ProductVariant
    }
    variants(first: 1) {
      nodes {
        ...ProductVariant
      }
    }
    seo {
      description
      title
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
  }
  ${PRODUCT_FRAGMENT}
`;

const PRODUCT_VARIANTS_FRAGMENT = `#graphql
  fragment ProductVariants on Product {
    variants(first: 250) {
      nodes {
        ...ProductVariant
      }
    }
  }
  ${PRODUCT_VARIANT_FRAGMENT}
`;

const VARIANTS_QUERY = `#graphql
  ${PRODUCT_VARIANTS_FRAGMENT}
  query ProductVariants(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductVariants
    }
  }
`;


/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').SelectedOption} SelectedOption */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
