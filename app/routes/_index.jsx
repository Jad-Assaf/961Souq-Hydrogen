import React, {useState, useEffect, Suspense} from 'react';
import {data, useLoaderData, useMatches} from '@remix-run/react';
import {BannerSlideshow} from '../components/BannerSlideshow';
// import {CategorySlider} from '~/components/CollectionSlider';
import {TopProductSections} from '~/components/TopProductSections';
import BrandSection from '~/components/BrandsSection';
import {getSeoMeta} from '@shopify/hydrogen';
import {
  CollectionCircles,
  appleMenu,
  audioMenu,
  camerasMenu,
  fitnessMenu,
  gamingMenu,
  homeAppliancesMenu,
  laptopsMenu,
  mobilesMenu,
  monitorsMenu,
  tabletsMenu,
} from '~/components/CollectionCircles';
// import MobileAppPopup from '~/components/MobileAppPopup';
// import ScrollingSVGs from '~/components/ScrollingSVGs';
import {
  GET_COLLECTION_BY_HANDLE_QUERY,
  GET_SIMPLE_COLLECTION_QUERY,
} from '../data/queries.ts';
import {CategorySliderWithMoreHeight} from '~/components/CollectionSliderWithMoreHeight';
import VideosGallery from '~/components/VideosGallery';
import {CategorySliderFromMenu} from '~/components/CategorySliderFromMenu';
import {CategorySliderFromMenuMobile} from '~/components/CategorySliderFromMenuMobile';
import MobileCategoryTiles from '~/components/MobileCategoryTiles';
// import InstagramReelsCarousel from '~/components/InstagramCarousel';

// const MANUAL_MENU_HANDLES = [
//   'apple',
//   'gaming',
//   'laptops',
//   'desktops',
//   'pc-parts',
//   'networking',
//   'monitors',
//   'mobiles',
//   'tablets',
//   'audio',
//   'pioneer-equipment',
//   'accessories',
//   'fitness',
//   'photography',
//   'home-appliances',
// ];

/**
 * Custom hook to detect mobile viewport (below 1024px)
 */
/**
 * @type {MetaFunction}
 */
export const meta = ({data, matches}) => {
  const truncate = (text, maxLength) =>
    text?.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;

  // Merge in any defaults from your root route’s SEO config
  const parentSeo = matches[0]?.data?.seo;

  // Your OG image URL
  const ogImageUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/961souqLogo-1_2.png?v=1709718912';

  return getSeoMeta(parentSeo, {
    title: '961Souq | Leading Electronics, PC and Gaming Gear Store in Lebanon',
    description: truncate(
      data?.description ||
        "Discover Lebanon's top destination for quality electronics and unbeatable deals at 961Souq. Shop the latest gadgets, devices, and accessories today!",
      150,
    ),
    url: data?.url || 'https://961souq.com',
    type: 'website',
    media: [
      {
        url: ogImageUrl,
        type: 'image',
        altText: '961Souq Logo',
        width: 1200,
        height: 630,
      },
    ],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name:
          data?.title ||
          '961Souq | Leading Electronics, PC and Gaming Gear Store in Lebanon',
        description: truncate(
          data?.description ||
            "Discover Lebanon's top destination for quality electronics and unbeatable deals at 961Souq. Shop the latest gadgets, devices, and accessories today!",
          150,
        ),
        url: data?.url || 'https://961souq.com',
      },
      {
        '@context': 'http://schema.org',
        '@type': 'WebSite',
        name: '961Souq',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://961souq.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
        url: 'https://961souq.com',
      },
    ],
  });
};

export function shouldRevalidate({currentUrl, nextUrl}) {
  return currentUrl.pathname !== nextUrl.pathname;
}

async function fetchCollectionByHandle(context, handle) {
  const {collectionByHandle} = await context.storefront.query(
    GET_COLLECTION_BY_HANDLE_QUERY,
    {variables: {handle}, cache: context.storefront.CacheLong()},
  );
  return collectionByHandle || null;
}

