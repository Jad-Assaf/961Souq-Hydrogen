import React, {
  Suspense,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import {Await, useLoaderData, useMatches} from '@remix-run/react';
import MosaicHero, {
  MOSAIC_FEATURE_SIZES,
  MOSAIC_FEATURE_WIDTHS,
  withMosaicImageParams,
} from '~/components/MosaicHero';
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
  GET_HOMEPAGE_COLLECTION_MOBILE_QUERY,
} from '../data/queries.ts';
import {CategorySliderFromMenu} from '~/components/CategorySliderFromMenu';
// import RelatedProductsFromHistory from '~/components/RelatedProductsFromHistory';
import MobileAppPopup from '~/components/MobileAppPopup';
import {defer} from '@shopify/remix-oxygen';
// import InstagramReelsCarousel from '~/components/InstagramCarousel';

const HERO_FEATURE_IMAGE_URL =
  'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Image_202602241158.jpg?v=1771928636&format=webp';

const MOBILE_PRODUCT_ROW_HANDLES = [
  'apple',
  'gaming-laptops',
  'gaming-accessories',
  'laptops',
  'desktops',
  'business-monitors',
  'gaming-monitors',
  'apple-iphone',
  'samsung-mobile-phones',
  'tablets',
  'audio',
  'fitness',
  'photography',
  'home-appliances',
  'computer-accessories',
  'pc-parts',
  'networking',
];

export function links() {
  const imageSrcSet = MOSAIC_FEATURE_WIDTHS.map(
    (width) =>
      `${withMosaicImageParams(HERO_FEATURE_IMAGE_URL, {width})} ${width}w`,
  ).join(', ');

  return [
    {
      rel: 'preload',
      as: 'image',
      href: withMosaicImageParams(HERO_FEATURE_IMAGE_URL, {width: 900}),
      imageSrcSet,
      imageSizes: MOSAIC_FEATURE_SIZES,
      fetchpriority: 'high',
    },
  ];
}

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
 * @type {MetaFunction}
 */
