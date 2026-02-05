import React, {useState, useEffect, useRef} from 'react';
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
  GET_HOMEPAGE_COLLECTION_QUERY,
  GET_SIMPLE_COLLECTION_QUERY,
} from '../data/queries.ts';
import {CategorySliderWithMoreHeight} from '~/components/CollectionSliderWithMoreHeight';
import VideosGallery from '~/components/VideosGallery';
import {CategorySliderFromMenu} from '~/components/CategorySliderFromMenu';
import {CategorySliderFromMenuMobile} from '~/components/CategorySliderFromMenuMobile';
import MobileCategoryTiles from '~/components/MobileCategoryTiles';
// import RelatedProductsFromHistory from '~/components/RelatedProductsFromHistory';
import MobileCategoryCards from '~/components/MobileCategoryCards';
import MobileAppPopup from '~/components/MobileAppPopup';
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

export function shouldRevalidate({
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}) {
  // When navigating back to the homepage, keep cached loader data
  // so it does not refetch + feel slow.
  if (nextUrl?.pathname === '/' && currentUrl?.pathname !== '/') {
    return false;
  }

  // Fallback to Remix default behavior when provided,
  // otherwise preserve your previous logic.
  return defaultShouldRevalidate ?? currentUrl.pathname !== nextUrl.pathname;
}

