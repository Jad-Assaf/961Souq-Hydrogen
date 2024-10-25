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
  return [{ title: `Hydrogen | ${data?.title ?? 'Product'}` }];
};

/**
 * Loader function to fetch product with all images
 */
export async function loader({ context, params }) {
  const { storefront } = context;
  const { handle } = params;

  if (!handle) {
    throw new Error('Product handle is required.');
  }

  try {
    const data = await storefront.query(PRODUCT_WITH_ALL_IMAGES_QUERY, {
      variables: { handle },
    });

    console.log('Fetched product data:', data);

    if (!data.product) {
      throw new Response('Product not found', { status: 404 });
    }

    return data.product;
  } catch (error) {
    console.error('Failed to load product:', error);
    throw new Response('Internal Server Error', { status: 500 });
  }
}


export default function ProductPage() {
  const product = useLoaderData();

  if (!product) {
    return <p>Product not found.</p>; // Graceful fallback
  }

  const { title, descriptionHtml, images, variants } = product;

  return (
    <div className="product-page">
      <h1>{title}</h1>

      <div className="product-images">
        {images.edges.length > 0 ? (
          images.edges.map(({ node: image }) => (
            <Image
              key={image.id}
              data={image}
              alt={image.altText || 'Product Image'}
              aspectRatio="1/1"
            />
          ))
        ) : (
          <p>No images available.</p>
        )}
      </div>

      <Suspense fallback={<p>Loading product details...</p>}>
        <Await resolve={variants}>
          {(data) =>
            data.nodes.length > 0 ? (
              data.nodes.map((variant) => (
                <div key={variant.id} className="variant-info">
                  <h2>{variant.title}</h2>
                  <ProductPrice
                    price={variant.price}
                    compareAtPrice={variant.compareAtPrice}
                  />
                  <Image
                    data={variant.image}
                    alt={variant.image?.altText || 'Variant Image'}
                    aspectRatio="1/1"
                  />
                </div>
              ))
            ) : (
              <p>No variants available.</p>
            )
          }
        </Await>
      </Suspense>

      <div className="product-description">
        <strong>Description</strong>
        <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
      </div>

      <ProductForm product={product} />
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title,
              price: variants.nodes[0]?.price.amount || '0',
              vendor: product.vendor,
              variantId: variants.nodes[0]?.id || '',
              variantTitle: variants.nodes[0]?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
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