async function fetchCollectionsByHandles(context, handles) {
  const collectionPromises = handles.map(async (handle) => {
    const {collectionByHandle} = await context.storefront.query(
      GET_SIMPLE_COLLECTION_QUERY,
      {variables: {handle}, cache: context.storefront.CacheLong()},
    );
    return collectionByHandle || null;
  });
  const collections = await Promise.all(collectionPromises);
  return collections.filter(Boolean);
}

const getHandleFromUrl = (url) => {
  const parts = url.split('/collections/');
  if (parts.length < 2) return '';
  let handle = parts[1].toLowerCase();
  if (handle.endsWith('/')) {
    handle = handle.slice(0, -1);
  }
  return handle;
};

async function loadCriticalData({context}) {
  const {storefront} = context;
  // const menuHandles = MANUAL_MENU_HANDLES;
  const {shop} = await storefront.query(
    `#graphql
      query ShopDetails {
        shop {
          name
          description
        }
      }
    `,
    {cache: storefront.CacheLong()},
  );
  // const [sliderCollections] = await Promise.all([
  //   fetchCollectionsByHandles(context, menuHandles),
  // ]);
  return {
    // sliderCollections,
    title: shop.name,
    description: shop.description,
    url: 'https://961souq.com',
  };
}

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  const userAgent = args.request.headers.get('user-agent') || '';
  const isMobile = /mobile/i.test(userAgent);
  // Define banners (critical UI elements)
  const banners = [
    // {
    //   desktopImageUrl:
    //     'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/virtual-banner.jpg?v=1743674710',
    //   mobileImageUrl:
    //     'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/mobile-virtual-banner.jpg?v=1743672861',
    //   link: '/apple-virtual-showroom',
    // },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iphone-17-pro-banner.jpg?v=1758713478',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iphone-17-pro-mobile-banner.jpg?v=1758713478',
      link: '/collections/apple-iphone-17',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iphone-air-banner.jpg?v=1758713477',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/iphone-air-mobile-banner.jpg?v=1758713478',
      link: '/collections/apple-iphone-17',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/IPHONE-17_1.jpg?v=1758548805',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/IPHONE-17-MOBILE-BANNER_1.jpg?v=1758548805',
      link: '/collections/apple-iphone-17',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/back-to-school.jpg?v=1756984612',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/back-to-school-mobile.jpg?v=1756984612',
      link: '/collections/back-to-school',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-banner-1.jpg?v=1740146682',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-mobile-banner-1.jpg?v=1740146682',
      link: '/collections/steelseries',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/rayban-banner-F1_98212271-ea73-4c38-b498-ba25125ddd74.jpg?v=1740054162',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/rayban-mobile-banner.jpg?v=1740053906',
      link: '/collections/ray-ban-smart-glasses',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-banner_895451dd-e1a6-41ac-ae3d-0aad653a89d3.jpg?v=1740045077',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-mobile-banner-2.jpg?v=1740045077',
      link: '/collections/jbl-collection',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dyson-banner.jpg?v=1740063425',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dyson-mobile-banner.jpg?v=1740063424',
      link: '/collections/dyson-products',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-banner_0e0f39d5-b1ba-421e-bdaa-d1d6549226cb.jpg?v=1740222975',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-mobile-banner_fa7314db-9154-4ae4-8abe-6c6772a34946.jpg?v=1740223327',
      link: '/collections/apple',
    },
    {
      desktopImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/google-pixel-banner.jpg?v=1728123476',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/google-pixel-mobilebanner.jpg?v=1728123476',
      link: '/collections/google-products',
    },
  ];

  // Fire off critical queries concurrently so above‑the‑fold content is fast.
  const criticalDataPromise = loadCriticalData(args);
  const newArrivalsPromise = fetchCollectionByHandle(
    args.context,
    'new-arrivals',
  );

  const [criticalData, newArrivals] = await Promise.all([
    criticalDataPromise,
    newArrivalsPromise,
  ]);

  // Build a unique list of collection handles from your menus.
  const menuHandles = [
    ...appleMenu.map((item) => getHandleFromUrl(item.url)),
    ...gamingMenu.map((item) => getHandleFromUrl(item.url)),
    ...laptopsMenu.map((item) => getHandleFromUrl(item.url)),
    ...monitorsMenu.map((item) => getHandleFromUrl(item.url)),
    ...mobilesMenu.map((item) => getHandleFromUrl(item.url)),
    ...tabletsMenu.map((item) => getHandleFromUrl(item.url)),
    ...audioMenu.map((item) => getHandleFromUrl(item.url)),
    ...fitnessMenu.map((item) => getHandleFromUrl(item.url)),
    ...camerasMenu.map((item) => getHandleFromUrl(item.url)),
    ...homeAppliancesMenu.map((item) => getHandleFromUrl(item.url)),
  ];
  const uniqueMenuHandles = [...new Set(menuHandles)];

  // Fetch non‑critical collections concurrently.
  const deferredTopProductsPromise = Promise.allSettled(
    uniqueMenuHandles.map((handle) =>
      fetchCollectionByHandle(args.context, handle),
    ),
  ).then((results) => {
    const topProductsByHandle = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        topProductsByHandle[uniqueMenuHandles[index]] = result.value;
      } else {
        console.error(
          `Failed to load collection for handle: ${uniqueMenuHandles[index]}`,
        );
      }
    });
    return topProductsByHandle;
  });

  // Prepare critical top products.
  const initialTopProducts = {};

  // Wait for non‑critical data before returning.
  const restTopProducts = await deferredTopProductsPromise;

  return data(
    {
      banners,
      // sliderCollections: criticalData.sliderCollections,
      newArrivals,
      topProducts: initialTopProducts,
      restTopProducts,
      isMobile,
    },
    {
      headers: {
        'Oxygen-Cache-Control':
          'public, max-age=3600, stale-while-revalidate=86399',
      },
    },
  );
}