async function fetchCollectionByHandle(context, handle, cacheOverride) {
  const {collectionByHandle} = await context.storefront.query(
    GET_HOMEPAGE_COLLECTION_QUERY,
    {
      variables: {handle},
      cache: cacheOverride || context.storefront.CacheShort(),
    },
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
  const banners = [
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
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-banner-1.jpg?v=1740146682',
      mobileImageUrl:
        'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/steelseries-mobile-banner-1.jpg?v=1740146682',
      link: '/collections/steelseries',
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
  ];

  // Fire off critical queries concurrently so above-the-fold content is fast.
  const criticalDataPromise = loadCriticalData(args);

  const newArrivalsPromise = fetchCollectionByHandle(
    args.context,
    'new-arrivals',
    args.context.storefront.CacheShort(),
  );
  const cosmeticsPromise = fetchCollectionByHandle(
    args.context,
    'cosmetics',
    args.context.storefront.CacheShort(),
  );

  const [criticalData, newArrivals, cosmetics] = await Promise.all([
    criticalDataPromise,
    newArrivalsPromise,
    cosmeticsPromise,
  ]);

  // Build a unique list of collection handles from your menus.
  // IMPORTANT: On mobile you are not rendering all the desktop sections,
  // so skip preloading these collections entirely to avoid slowing down the homepage.
  const menuHandles = isMobile
    ? []
    : [
        appleMenu[0],
        gamingMenu[0],
        laptopsMenu[0],
        monitorsMenu[0],
        mobilesMenu[0],
        tabletsMenu[0],
        audioMenu[0],
        fitnessMenu[0],
        camerasMenu[0],
        homeAppliancesMenu[0],
      ].map((item) => getHandleFromUrl(item?.url || ''));

  const excludedHandles = new Set(
    [newArrivals?.handle, cosmetics?.handle].filter(Boolean),
  );
  const uniqueMenuHandles = [...new Set(menuHandles)].filter(
    (handle) => handle && !excludedHandles.has(handle),
  );

  // Fetch non-critical collections concurrently (desktop only).
  // Use a longer cache here because these are homepage sections.
  const deferredTopProductsPromise =
    uniqueMenuHandles.length === 0
      ? Promise.resolve({})
      : Promise.allSettled(
          uniqueMenuHandles.map((handle) =>
            fetchCollectionByHandle(
              args.context,
              handle,
              args.context.storefront.CacheLong(),
            ),
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

  // Wait for non-critical data before returning (keeps your current behavior unchanged).
  const restTopProducts = await deferredTopProductsPromise;

  return data(
    {
      banners,
      // sliderCollections: criticalData.sliderCollections,
      title: criticalData.title,
      description: criticalData.description,
      url: criticalData.url,
      newArrivals,
      cosmetics,
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

function TopProductPlaceholder({title, handle, count = 6}) {
  return (
    <div className="collection-section">
      <div className="collection-header">
        <p className="home-colleciton-title">{title}</p>
        <div className="collection-header-right">
          {handle ? (
            <a className="view-all-link" href={`/collections/${handle}`}>
              View All
            </a>
          ) : null}
        </div>
      </div>

      <div className="collection-products-row">
        {Array.from({length: count}).map((_, index) => (
          <div key={index} className="product-item">
            <div className="product-card skeleton product-card--placeholder">
              <div className="skeleton-img skeleton-img--card" />
              <div className="skeleton-block skeleton-block--title" />
              <div className="skeleton-block skeleton-block--price" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Homepage() {
  const {
    banners,
    // sliderCollections,
    topProducts,
    newArrivals,
    cosmetics,
    restTopProducts,
    isMobile,
  } = useLoaderData();

  const restTopProductsSafe =
    restTopProducts && typeof restTopProducts === 'object' ? restTopProducts : {};
  const [onDemandTopProducts, setOnDemandTopProducts] = useState({});
  const [loadingHandles, setLoadingHandles] = useState({});
  const inflightCollectionsRef = useRef(new Set());

  const rootMatch = useMatches()[0];
  const header = rootMatch?.data?.header;

  // RelatedProductsFromHistory temporarily disabled for testing performance
  // const [rpKey, setRpKey] = useState(0);

  // useEffect(() => {
  //   const bump = () => setRpKey((k) => k + 1);

  //   // Only bump when the page is restored from BFCache (back/forward cache),
  //   // to avoid multiple remounts/jank during normal navigation/focus changes.
  //   const onPageShow = (e) => {
  //     if (e && e.persisted) bump();
  //   };

  //   window.addEventListener('pageshow', onPageShow);

  //   return () => {
  //     window.removeEventListener('pageshow', onPageShow);
  //   };
  // }, []);

  const combinedTopProducts = {
    ...topProducts,
  };
  const fullTopProducts = {
    ...combinedTopProducts,
    ...restTopProductsSafe,
    ...onDemandTopProducts,
  };

  const ensureCollectionLoaded = (handle) => {
    if (!handle) return;
    if (fullTopProducts[handle]) return;
    if (inflightCollectionsRef.current.has(handle)) return;

    inflightCollectionsRef.current.add(handle);
    setLoadingHandles((prev) => {
      if (prev[handle]) return prev;
      return {...prev, [handle]: true};
    });
    fetch(`/api/home-collection?handle=${encodeURIComponent(handle)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load collection: ${handle}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data?.collection) {
          setOnDemandTopProducts((prev) => ({
            ...prev,
            [handle]: data.collection,
          }));
        }
      })
      .catch((error) => {
        console.error('Homepage on-demand collection fetch failed', error);
      })
      .finally(() => {
        inflightCollectionsRef.current.delete(handle);
        setLoadingHandles((prev) => {
          if (!prev[handle]) return prev;
          const next = {...prev};
          delete next[handle];
          return next;
        });
      });
  };

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
    const nextCollection = menus[selectedMenu][0];
    setSelectedCollection(nextCollection);
    ensureCollectionLoaded(getHandleFromUrl(nextCollection?.url || ''));
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
      const nextCollection = menus[menuKey][0];
      setSelectedCollection(nextCollection);
      ensureCollectionLoaded(getHandleFromUrl(nextCollection?.url || ''));
      // Fade in the new content
      setFade(false);
    }, 300); // 300ms transition duration
  };

  const buildSelectHandler = (setFn) => (item) => {
    setFn(item);
    ensureCollectionLoaded(getHandleFromUrl(item?.url || ''));
  };

  const handleAppleSelect = buildSelectHandler(setSelectedApple);
  const handleGamingSelect = buildSelectHandler(setSelectedGaming);
  const handleLaptopsSelect = buildSelectHandler(setSelectedLaptops);
  const handleMonitorsSelect = buildSelectHandler(setSelectedMonitors);
  const handleMobilesSelect = buildSelectHandler(setSelectedMobiles);
  const handleTabletsSelect = buildSelectHandler(setSelectedTablets);
  const handleAudioSelect = buildSelectHandler(setSelectedAudio);
  const handleFitnessSelect = buildSelectHandler(setSelectedFitness);
  const handleCamerasSelect = buildSelectHandler(setSelectedCameras);
  const handleHomeAppliancesSelect =
    buildSelectHandler(setSelectedHomeAppliances);

  const renderCollectionSection = ({
    menu,
    selectedItem,
    onSelect,
    fallbackTitle,
  }) => {
    const handle = getHandleFromUrl(selectedItem?.url || '');
    const collection = handle ? fullTopProducts[handle] : null;
    const isLoading = handle ? !!loadingHandles[handle] : false;
    const title = selectedItem?.title || fallbackTitle || 'Collection';

    return (
      <>
        <CollectionCircles
          collections={menu}
          selectedCollection={selectedItem}
          onCollectionSelect={onSelect}
        />
        {selectedItem && collection ? (
          <TopProductSections key={handle} collection={collection} />
        ) : isLoading ? (
          <TopProductPlaceholder
            key={`${handle}-placeholder`}
            title={title}
            handle={handle}
          />
        ) : null}
      </>
    );
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
      <MobileAppPopup />
      <h1
        className="home-h1"
        aria-label="961Souq | Leading Electronics, PC and Gaming Equipment Store in Lebanon"
      ></h1>

      <BannerSlideshow banners={banners} />

      {newArrivals && <TopProductSections collection={newArrivals} />}
      {cosmetics && <TopProductSections collection={cosmetics} />}

      {/* RelatedProductsFromHistory temporarily disabled for testing performance */}
      {/* <RelatedProductsFromHistory key={rpKey} /> */}

      {isMobile ? (
        <>
          {header && (
            <>
              <MobileCategoryCards menu={header.menu} />
              {/* <div className="instagram-reels-container">
                <h1>Instagram Reels</h1>
                <InstagramReelsCarousel reelIds={reelIds} productUrls={productUrls} />
              </div> */}
              {/* <CategorySliderFromMenuMobile menu={header.menu} /> */}
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

          {/* Apple Group */}
          {renderCollectionSection({
            menu: appleMenu,
            selectedItem: selectedApple,
            onSelect: handleAppleSelect,
            fallbackTitle: 'Apple',
          })}

          {/* Gaming Group */}
          {renderCollectionSection({
            menu: gamingMenu,
            selectedItem: selectedGaming,
            onSelect: handleGamingSelect,
            fallbackTitle: 'Gaming',
          })}

          {/* Laptops Group */}
          {renderCollectionSection({
            menu: laptopsMenu,
            selectedItem: selectedLaptops,
            onSelect: handleLaptopsSelect,
            fallbackTitle: 'Laptops',
          })}

          {/* Monitors Group */}
          {renderCollectionSection({
            menu: monitorsMenu,
            selectedItem: selectedMonitors,
            onSelect: handleMonitorsSelect,
            fallbackTitle: 'Monitors',
          })}

          {/* Mobiles Group */}
          {renderCollectionSection({
            menu: mobilesMenu,
            selectedItem: selectedMobiles,
            onSelect: handleMobilesSelect,
            fallbackTitle: 'Mobiles',
          })}

          {/* Tablets Group */}
          {renderCollectionSection({
            menu: tabletsMenu,
            selectedItem: selectedTablets,
            onSelect: handleTabletsSelect,
            fallbackTitle: 'Tablets',
          })}

          {/* Audio Group */}
          {renderCollectionSection({
            menu: audioMenu,
            selectedItem: selectedAudio,
            onSelect: handleAudioSelect,
            fallbackTitle: 'Audio',
          })}

          {/* Fitness Group */}
          {renderCollectionSection({
            menu: fitnessMenu,
            selectedItem: selectedFitness,
            onSelect: handleFitnessSelect,
            fallbackTitle: 'Fitness',
          })}

          {/* Cameras Group */}
          {renderCollectionSection({
            menu: camerasMenu,
            selectedItem: selectedCameras,
            onSelect: handleCamerasSelect,
            fallbackTitle: 'Cameras',
          })}

          {/* Home Appliances Group */}
          {renderCollectionSection({
            menu: homeAppliancesMenu,
            selectedItem: selectedHomeAppliances,
            onSelect: handleHomeAppliancesSelect,
            fallbackTitle: 'Home Appliances',
          })}
        </>
      )}

      {/* <ScrollingSVGs /> */}
      <BrandSection brands={brandsData} />
    </div>
  );
}
