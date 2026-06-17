import {json} from '@shopify/remix-oxygen';

const PRODUCT_SUMMARY_QUERY = `#graphql
  query ProductSummaryForMcp($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      productType
      description
      availableForSale
      featuredImage {
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 20) {
        nodes {
          id
          title
          availableForSale
          quantityAvailable
          sku
          price {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

/**
 * Read-only product details endpoint for WebMCP tools.
 * @param {import('@shopify/remix-oxygen').LoaderFunctionArgs} args
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const handle = (url.searchParams.get('handle') || '').trim();

  if (!isValidHandle(handle)) {
    return json({error: 'Invalid or missing handle'}, {status: 400});
  }

  const {product} = await context.storefront.query(PRODUCT_SUMMARY_QUERY, {
    variables: {handle},
    cache: context.storefront.CacheShort(),
  });

  if (!product) {
    return json({error: 'Product not found'}, {status: 404});
  }

  const baseUrl = url.origin.replace(/\/\/www\./, '//');
  const minPrice = product.priceRange?.minVariantPrice;
  const maxPrice = product.priceRange?.maxVariantPrice;

  return json({
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    description: product.description || '',
    availableForSale: product.availableForSale,
    url: `${baseUrl}/products/${encodeURIComponent(product.handle)}`,
    featuredImage: product.featuredImage
      ? {
          url: product.featuredImage.url,
          altText: product.featuredImage.altText || product.title,
        }
      : null,
    priceRange: {
      min: minPrice
        ? {
            amount: minPrice.amount,
            currencyCode: minPrice.currencyCode,
          }
        : null,
      max: maxPrice
        ? {
            amount: maxPrice.amount,
            currencyCode: maxPrice.currencyCode,
          }
        : null,
    },
    variants: (product.variants?.nodes || []).map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      availableForSale: variant.availableForSale,
      quantityAvailable: variant.quantityAvailable,
      price: variant.price
        ? {
            amount: variant.price.amount,
            currencyCode: variant.price.currencyCode,
          }
        : null,
      selectedOptions: variant.selectedOptions || [],
    })),
  });
}

function isValidHandle(handle) {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/.test(handle);
}
