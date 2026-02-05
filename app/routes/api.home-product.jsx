import {json} from '@shopify/remix-oxygen';
import {
  GET_HOME_PRODUCT_MOBILE_QUERY,
  GET_HOME_PRODUCT_QUERY,
} from '~/data/queries';

export async function loader({request, context}) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');
  const forceFull = url.searchParams.get('full') === '1';

  if (!handle) {
    return json({error: 'Missing handle'}, {status: 400});
  }

  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /mobile/i.test(userAgent);
  const shouldUseMobileQuery = isMobile && !forceFull;
  const query = shouldUseMobileQuery
    ? GET_HOME_PRODUCT_MOBILE_QUERY
    : GET_HOME_PRODUCT_QUERY;

  const {product} = await context.storefront.query(query, {
    variables: {handle},
    cache: context.storefront.CacheLong(),
  });

  if (!product) {
    return json({handle, product: null}, {status: 404});
  }

  return json(
    {handle, product, isFull: !shouldUseMobileQuery},
    {
      headers: {
        'Oxygen-Cache-Control':
          'public, max-age=3600, stale-while-revalidate=86399',
      },
    },
  );
}