const brandsData = [
  {
    name: 'Apple',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-new.jpg?v=1733388855',
    link: '/collections/apple',
  },
  {
    name: 'HP',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/hp-new.jpg?v=1733388855',
    link: '/collections/hp-products',
  },
  {
    name: 'MSI',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/msi-new.jpg?v=1733388855',
    link: '/collections/msi-products',
  },
  {
    name: 'Marshall',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/marshall-new.jpg?v=1733388855',
    link: '/collections/marshall-collection',
  },
  {
    name: 'JBL',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-new.jpg?v=1733388856',
    link: '/collections/jbl-collection',
  },
  {
    name: 'Dell',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dell-new.jpg?v=1733388855',
    link: '/collections/dell-products',
  },
  {
    name: 'Garmin',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-new.jpg?v=1733393801',
    link: '/collections/garmin-smart-watch',
  },
  {
    name: 'Asus',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/asus-new.jpg?v=1733388855',
    link: '/collections/asus-products',
  },
  {
    name: 'Samsung',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-new.jpg?v=1733388855',
    link: '/collections/samsung-products',
  },
  {
    name: 'Sony',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/sony-new.jpg?v=1733389303',
    link: '/collections/sony',
  },
  {
    name: 'Benq',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/benq.jpg?v=1733388855',
    link: '/collections/benq-products',
  },
  {
    name: 'Tp-link',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/tp-link.jpg?v=1733388855',
    link: '/collections/tp-link-products',
  },
  {
    name: 'Nothing',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nothing-new.jpg?v=1733388855',
    link: '/collections/nothing-products',
  },
  {
    name: 'Xiaomi',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/mi-new.jpg?v=1733388855',
    link: '/collections/xiaomi-products',
  },
  {
    name: 'Microsoft',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/microsoft-new.jpg?v=1733388855',
    link: '/collections/microsoft-products',
  },
  {
    name: 'Nintendo',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nintendo-new.jpg?v=1733388855',
    link: '/collections/nintendo-products',
  },
  {
    name: 'Lenovo',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenovo-new.jpg?v=1733388855',
    link: '/collections/lenovo-products',
  },
  {
    name: 'LG',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lg-new.jpg?v=1733388855',
    link: '/collections/lg-products',
  },
  {
    name: 'Meta',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/meta-new.jpg?v=1733388855',
    link: '/collections/meta-products',
  },
  {
    name: 'Ubiquiti',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ubiquiti-new.jpg?v=1733388855',
    link: '/collections/ubiquiti-products',
  },
  {
    name: 'Philips',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Philips-new.jpg?v=1733388855',
    link: '/collections/philips-products',
  },
];

