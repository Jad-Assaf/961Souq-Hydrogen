import { defer } from '@shopify/remix-oxygen';
import { useLoaderData, Await } from '@remix-run/react';
import { Suspense } from 'react';
import { CollectionDisplay } from '../components/CollectionDisplay';
import { BannerSlideshow } from '../components/BannerSlideshow';
import BrandSection from '~/components/BrandsSection';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [{ title: 'Hydrogen | Home' }];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader({ context }) {
  const menuHandle = 'new-main-menu';

  // Fetch critical data: Menu and banners
  const { menu } = await context.storefront.query(GET_MENU_QUERY, {
    variables: { handle: menuHandle },
  });

  if (!menu) {
    throw new Response('Menu not found', { status: 404 });
  }

  const banners = [
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/google-pixel-banner.jpg?v=1728123476' },
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Garmin.jpg?v=1726321601' },
    { imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/remarkable-pro-banner_25c8cc9c-14de-4556-9e8f-5388ebc1eb1d.jpg?v=1729676718' },
  ];

  // Defer non-critical data: collections and brands
  const hardcodedHandles = [
    'new-arrivals', 'laptops',
    'apple-macbook', 'apple-iphone', 'apple-accessories',
    'gaming-laptops', 'gaming-consoles', 'console-games',
    'samsung-mobile-phones', 'google-pixel-phones', 'mobile-accessories',
    'garmin-smart-watch', 'samsung-watches', 'fitness-bands',
    'earbuds', 'speakers', 'surround-systems',
    'desktops', 'pc-parts', 'business-monitors',
    'action-cameras', 'cameras', 'surveillance-cameras',
    'kitchen-appliances', 'cleaning-devices', 'lighting', 'streaming-devices', 'smart-devices', 'health-beauty',
  ];

  const collections = fetchCollectionsByHandles(context, hardcodedHandles);

  return defer({
    menu,
    banners,
    collections, // Deferred promise
    brands: brandsData,
  });
}

async function fetchCollectionsByHandles(context, handles) {
  const collections = [];
  for (const handle of handles) {
    const { collectionByHandle } = await context.storefront.query(
      GET_COLLECTION_BY_HANDLE_QUERY,
      { variables: { handle } }
    );
    if (collectionByHandle) {
      collections.push(collectionByHandle);
    }
  }
  return collections; // Return valid collections
}

const brandsData = [
  { name: "Apple", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple.png?v=1648112715", link: "/collections/apple" },
  { name: "HP", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/hp.png?v=1648112715", link: "/collections/hp-products" },
  { name: "MSI", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/msi-logo.jpg?v=1712761894", link: "/collections/msi-products" },
  { name: "Marshall", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/marshall-logo.jpg?v=1683620097", link: "/collections/marshall-collection" },
  { name: "JBL", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-logo_08932e54-a973-4e07-b192-b8ea378744a4.jpg?v=1683619917", link: "/collections/jbl-collection" },
  { name: "Dell", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dell.png?v=1648112715", link: "/collections/dell-products" },
  { name: "Garmin", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-logo.jpg?v=1712761787", link: "/collections/garmin-smart-watch" },
  { name: "Asus", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/asus-logo.jpg?v=1712761801", link: "/collections/asus-products" },
  { name: "Samsung", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-Logo.jpg?v=1712761812", link: "/collections/samsung-products" },
  { name: "Sony", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/sony-logo.jpg?v=1712761825", link: "/collections/sony" },
  { name: "Benq", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/benq-logo.jpg?v=1712762620", link: "/collections/benq-products" },
  { name: "Tp-link", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/tp-link-logo.jpg?v=1712761852", link: "/collections/tp-link-products" },
  { name: "Nothing", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nothing-logo.jpg?v=1712761865", link: "/collections/nothing-products" },
  { name: "Xiaomi", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/xiaomi-logo.jpg?v=1712761880", link: "/collections/xiaomi-products" },
  { name: "Microsoft", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/microsoft-logo.jpg?v=1712762506", link: "/collections/microsoft-products" },
  { name: "Nintendo", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nintendo-logo.jpg?v=1712762532", link: "/collections/nintendo-products" },
  { name: "Lenovo", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenovo-logo.jpg?v=1712762549", link: "/collections/lenovo-products" },
  { name: "LG", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lg-logo.jpg?v=1712762606", link: "/collections/lg-products" },
  { name: "Meta", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/meta-logo.jpg?v=1712762516", link: "/collections/meta-products" },
  { name: "Ubiquiti", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ubuquiti-logo.jpg?v=1712761841", link: "/collections/ubiquiti-products" },
  { name: "Philips", image: "https://cdn.shopify.com/s/files/1/0552/0883/7292/files/philips-logo.jpg?v=1712762630", link: "/collections/philips-products" },
];

export default function Homepage() {
  const { menu, banners, collections, brands } = useLoaderData();

  const images = [
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-products_29a11658-9601-44a9-b13a-9a52c10013be.jpg?v=1728311525',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/APPLE-IPHONE-16-wh.jpg?v=1728307748',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps5-banner.jpg?v=1728289818',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ps-studios.jpg?v=1728486402',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/cmf-phone-1-banner-1.jpg?v=1727944715',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-s24.jpg?v=1732281967',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-watch-ultra.jpg?v=1732281967',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-banner.jpg?v=1727943839',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-eaubuds.jpg?v=1732284726',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-desktops.jpg?v=1732287092',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-monitors_6069e5a5-45c8-4ff2-8543-67de7c8ee0f4.jpg?v=1732287093',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenses.jpg?v=1732289718',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/action.jpg?v=1732289718',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/govee-rgb.jpg?v=1732288379',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dyson-vacuums.jpg?v=1732288379',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/streaming.jpg?v=1732289074',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/smart-home.jpg?v=1732289074',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-speakers.jpg?v=1711034859',
  ];

  return (
    <div className="home">
      <BannerSlideshow banners={banners} />
      <Suspense fallback={<div>Loading collections...</div>}>
        <Await resolve={collections}>
          {(resolvedCollections) => (
            <CollectionDisplay
              collections={resolvedCollections} // Pass resolved collections directly
              sliderCollections={[]} // Pass sliderCollections if needed
              images={images}
            />
          )}
        </Await>
      </Suspense>
      <Suspense fallback={<div>Loading brands...</div>}>
        <BrandSection brands={brands} />
      </Suspense>
    </div>
  );
}

const GET_COLLECTION_BY_HANDLE_QUERY = `#graphql
  query GetCollectionByHandle($handle: String!) {
  collectionByHandle(handle: $handle) {
    id
    title
    handle
      image {
      url
      altText
    }
    products(first: 15) {
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
          compareAtPriceRange {
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
        variants(first: 5) {
            nodes {
            id
            availableForSale
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
      }
    }
  }
}
`;

export const GET_MENU_QUERY = `#graphql
  query GetMenu($handle: String!) {
  menu(handle: $handle) {
      items {
      id
      title
      url
        items {
        id
        title
        url
          items {
          id
          title
          url
        }
      }
    }
  }
}
`;