export const meta = ({data, matches}) => {
  const truncate = (text, maxLength) =>
    text?.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;

  // Merge in any defaults from your root route’s SEO config
  const parentSeo = matches[0]?.data?.seo;

  // Your OG image URL
  const ogImageUrl =
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/logo-photo.jpg?v=1772628583';

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

async function fetchCollectionByHandle(
  context,
  handle,
  cacheOverride,
  options = {},
) {
  const query = options.mobile
    ? GET_HOMEPAGE_COLLECTION_MOBILE_QUERY
    : GET_HOMEPAGE_COLLECTION_QUERY;
  const {collectionByHandle} = await context.storefront.query(query, {
    variables: {handle},
    cache: cacheOverride || context.storefront.CacheShort(),
  });
  if (!collectionByHandle?.products?.nodes?.length) return null;
  return collectionByHandle;
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

const handleToLabel = (handle) =>
  String(handle || '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

function runWhenIdle(task, timeout = 2500) {
  if (typeof window === 'undefined') return () => {};

  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(task, {timeout});
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(task, 250);
  return () => window.clearTimeout(id);
}

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

  // Fire off critical queries concurrently so above-the-fold content is fast.
  const criticalDataPromise = loadCriticalData(args);

  const newArrivalsPromise = fetchCollectionByHandle(
    args.context,
    'new-arrivals',
    args.context.storefront.CacheShort(),
    {mobile: isMobile},
  ).catch((error) => {
    console.error(
      'Homepage critical collection fetch failed: new-arrivals',
      error,
    );
    return null;
  });
  const cosmeticsPromise = fetchCollectionByHandle(
    args.context,
    'cosmetics',
    args.context.storefront.CacheShort(),
    {mobile: isMobile},
  ).catch((error) => {
    console.error(
      'Homepage critical collection fetch failed: cosmetics',
      error,
    );
    return null;
  });

  const criticalData = await criticalDataPromise;

  // Prepare critical top products.
  const initialTopProducts = {};

  return defer(
    {
      // sliderCollections: criticalData.sliderCollections,
      title: criticalData.title,
      description: criticalData.description,
      url: criticalData.url,
      newArrivals: newArrivalsPromise,
      cosmetics: cosmeticsPromise,
      heroCollections: null,
      topProducts: initialTopProducts,
      restTopProducts: {},
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
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-new.jpg?v=1733388855&format=webp',
    link: '/collections/apple',
  },
  {
    name: 'HP',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/hp-new.jpg?v=1733388855&format=webp',
    link: '/collections/hp-products',
  },
  {
    name: 'MSI',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/msi-new.jpg?v=1733388855&format=webp',
    link: '/collections/msi-products',
  },
  {
    name: 'Marshall',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/marshall-new.jpg?v=1733388855&format=webp',
    link: '/collections/marshall-collection',
  },
  {
    name: 'JBL',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/jbl-new.jpg?v=1733388856&format=webp',
    link: '/collections/jbl-collection',
  },
  {
    name: 'Dell',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/dell-new.jpg?v=1733388855&format=webp',
    link: '/collections/dell-products',
  },
  {
    name: 'Garmin',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-new.jpg?v=1733393801&format=webp',
    link: '/collections/garmin-smart-watch',
  },
  {
    name: 'Asus',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/asus-new.jpg?v=1733388855&format=webp',
    link: '/collections/asus-products',
  },
  {
    name: 'Samsung',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/samsung-new.jpg?v=1733388855&format=webp',
    link: '/collections/samsung-products',
  },
  {
    name: 'Sony',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/sony-new.jpg?v=1733389303&format=webp',
    link: '/collections/sony',
  },
  {
    name: 'Benq',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/benq.jpg?v=1733388855&format=webp',
    link: '/collections/benq-products',
  },
  {
    name: 'Tp-link',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/tp-link.jpg?v=1733388855&format=webp',
    link: '/collections/tp-link-products',
  },
  {
    name: 'Nothing',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nothing-new.jpg?v=1733388855&format=webp',
    link: '/collections/nothing-products',
  },
  {
    name: 'Xiaomi',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/mi-new.jpg?v=1733388855&format=webp',
    link: '/collections/xiaomi-products',
  },
  {
    name: 'Microsoft',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/microsoft-new.jpg?v=1733388855&format=webp',
    link: '/collections/microsoft-products',
  },
  {
    name: 'Nintendo',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/nintendo-new.jpg?v=1733388855&format=webp',
    link: '/collections/nintendo-products',
  },
  {
    name: 'Lenovo',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lenovo-new.jpg?v=1733388855&format=webp',
    link: '/collections/lenovo-products',
  },
  {
    name: 'LG',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/lg-new.jpg?v=1733388855&format=webp',
    link: '/collections/lg-products',
  },
  {
    name: 'Meta',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/meta-new.jpg?v=1733388855&format=webp',
    link: '/collections/meta-products',
  },
  {
    name: 'Ubiquiti',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/ubiquiti-new.jpg?v=1733388855&format=webp',
    link: '/collections/ubiquiti-products',
  },
  {
    name: 'Philips',
    image:
      'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/Philips-new.jpg?v=1733388855&format=webp',
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

function LazyMount({children, rootMargin = '200px'}) {
  const [isVisible, setIsVisible] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    if (isVisible) return;
    const node = targetRef.current;
    if (!node) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {rootMargin, threshold: 0},
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

  return <div ref={targetRef}>{isVisible ? children : null}</div>;
}

export default function Homepage() {
  const {
    // sliderCollections,
    topProducts,
    newArrivals,
    cosmetics,
    heroCollections,
    restTopProducts,
    isMobile,
  } = useLoaderData();

  const restTopProductsSafe = useMemo(
    () =>
      restTopProducts && typeof restTopProducts === 'object'
        ? restTopProducts
        : {},
    [restTopProducts],
  );
  const [onDemandTopProducts, setOnDemandTopProducts] = useState({});
  const [loadingHandles, setLoadingHandles] = useState({});
  const inflightCollectionsRef = useRef(new Set());
  const queuedCollectionsRef = useRef(new Set());
  const collectionQueueRef = useRef(Promise.resolve());
  const newArrivalsTriggerRef = useRef(null);
  const [hasNewArrivalsSection, setHasNewArrivalsSection] = useState(false);
  const [mobilePopupEnabled, setMobilePopupEnabled] = useState(false);
  const setNewArrivalsTriggerNode = useCallback((node) => {
    newArrivalsTriggerRef.current = node;
    setHasNewArrivalsSection(Boolean(node));
  }, []);

  const rootMatch = useMatches()[0];
  const header = rootMatch?.data?.header;
  const mobileLevelOneCollections = useMemo(() => {
    return MOBILE_PRODUCT_ROW_HANDLES.map((handle) => ({
      id: handle,
      handle,
      title: handleToLabel(handle),
    }));
  }, []);
  const desktopMenuHandles = useMemo(() => {
    const groups = [
      appleMenu,
      gamingMenu,
      laptopsMenu,
      monitorsMenu,
      mobilesMenu,
      tabletsMenu,
      audioMenu,
      fitnessMenu,
      camerasMenu,
      homeAppliancesMenu,
    ];

    return [
      ...new Set(
        groups
          .flat()
          .map((item) => getHandleFromUrl(item?.url || ''))
          .filter(Boolean),
      ),
    ];
  }, []);

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

  const fullTopProducts = useMemo(
    () => ({
      ...(topProducts || {}),
      ...restTopProductsSafe,
      ...onDemandTopProducts,
    }),
    [topProducts, restTopProductsSafe, onDemandTopProducts],
  );
  const hasLoadedHandle = useCallback(
    (handle) =>
      Object.prototype.hasOwnProperty.call(fullTopProducts || {}, handle),
    [fullTopProducts],
  );

  const ensureCollectionLoaded = useCallback(
    (handle) => {
      if (!handle) return;
      if (hasLoadedHandle(handle)) return;
      if (inflightCollectionsRef.current.has(handle)) return;
      if (queuedCollectionsRef.current.has(handle)) return;

      queuedCollectionsRef.current.add(handle);
      setLoadingHandles((prev) => {
        if (prev[handle]) return prev;
        return {...prev, [handle]: true};
      });

      const loadHandle = async () => {
        inflightCollectionsRef.current.add(handle);
        try {
          const maxAttempts = 3;
          let lastError = null;

          for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
              const res = await fetch(
                `/api/home-collection?handle=${encodeURIComponent(handle)}`,
              );

              if (!res.ok) {
                const error = new Error(
                  `Failed to load collection: ${handle} (status ${res.status})`,
                );
                error.status = res.status;
                throw error;
              }

              const data = await res.json();
              setOnDemandTopProducts((prev) => ({
                ...prev,
                [handle]: data?.collection || null,
              }));
              lastError = null;
              break;
            } catch (error) {
              lastError = error;
              const isLastAttempt = attempt === maxAttempts;
              const isNotFound = Number(error?.status) === 404;

              if (isNotFound || isLastAttempt) {
                throw error;
              }

              await new Promise((resolve) =>
                setTimeout(resolve, attempt * 350),
              );
            }
          }

          if (lastError) {
            throw lastError;
          }
        } catch (error) {
          console.error('Homepage on-demand collection fetch failed', error);
          if (Number(error?.status) === 404) {
            setOnDemandTopProducts((prev) => {
              if (Object.prototype.hasOwnProperty.call(prev, handle))
                return prev;
              return {...prev, [handle]: null};
            });
          }
        } finally {
          inflightCollectionsRef.current.delete(handle);
          queuedCollectionsRef.current.delete(handle);
          setLoadingHandles((prev) => {
            if (!prev[handle]) return prev;
            const next = {...prev};
            delete next[handle];
            return next;
          });
        }
      };

      collectionQueueRef.current = collectionQueueRef.current
        .catch(() => {})
        .then(loadHandle);
    },
    [hasLoadedHandle],
  );

  useEffect(() => {
    if (!isMobile || !mobileLevelOneCollections.length) return;
    const cancelIdle = runWhenIdle(() => {
      mobileLevelOneCollections.forEach(({handle}) => {
        if (!hasLoadedHandle(handle)) {
          ensureCollectionLoaded(handle);
        }
      });
    });
    return cancelIdle;
  }, [
    isMobile,
    mobileLevelOneCollections,
    hasLoadedHandle,
    ensureCollectionLoaded,
  ]);

  useEffect(() => {
    if (isMobile || !desktopMenuHandles.length) return;
    const cancelIdle = runWhenIdle(() => {
      desktopMenuHandles.forEach((handle) => {
        if (!hasLoadedHandle(handle)) {
          ensureCollectionLoaded(handle);
        }
      });
    });
    return cancelIdle;
  }, [isMobile, desktopMenuHandles, hasLoadedHandle, ensureCollectionLoaded]);

  useEffect(() => {
    if (!isMobile) return;
    if (!hasNewArrivalsSection) return;
    if (mobilePopupEnabled) return;

    const node = newArrivalsTriggerRef.current;
    if (!node) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setMobilePopupEnabled(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setMobilePopupEnabled(true);
          observer.disconnect();
        }
      },
      {threshold: 0.15},
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isMobile, hasNewArrivalsSection, mobilePopupEnabled]);

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
  const handleHomeAppliancesSelect = buildSelectHandler(
    setSelectedHomeAppliances,
  );

  const renderCollectionSection = ({
    menu,
    selectedItem,
    onSelect,
    fallbackTitle,
  }) => {
    const visibleMenu = menu.filter((item) => {
      const menuHandle = getHandleFromUrl(item?.url || '');
      if (!menuHandle) return false;
      if (!hasLoadedHandle(menuHandle)) return true;
      return Boolean(fullTopProducts[menuHandle]);
    });
    if (!visibleMenu.length) return null;

    const selectedHandle = getHandleFromUrl(selectedItem?.url || '');
    const resolvedSelectedItem =
      visibleMenu.find(
        (item) => getHandleFromUrl(item?.url || '') === selectedHandle,
      ) || visibleMenu[0];
    const handle = getHandleFromUrl(resolvedSelectedItem?.url || '');
    const collection = handle ? fullTopProducts[handle] : null;
    const isLoading = handle ? !!loadingHandles[handle] : false;
    const title = resolvedSelectedItem?.title || fallbackTitle || 'Collection';

    return (
      <>
        <CollectionCircles
          collections={visibleMenu}
          selectedCollection={resolvedSelectedItem}
          onCollectionSelect={onSelect}
        />
        {resolvedSelectedItem && collection ? (
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
      <MobileAppPopup enabled={mobilePopupEnabled} />
      <h1 className="home-h1 visually-hidden">
        961Souq | Leading Electronics, PC and Gaming Equipment Store in Lebanon
      </h1>

      <MosaicHero collections={heroCollections} isMobile={isMobile} />

      <Suspense
        fallback={
          <TopProductPlaceholder
            title="New Arrivals"
            handle="new-arrivals"
            count={isMobile ? 4 : 6}
          />
        }
      >
        <Await resolve={newArrivals}>
          {(resolvedNewArrivals) =>
            resolvedNewArrivals ? (
              <div ref={setNewArrivalsTriggerNode}>
                <TopProductSections collection={resolvedNewArrivals} />
              </div>
            ) : null
          }
        </Await>
      </Suspense>
      <Suspense fallback={null}>
        <Await resolve={cosmetics}>
          {(resolvedCosmetics) =>
            resolvedCosmetics ? (
              <LazyMount rootMargin="220px">
                <TopProductSections collection={resolvedCosmetics} />
              </LazyMount>
            ) : null
          }
        </Await>
      </Suspense>

      {/* RelatedProductsFromHistory temporarily disabled for testing performance */}
      {/* <RelatedProductsFromHistory key={rpKey} /> */}

      <LazyMount rootMargin="300px">
        {isMobile ? (
          <>
            {mobileLevelOneCollections.map(({id, handle, title}) => {
              const collection = hasLoadedHandle(handle)
                ? fullTopProducts[handle]
                : undefined;

              return collection ? (
                <TopProductSections
                  key={`mobile-${id}`}
                  collection={collection}
                />
              ) : collection === null ? null : (
                <TopProductPlaceholder
                  key={`mobile-${id}-placeholder`}
                  title={title}
                  handle={handle}
                  count={4}
                />
              );
            })}
          </>
        ) : (
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
      </LazyMount>

      {/* <ScrollingSVGs /> */}
      <LazyMount>
        <BrandSection brands={brandsData} />
      </LazyMount>
    </div>
  );
}