export default function Homepage() {
  const {
    banners,
    // sliderCollections,
    topProducts,
    newArrivals,
    restTopProducts,
    isMobile,
  } = useLoaderData();

  const rootMatch = useMatches()[0];
  const header = rootMatch?.data?.header;

  const combinedTopProducts = {
    ...topProducts,
  };
  const fullTopProducts = {...combinedTopProducts, ...restTopProducts};

  const menus = {
    apple: appleMenu,
    gaming: gamingMenu,
    laptops: laptopsMenu,
    monitors: monitorsMenu,
    mobiles: mobilesMenu,
    tablets: tabletsMenu,
    audio: audioMenu,
    fitness: fitnessMenu,
    cameras: camerasMenu,
    homeAppliances: homeAppliancesMenu,
  };
  const menuKeys = Object.keys(menus);
  const [selectedMenu, setSelectedMenu] = useState(menuKeys[0]);
  const [selectedCollection, setSelectedCollection] = useState(
    menus[menuKeys[0]][0],
  );
  useEffect(() => {
    setSelectedCollection(menus[selectedMenu][0]);
  }, [selectedMenu]);

  // Desktop state: original multiple-groups.
  const [selectedApple, setSelectedApple] = useState(appleMenu[0]);
  const [selectedGaming, setSelectedGaming] = useState(gamingMenu[0]);
  const [selectedLaptops, setSelectedLaptops] = useState(laptopsMenu[0]);
  const [selectedMonitors, setSelectedMonitors] = useState(monitorsMenu[0]);
  const [selectedMobiles, setSelectedMobiles] = useState(mobilesMenu[0]);
  const [selectedTablets, setSelectedTablets] = useState(tabletsMenu[0]);
  const [selectedAudio, setSelectedAudio] = useState(audioMenu[0]);
  const [selectedFitness, setSelectedFitness] = useState(fitnessMenu[0]);
  const [selectedCameras, setSelectedCameras] = useState(camerasMenu[0]);
  const [selectedHomeAppliances, setSelectedHomeAppliances] = useState(
    homeAppliancesMenu[0],
  );

  // First, at the top of your component (in the mobile branch section),
  // add:
  const [fade, setFade] = useState(false);

  const handleMenuClick = (menuKey) => {
    // Fade out current content
    setFade(true);
    // After the fade-out duration, update the menu
    setTimeout(() => {
      setSelectedMenu(menuKey);
      setSelectedCollection(menus[menuKey][0]);
      // Fade in the new content
      setFade(false);
    }, 300); // 300ms transition duration
  };

  // const reelIds = ['DLIFKQtNTvj', 'DLmgJDxM93m', 'DLaGHiLt0cs', 'DLCs7TsMe0a', 'DKrX0cCsLDQ', 'DKeZDnjsasA'];
  // const productUrls = [
  //   '/products/gravastar-mercury-k1-pro-combo-blue-dragon-edition',
  //   '/products/canon-powershot-v10-4k-vlogging-camera',
  //   '/products/mechtron-tl-g007s-8v-li-ion-cyber-hammer-drill-driver',
  //   '/products/godox-ma5r-magnetic-full-color-led-light',
  //   '/collections/labubu',
  //   '/collections/asus-rog-strix',
  // ];

  return (
    <div className="home">
      {/* <MobileAppPopup /> */}
      <h1
        className="home-h1"
        aria-label="961Souq | Leading Electronics, PC and Gaming Equipment Store in Lebanon"
      ></h1>

      <BannerSlideshow banners={banners} />
      {newArrivals && <TopProductSections collection={newArrivals} />}

      {isMobile ? (
        <>
          {header && (
            <>
              {/* <div className="instagram-reels-container">
                <h1>Instagram Reels</h1>
                <InstagramReelsCarousel reelIds={reelIds} productUrls={productUrls} />
              </div> */}
              <MobileCategoryTiles menu={header.menu} />
              <CategorySliderFromMenuMobile menu={header.menu} />
            </>
          )}
        </>
      ) : (
        // <div>
        //   <div className="buttons-list">
        //     <div className="menu-list">
        //       {menuKeys.map((key) => (
        //         <button
        //           key={key}
        //           onClick={() => handleMenuClick(key)}
        //           className={key === selectedMenu ? 'button-85' : ''}
        //         >
        //           {key.charAt(0).toUpperCase() + key.slice(1)}
        //         </button>
        //       ))}
        //     </div>
        //   </div>
        //   <div
        //     style={{
        //       opacity: fade ? 0 : 1,
        //       transition: 'opacity 300ms ease-in-out',
        //     }}
        //   >
        //     <CollectionCircles
        //       collections={menus[selectedMenu]}
        //       selectedCollection={selectedCollection}
        //       onCollectionSelect={setSelectedCollection}
        //     />
        //     {selectedCollection &&
        //       fullTopProducts[getHandleFromUrl(selectedCollection.url)] && (
        //         <TopProductSections
        //           key={`${selectedMenu}-${getHandleFromUrl(
        //             selectedCollection.url,
        //           )}`}
        //           collection={
        //             fullTopProducts[getHandleFromUrl(selectedCollection.url)]
        //           }
        //         />
        //       )}
        //   </div>
        // </div>
        <>
          <>{header && <CategorySliderFromMenu menu={header.menu} />}</>
          {/* Desktop View: Original layout with multiple groups */}
          {/* Apple Group */}
          <CollectionCircles
            collections={appleMenu}
            selectedCollection={selectedApple}
            onCollectionSelect={setSelectedApple}
          />
          {selectedApple &&
            fullTopProducts[getHandleFromUrl(selectedApple.url)] && (
              <TopProductSections
                key={getHandleFromUrl(selectedApple.url)}
                collection={
                  fullTopProducts[getHandleFromUrl(selectedApple.url)]
                }
              />
            )}

          <VideosGallery
            videos={[
              {
                src: 'https://cdn.shopify.com/videos/c/o/v/fa446492aa194b0d9b6f9e2dd686111c.mp4',
                href: '/products/air-cooling-mist-fan',
              },
              {
                src: 'https://cdn.shopify.com/videos/c/o/v/a67b4e70a5b1452f959de8f4189ffc8f.mp4',
                href: '/products/telesin-fun-shot-magnetic-phone-grip-with-light',
              },
              {
                src: 'https://cdn.shopify.com/videos/c/o/v/a45eb2a3059e473985a7c76c47861f24.mp4',
                href: '/collections/whoop-fitness-bands',
              },
              {
                src: 'https://cdn.shopify.com/videos/c/o/v/d296bab182604700b7eba56640fc94d2.mp4',
                href: '/products/fujifilm-instax-mini-41-instant-camera',
              },
              {
                src: 'https://cdn.shopify.com/videos/c/o/v/375f6c7dacae4625af6cdcc6839bb668.mp4',
                href: '/collections/karl-lagerfeld',
              },
              {
                src: 'https://cdn.shopify.com/videos/c/o/v/34df6684f0b547f7904ab185d315a148.mp4',
                href: '/products/asus-proart-p16-h7606-copilot-pc-16-touchscreen-ryzen-ai-9-hx-370-32gb-ram-1tb-ssd-rtx-4060-8gb',
              },
              {
                src: 'https://cdn.shopify.com/videos/c/o/v/a04a6af8173e4759bbdcb11b218b43eb.mp4',
                href: '/collections/garmin-smart-watch',
              },
              {
                src: 'https://cdn.shopify.com/videos/c/o/v/333b871711e54a92835ced0296fe8f59.mp4',
                href: '/products/fujifilm-instax-wide-evo™-hybrid-instant-camera',
              },
              {
                src: 'https://cdn.shopify.com/videos/c/o/v/7cbd91e1e7be4f738941c9583dcaf3d1.mp4',
                href: '/collections/ray-ban-smart-glasses',
              },
            ]}
          />

          {/* Gaming Group */}
          <CollectionCircles
            collections={gamingMenu}
            selectedCollection={selectedGaming}
            onCollectionSelect={setSelectedGaming}
          />
          {selectedGaming &&
            fullTopProducts[getHandleFromUrl(selectedGaming.url)] && (
              <TopProductSections
                key={getHandleFromUrl(selectedGaming.url)}
                collection={
                  fullTopProducts[getHandleFromUrl(selectedGaming.url)]
                }
              />
            )}

          {/* Laptops Group */}
          <CollectionCircles
            collections={laptopsMenu}
            selectedCollection={selectedLaptops}
            onCollectionSelect={setSelectedLaptops}
          />
          {selectedLaptops &&
            fullTopProducts[getHandleFromUrl(selectedLaptops.url)] && (
              <TopProductSections
                key={getHandleFromUrl(selectedLaptops.url)}
                collection={
                  fullTopProducts[getHandleFromUrl(selectedLaptops.url)]
                }
              />
            )}

          {/* Monitors Group */}
          <CollectionCircles
            collections={monitorsMenu}
            selectedCollection={selectedMonitors}
            onCollectionSelect={setSelectedMonitors}
          />
          {selectedMonitors &&
            fullTopProducts[getHandleFromUrl(selectedMonitors.url)] && (
              <TopProductSections
                key={getHandleFromUrl(selectedMonitors.url)}
                collection={
                  fullTopProducts[getHandleFromUrl(selectedMonitors.url)]
                }
              />
            )}

          {/* Mobiles Group */}
          <CollectionCircles
            collections={mobilesMenu}
            selectedCollection={selectedMobiles}
            onCollectionSelect={setSelectedMobiles}
          />
          {selectedMobiles &&
            fullTopProducts[getHandleFromUrl(selectedMobiles.url)] && (
              <TopProductSections
                key={getHandleFromUrl(selectedMobiles.url)}
                collection={
                  fullTopProducts[getHandleFromUrl(selectedMobiles.url)]
                }
              />
            )}

          {/* Tablets Group */}
          <CollectionCircles
            collections={tabletsMenu}
            selectedCollection={selectedTablets}
            onCollectionSelect={setSelectedTablets}
          />
          {selectedTablets &&
            fullTopProducts[getHandleFromUrl(selectedTablets.url)] && (
              <TopProductSections
                key={getHandleFromUrl(selectedTablets.url)}
                collection={
                  fullTopProducts[getHandleFromUrl(selectedTablets.url)]
                }
              />
            )}

          {/* Audio Group */}
          <CollectionCircles
            collections={audioMenu}
            selectedCollection={selectedAudio}
            onCollectionSelect={setSelectedAudio}
          />
          {selectedAudio &&
            fullTopProducts[getHandleFromUrl(selectedAudio.url)] && (
              <TopProductSections
                key={getHandleFromUrl(selectedAudio.url)}
                collection={
                  fullTopProducts[getHandleFromUrl(selectedAudio.url)]
                }
              />
            )}

          {/* Fitness Group */}
          <CollectionCircles
            collections={fitnessMenu}
            selectedCollection={selectedFitness}
            onCollectionSelect={setSelectedFitness}
          />
          {selectedFitness &&
            fullTopProducts[getHandleFromUrl(selectedFitness.url)] && (
              <TopProductSections
                key={getHandleFromUrl(selectedFitness.url)}
                collection={
                  fullTopProducts[getHandleFromUrl(selectedFitness.url)]
                }
              />
            )}

          {/* Cameras Group */}
          <CollectionCircles
            collections={camerasMenu}
            selectedCollection={selectedCameras}
            onCollectionSelect={setSelectedCameras}
          />
          {selectedCameras &&
            fullTopProducts[getHandleFromUrl(selectedCameras.url)] && (
              <TopProductSections
                key={getHandleFromUrl(selectedCameras.url)}
                collection={
                  fullTopProducts[getHandleFromUrl(selectedCameras.url)]
                }
              />
            )}

          {/* Home Appliances Group */}
          <CollectionCircles
            collections={homeAppliancesMenu}
            selectedCollection={selectedHomeAppliances}
            onCollectionSelect={setSelectedHomeAppliances}
          />
          {selectedHomeAppliances &&
            fullTopProducts[getHandleFromUrl(selectedHomeAppliances.url)] && (
              <TopProductSections
                key={getHandleFromUrl(selectedHomeAppliances.url)}
                collection={
                  fullTopProducts[getHandleFromUrl(selectedHomeAppliances.url)]
                }
              />
            )}
        </>
      )}
      {/* <ScrollingSVGs /> */}
      <BrandSection brands={brandsData} />
    </div>
  );
}
