import { json } from '@shopify/remix-oxygen';
import { useLoaderData, Link } from '@remix-run/react';
import { getPaginationVariables, Money } from '@shopify/hydrogen';
import { useVariantUrl } from '~/lib/variants';

export const meta = ({ data }) => {
  return [{ title: `Hydrogen | ${data?.collection.title ?? ''} Collection` }];
};

export async function loader({ context, params, request }) {
  const { handle } = params;
  const { storefront } = context;
  const paginationVariables = getPaginationVariables(request, { pageBy: 24 });

  if (!handle) {
    throw new Response('No handle provided', { status: 404 });
  }

  const { collection } = await storefront.query(COLLECTION_QUERY, {
    variables: {
      handle,
      ...paginationVariables,
    },
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, { status: 404 });
  }

  return json({ collection });
}

export default function Collection() {
  const { collection } = useLoaderData();

  return (
    <div className="collection">
      <h1>{collection.title}</h1>
      <div className="products-grid">
        {collection.products.nodes.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function ProductItem({ product }) {
  const variant = product.variants.nodes[0];
  const variantUrl = useVariantUrl(product.handle, variant.selectedOptions);

  return (
    <Link className="product-item" to={variantUrl}>
      {product.featuredImage && (
        <img
          src={product.featuredImage.url}
          alt={product.featuredImage.altText || product.title}
          className="product-image"
        />
      )}
      <h3>{product.title}</h3>
      <Money data={product.priceRange.minVariantPrice} />
    </Link>
  );
}

const COLLECTION_QUERY = `#graphql
  query CollectionDetails($handle: String!, $first: Int, $last: Int, $startCursor: String, $endCursor: String) {
    collection(handle: $handle) {
      id
      title
      description
      handle
      products(first: $first, last: $last, before: $startCursor, after: $endCursor) {
        nodes {
          id
          title
          publishedAt
          handle
          variants(first: 1) {
            nodes {
              id
              image {
                url
                altText
                width
                height
              }
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
          featuredImage {
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
`;