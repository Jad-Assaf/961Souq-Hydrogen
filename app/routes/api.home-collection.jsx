import {json} from '@shopify/remix-oxygen';
import {GET_HOMEPAGE_COLLECTION_QUERY} from '~/data/queries';

export async function loader({request, context}) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');

  if (!handle) {
    return json({error: 'Missing handle'}, {status: 400});
  }

  try {
    const {collectionByHandle} = await context.storefront.query(
      GET_HOMEPAGE_COLLECTION_QUERY,
      {
        variables: {handle},
        cache: context.storefront.CacheLong(),
      },
    );

    if (!collectionByHandle || !collectionByHandle?.products?.nodes?.length) {
      return json(
        {handle, collection: null},
        {
          headers: {
            'Oxygen-Cache-Control':
              'public, max-age=3600, stale-while-revalidate=86399',
          },
        },
      );
    }

    return json(
      {handle, collection: collectionByHandle},
      {
        headers: {
          'Oxygen-Cache-Control':
            'public, max-age=3600, stale-while-revalidate=86399',
        },
      },
    );
  } catch (error) {
    const status = Number(error?.response?.status || error?.status || 500);
    const message =
      error?.message || `Failed to load homepage collection for ${handle}`;

    console.error(`[api.home-collection] ${handle} failed: ${message}`);
    return json({handle, collection: null, error: message}, {status});
  }
}
