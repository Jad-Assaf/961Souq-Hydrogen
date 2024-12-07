// Optimize imports
import React, { Suspense, lazy } from 'react';
import { defer } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';

// Lazy-load non-critical components
const BannerSlideshow = lazy(() => import('../components/BannerSlideshow'));
const CategorySlider = lazy(() => import('~/components/CollectionSlider'));
const TopProductSections = lazy(() => import('~/components/TopProductSections'));
const CollectionDisplay = lazy(() => import('~/components/CollectionDisplay'));
const BrandSection = lazy(() => import('~/components/BrandsSection'));

// Meta tags for SEO
export const meta = () => {
  return [{ title: 'Hydrogen | Home' }];
};

// Loader with deferred data
export async function loader(args) {
  const banners = [
    {
      imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/google-pixel-banner.jpg?v=1728123476',
      link: '/collections/google-pixel',
    },
    {
      imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Garmin.jpg?v=1726321601',
      link: '/collections/garmin',
    },
    {
      imageUrl: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/remarkable-pro-banner_25c8cc9c-14de-4556-9e8f-5388ebc1eb1d.jpg?v=1729676718',
      link: '/collections/remarkable',
    },
  ];

  const criticalData = await loadCriticalData(args);

  return defer({
    banners, // Critical
    menu: criticalData.menu, // Critical
    sliderCollections: criticalData.sliderCollections, // Deferred
    deferredData: {
      collections: criticalData.collections, // Deferred
      menuCollections: criticalData.menuCollections, // Deferred
    },
  });
}

// GraphQL optimized loader
async function loadCriticalData({ context }) {
  const menuHandle = 'new-main-menu';
  const hardcodedHandles = [/* Your product row handles */];
  const menuHandles = [/* Your slider handles */];

  const { data } = await context.storefront.query(GET_MENU_AND_COLLECTIONS_QUERY, {
    variables: {
      handle: menuHandle,
      sliderHandles: menuHandles,
      productRowHandles: hardcodedHandles,
    },
  });

  if (!data.menu) {
    throw new Response('Menu not found', { status: 404 });
  }

  return {
    menu: data.menu,
    sliderCollections: data.sliderCollections,
    collections: data.productCollections,
    menuCollections: menuHandles.map((handle) =>
      data.sliderCollections.find((collection) => collection.handle === handle)
    ),
  };
}

// Component
export default function Homepage() {
  const { banners, menu, sliderCollections, deferredData } = useLoaderData();

  return (
    <div className="home">
      <Suspense fallback={<div>Loading banners...</div>}>
        <BannerSlideshow banners={banners} />
      </Suspense>

      <Suspense fallback={<div>Loading slider...</div>}>
        <CategorySlider menu={menu} sliderCollections={sliderCollections} />
      </Suspense>

      <Suspense fallback={<div>Loading products...</div>}>
        <TopProductSections
          collection={
            deferredData?.collections?.find((c) => c.handle === 'new-arrivals')
          }
        />
      </Suspense>

      <Suspense fallback={<div>Loading collections...</div>}>
        <DeferredCollectionDisplay />
      </Suspense>

      <Suspense fallback={<div>Loading brands...</div>}>
        <DeferredBrandSection />
      </Suspense>
    </div>
  );
}

// GraphQL Query Optimization
const GET_MENU_AND_COLLECTIONS_QUERY = `#graphql
  query GetMenuAndCollections($handle: String!, $sliderHandles: [String!]!, $productRowHandles: [String!]!) {
    menu(handle: $handle) {
      items { id title url }
    }
    sliderCollections: collectionsByHandle(handles: $sliderHandles) {
      id title handle image { url altText }
    }
    productCollections: collectionsByHandle(handles: $productRowHandles) {
      id title handle image { url altText }
      products(first: 10) {
        nodes { id title handle priceRange { minVariantPrice { amount currencyCode } } }
      }
    }
  }
`;
