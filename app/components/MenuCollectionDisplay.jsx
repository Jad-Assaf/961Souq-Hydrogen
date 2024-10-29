// components/MenuCollectionDisplay.jsx
import { useLoaderData } from '@remix-run/react';
import { defer } from '@shopify/remix-oxygen';
import '../styles/MenuCollectionDisplay.css'

/**
 * Fetch menu collections inside the component’s loader.
 * @param {LoaderFunctionArgs} args
 */
export async function loader({ context }) {
    const menuHandle = 'new-main-menu';

    const { menu } = await context.storefront.query(GET_MENU_QUERY, {
        variables: { handle: menuHandle },
    });

    if (!menu) {
        throw new Response('Menu not found', { status: 404 });
    }

    return defer({ menu });
}

/**
 * Component to display collections from the 'new-main-menu' menu.
 */
export function MenuCollectionDisplay() {
    const { menu } = useLoaderData();

    if (!menu.items || menu.items.length === 0) return <p>No collections available.</p>;

    return (
        <div className="slide-con">
            <h3 className="cat-h3">Menu Collections</h3>
            <div className="category-slider">
                {menu.items.map((item) => (
                    <div key={item.id} className="category-container">
                        <img
                            src={item.image?.url || 'https://via.placeholder.com/150'}
                            alt={item.title}
                            className="category-image"
                        />
                        <span className="category-title">{item.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * GraphQL query to fetch the 'new-main-menu'.
 */
const GET_MENU_QUERY = `#graphql
  query GetMenu($handle: String!) {
    menu(handle: $handle) {
      items {
        id
        title
        url
        image {
          url
          altText
        }
      }
    }
  }
`;
