// routes/api/getFilteredProducts.js

import { json } from '@remix-run/node';
import { storefront } from '~/lib/storefront';

export async function loader({ request }) {
    const { filters, handle } = await request.json();

    const COLLECTION_QUERY = `#graphql
    query Collection($handle: String!, $filters: [ProductFilter!]) {
      collection(handle: $handle) {
        products(filters: $filters) {
          nodes {
            id
            title
            vendor
          }
        }
      }
    }
  `;

    const { data } = await storefront.query(COLLECTION_QUERY, {
        variables: { handle, filters },
    });

    return json({ products: data.collection.products.nodes });
}
