// app/routes/api.menu-submenu.jsx
import {json} from '@shopify/remix-oxygen';

const MENU_SUBMENU_QUERY = `#graphql
  query MenuSubmenuWithCollections($handle: String!) {
    menu(handle: $handle) {
      id
      title
      items {
        id
        title
        url
        resource {
          __typename
          ... on Collection {
            id
            handle
            title
            description
            image {
              url
              altText
            }
            products(first: 50) {
              nodes {
                id
                handle
                title
                availableForSale
                featuredImage {
                  id
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
            }
          }
        }
      }
    }
  }
`;

export async function loader({request, context}) {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');

  if (!handle) {
    return json({handle: null, collections: []});
  }

  const {storefront} = context;

  const {menu} = await storefront.query(MENU_SUBMENU_QUERY, {
    variables: {handle},
  });

  if (!menu) {
    return json({handle, collections: []});
  }

  const collections =
    menu.items
      ?.map((item) => item?.resource)
      ?.filter(
        (resource) => resource && resource.__typename === 'Collection',
      ) || [];

  return json({handle, collections});
}
