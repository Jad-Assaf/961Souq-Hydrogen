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

  // Fetch menu items for the slider
  const { menu } = await storefront.query(MENU_QUERY, {
    variables: { handle: 'new-main-menu' }, // Replace with your actual menu handle
  });

  // Fetch collections for the slider
  const sliderCollections = await Promise.all(
    menu.items.map(async (item) => {
      const { collection } = await storefront.query(COLLECTION_BY_HANDLE_QUERY, {
        variables: { handle: item.title.toLowerCase().replace(/\s+/g, '-') },
      });
      return collection;
    })
  );

  return json({ collection, sliderCollections });
}

export default function Collection() {
  const { collection, sliderCollections } = useLoaderData();

  return (
    <div className="collection">
      <div className="slide-con">
        <h3 className="cat-h3">{collection.title}</h3>
        <div className="category-slider">
          {sliderCollections.map((sliderCollection) => (
            sliderCollection && (
              <Link
                key={sliderCollection.id}
                to={`/collections/${sliderCollection.handle}`}
                className="category-container"
              >
                {sliderCollection.image && (
                  <img
                    src={sliderCollection.image.url}
                    alt={sliderCollection.image.altText || sliderCollection.title}
                    className="category-image"
                    width={150}
                    height={150}
                  />
                )}
                <div className="category-title">{sliderCollection.title}</div>
              </Link>
            )
          ))}
        </div>
      </div>

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

const MENU_QUERY = `#graphql
  query GetMenu($handle: String!) {
    menu(handle: $handle) {
      items {
        id
        title
        url
      }
    }
  }
`;

const COLLECTION_BY_HANDLE_QUERY = `#graphql
  query GetCollectionByHandle($handle: String!) {
    collection(handle: $handle) {
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