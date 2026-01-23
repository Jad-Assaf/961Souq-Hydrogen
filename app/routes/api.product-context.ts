import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';

const WARRANTY_POLICY = `Operational Warranty Terms and Conditions

Warranty Coverage:
This warranty applies to All Products, purchased from 961 Souq. The warranty covers defects in materials and workmanship under normal use for the period specified at the time of purchase.
`;

const SHIPPING_POLICY = `Shipping Policy:
We offer shipping across all Lebanon, facilitated by our dedicated delivery team servicing the Beirut district and through our partnership with Wakilni for orders beyond Beirut.
`;

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('productId');

  if (!productId) {
    return new Response(JSON.stringify({error: 'Missing productId'}), {
      status: 400,
      headers: {'Content-Type': 'application/json'},
    });
  }

  const PRODUCT_QUERY = `#graphql
    query ProductForContext($id: ID!) {
      product(id: $id) {
        id
        handle
        title
        vendor
        description
        descriptionHtml
        productType
        priceRange {
          minVariantPrice { amount currencyCode }
          maxVariantPrice { amount currencyCode }
        }
      }
    }
  `;

  try {
    const {product} = await context.storefront.query(PRODUCT_QUERY, {
      variables: {id: productId},
    });

    if (!product) {
      return new Response(JSON.stringify({error: 'Product not found'}), {
        status: 404,
        headers: {'Content-Type': 'application/json'},
      });
    }

    const description = (
      product?.descriptionHtml ||
      product?.description ||
      ''
    ).replace(/<[^>]*>/g, ' ');
    const trimmedDescription =
      description.length > 8000 ? description.slice(0, 8000) : description;

    const minPrice = product?.priceRange?.minVariantPrice?.amount;
    const maxPrice = product?.priceRange?.maxVariantPrice?.amount;
    const currency = product?.priceRange?.minVariantPrice?.currencyCode || '';
    const price =
      minPrice && maxPrice
        ? minPrice === maxPrice
          ? `${minPrice} ${currency}`
          : `${minPrice} - ${maxPrice} ${currency}`
        : null;

    return new Response(
      JSON.stringify({
        productId,
        handle: product?.handle || '',
        title: product?.title || '',
        vendor: product?.vendor || '',
        type: product?.productType || '',
        description: trimmedDescription,
        price,
        warranty: WARRANTY_POLICY,
        shipping: SHIPPING_POLICY,
      }),
      {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      },
    );
  } catch (err) {
    console.error('Context fetch failed', err);
    return new Response(
      JSON.stringify({error: 'Failed to load product context'}),
      {
        status: 500,
        headers: {'Content-Type': 'application/json'},
      },
    );
  }
}
