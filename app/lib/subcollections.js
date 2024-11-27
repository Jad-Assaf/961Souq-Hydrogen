export async function loader({ context, request }) {
    const url = new URL(request.url);
    const handle = url.searchParams.get('handle');

    if (!handle) {
        throw new Response('Missing collection handle', { status: 400 });
    }

    const GET_COLLECTIONS_QUERY = `#graphql
    query GetCollections($handles: [String!]) {
      collections(first: 10, query: $handles) {
        edges {
          node {
            id
            title
            handle
            image {
              src
              altText
            }
          }
        }
      }
    }
  `;

    const { collections } = await context.storefront.query(
        GET_COLLECTIONS_QUERY,
        { variables: { handles: [handle] } }
    );

    if (!collections || collections.edges.length === 0) {
        throw new Response('No sub-collections found', { status: 404 });
    }

    return new Response(
        JSON.stringify(
            collections.edges.map((edge) => ({
                id: edge.node.id,
                title: edge.node.title,
                handle: edge.node.handle,
                image: edge.node.image,
            }))
        ),
        { headers: { 'Content-Type': 'application/json' } }
    );
}
