export async function loader({ context, request }) {
    const url = new URL(request.url);
    const handle = url.searchParams.get('handle');

    if (!handle) {
        throw new Response('Missing collection handle', { status: 400 });
    }

    const GET_SUB_COLLECTIONS_QUERY = `#graphql
    query GetSubCollections($handle: String!) {
      collectionByHandle(handle: $handle) {
        id
        title
        handle
        image {
          url
          altText
        }
      }
    }
  `;

    const { collectionByHandle } = await context.storefront.query(
        GET_SUB_COLLECTIONS_QUERY,
        { variables: { handle } }
    );

    if (!collectionByHandle) {
        throw new Response('Collection not found', { status: 404 });
    }

    return new Response(JSON.stringify(collectionByHandle), {
        headers: { 'Content-Type': 'application/json' },
    });
}
