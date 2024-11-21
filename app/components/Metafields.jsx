import React, { useEffect, useState } from "react";

export function ProductMetafields({ handle, storefront }) {
    const [metafields, setMetafields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchMetafields() {
            try {
                const { productByHandle } = await storefront.query(GET_METAFIELDS, {
                    variables: { handle },
                });

                if (productByHandle && productByHandle.metafields) {
                    setMetafields(productByHandle.metafields.edges.map((edge) => edge.node));
                }
            } catch (err) {
                console.error("Error fetching metafields:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchMetafields();
    }, [handle, storefront]);

    if (loading) return <p>Loading additional information...</p>;
    if (error) return <p>Error fetching metafields: {error.message}</p>;

    return (
        <div className="product-metafields">
            <h3>Additional Information</h3>
            {metafields.length > 0 ? (
                <ul>
                    {metafields.map((metafield) => (
                        <li key={metafield.key}>
                            <strong>{metafield.key}:</strong> {metafield.value}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No additional information available.</p>
            )}
        </div>
    );
}

const GET_METAFIELDS = `#graphql
  query ProductMetafields($handle: String!) {
    productByHandle(handle: $handle) {
      metafields(first: 20, namespace: "custom") {
        edges {
          node {
            namespace
            key
            value
          }
        }
      }
    }
  }
`;