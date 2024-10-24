// src/routes/index.server.jsx

import { json } from '@shopify/remix-oxygen';
import ProductRow from '../components/ProductRow';

const COLLECTION_QUERY = `
  query Collection($handle: String!) {
    collection(handle: $handle) {
      products(first: 10) {
        edges {
          node {
            id
            title
            handle
            description
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
`;

export async function loader({ context }) {
  const handles = ['featured-collection', 'new-arrivals', 'best-sellers'];

  const promises = handles.map((handle) =>
    context.storefront.query(COLLECTION_QUERY, { variables: { handle } })
  );
  const results = await Promise.all(promises);

  const productsByCollection = results.map(
    (result) => result.data.collection.products.edges.map((edge) => edge.node)
  );

  return json({ productsByCollection });
}

export default function HomePage({ data }) {
  const { productsByCollection } = data;

  return (
    <div>
      <header>
        <h1>Welcome to Our Store</h1>
      </header>
      {productsByCollection.map((products, index) => (
        <section key={index}>
          <h2>Collection {index + 1}</h2>
          <ProductRow products={products} />
        </section>
      ))}
    </div>
  );
}
