import {json} from '@shopify/remix-oxygen';
import {GET_HOME_PRODUCT_QUERY} from '~/data/queries';

export async function loader({request, context}) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');

  if (!handle) {
    return json({error: 'Missing handle'}, {status: 400});
  }

  const {product} = await context.storefront.query(GET_HOME_PRODUCT_QUERY, {
    variables: {handle},
    cache: context.storefront.CacheLong(),
  });

  if (!product) {
    return json({handle, product: null}, {status: 404});
  }

  return json(
    {handle, product},
    {
      headers: {
        'Oxygen-Cache-Control':
          'public, max-age=3600, stale-while-revalidate=86399',
      },
    },
  );
}
