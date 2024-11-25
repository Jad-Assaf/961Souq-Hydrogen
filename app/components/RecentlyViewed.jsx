import { json } from '@remix-run/node';

// Define your GraphQL query
const RECENTLY_VIEWED_QUERY = `#graphql
  query RecentlyViewed($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        images(first: 1) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 1) {
          nodes {
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

export const loader = async ({ context }) => {
    const products = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

    if (products.length === 0) {
        return json({ products: [] });
    }

    const productIds = products.map(product => product.id);

    // Make the GraphQL request
    const response = await context.storefront.query(RECENTLY_VIEWED_QUERY, {
        variables: { ids: productIds },
    });

    return json({ products: response.nodes });
};

// Component to render the recently viewed products
const RecentlyViewedProducts = () => {
    const { products } = useLoaderData();

    return (
        <div className="recently-viewed">
            <h2>Recently Viewed Products</h2>
            {products.length === 0 ? (
                <p>No recently viewed products.</p>
            ) : (
                <ul>
                    {products.map(product => (
                        <li key={product.id}>
                            <Link to={`/products/${product.handle}`}>
                                <img src={product.images[0]?.edges[0]?.node.url} alt={product.title} />
                                <h3>{product.title}</h3>
                                <p>
                                    <Money data={product.variants.nodes[0].price} />
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RecentlyViewedProducts;