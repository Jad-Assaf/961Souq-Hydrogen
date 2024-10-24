// ~/routes/index.jsx
import { defer } from '@shopify/remix-oxygen';
import { Await, useLoaderData } from '@remix-run/react';
import { Suspense, useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ProductRow } from '~/components/ProductRow';
import CategorySlider from '~/components/CategorySlider';

import banner1 from "../assets/remarkable-pro-banner_25c8cc9c-14de-4556-9e8f-5388ebc1eb1d.webp";
import banner2 from "../assets/samsung-flip-fold-6.webp";
import banner3 from "../assets/Garmin.webp";

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{ title: 'Hydrogen | Home' }];
};

export async function loader({ context }) {
  let menu;

  try {
    menu = await loadMenu(context, 'menu'); // Attempt to load the menu
  } catch (error) {
    console.warn('Failed to load menu. Using fallback menu:', error);
    menu = FALLBACK_HEADER_MENU.items; // Use the fallback menu if loading fails
  }

  const menProducts = await loadCollectionProducts(context, 'men');
  const womenProducts = await loadCollectionProducts(context, 'women');
  const unisexProducts = await loadCollectionProducts(context, 'unisex');

  return defer({ menu, men: menProducts, women: womenProducts, unisex: unisexProducts });
}

async function loadMenu(context, handle) {
  const { menu } = await context.storefront.query(MENU_QUERY, { variables: { handle } });

  if (!menu) {
    throw new Response('Menu not found', { status: 404 });
  }

  console.log('Fetched menu:', menu.items); // Debugging to ensure menu data is fetched correctly
  return menu.items;
}

async function loadCollectionProducts(context, handle) {
  const { collection } = await context.storefront.query(COLLECTION_PRODUCTS_QUERY, {
    variables: { handle },
  });

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, { status: 404 });
  }

  return collection.products.nodes;
}

export default function Homepage() {
  const { menu, men, women, unisex } = useLoaderData();

  return (
    <div className="home">
      <BannerSlideshow banners={[banner1, banner2, banner3]} interval={3000} />

      <Suspense fallback={<div>Loading Categories...</div>}>
        <Await resolve={menu}>
          {(menu) => <CategorySlider menu={menu} />}
        </Await>
      </Suspense>

      <SwipeableProductSection title="Men's Collection" products={men} />
      <SwipeableProductSection title="Women's Collection" products={women} />
      <SwipeableProductSection title="Unisex Collection" products={unisex} />
    </div>
  );
}

function BannerSlideshow({ banners, interval }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setCurrentIndex((prev) => (prev + 1) % banners.length),
    onSwipedRight: () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length),
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentIndex((prev) => (prev + 1) % banners.length), interval);
    return () => clearInterval(timer);
  }, [interval]);

  return (
    <div {...swipeHandlers} className="banner-slideshow">
      {banners.map((banner, index) => (
        <img
          key={index}
          src={banner}
          alt={`Banner ${index + 1}`}
          className={`banner ${index === currentIndex ? 'active' : ''}`}
        />
      ))}
    </div>
  );
}

function SwipeableProductSection({ title, products }) {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => scroll('next'),
    onSwipedRight: () => scroll('prev'),
  });

  const scroll = (direction) => {
    const container = document.getElementById(`${title}-wrapper`);
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({ left: direction === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="product-row-container">
      <h2>{title}</h2>
      <div {...swipeHandlers} id={`${title}-wrapper`} className="product-row-wrapper">
        {products.map((product) => (
          <div key={product.id} className="product-item">
            <ProductRow product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * GraphQL Query to Fetch Menu
 */
const MENU_QUERY = `#graphql
  query Menu($handle: String!) {
    menu(handle: $handle) {
      items {
        id
        title
        url
        type
      }
    }
  }
`;

/**
 * GraphQL Query to Fetch Products by Collection Handle
 */
const COLLECTION_PRODUCTS_QUERY = `#graphql
  query CollectionProducts($handle: String!) {
    collection(handle: $handle) {
      products(first: 10) {
        nodes {
          id
          title
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            nodes {
              url
              altText
            }
          }
          options {
            name
            values
          }
          variants(first: 10) {
            nodes {
              id
              availableForSale
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Fallback Menu Configuration
 */
const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    { id: '1', title: 'Collections', type: 'HTTP', url: '/collections', items: [] },
    { id: '2', title: 'Blog', type: 'HTTP', url: '/blogs/journal', items: [] },
    { id: '3', title: 'Policies', type: 'HTTP', url: '/policies', items: [] },
    { id: '4', title: 'About', type: 'PAGE', url: '/pages/about', items: [] },
  ],
};
