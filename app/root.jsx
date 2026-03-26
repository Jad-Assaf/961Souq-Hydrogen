// src/root.jsx
import appStyles from '~/styles/app.css?url';
import {useNonce, getShopAnalytics, Analytics} from '@shopify/hydrogen';
import {defer, redirect} from '@shopify/remix-oxygen';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  useRouteError,
  useRouteLoaderData,
  isRouteErrorResponse,
  useNavigation,
} from '@remix-run/react';
// import footerStyles from '~/styles/Footer.css?url';
// import productStyles from '~/styles/ProductPage.css?url';
// import productImgStyles from '~/styles/ProductImage.css?url';
// import searchStyles from '~/styles/SearchPage.css?url';
// import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from '~/components/PageLayout';
import {HEADER_QUERY} from '~/lib/fragments';
import {
  getAnalyticsCookieDomain,
  normalizeHostname,
  resolveCheckoutDomain,
} from '~/lib/shopifyAnalytics';
import React, {useEffect, useState} from 'react';
import ClarityTracker from './components/ClarityTracker';
import MetaPixel from './components/MetaPixel';
import {SearchProvider} from './lib/searchContext.jsx';
import InstantScrollRestoration from './components/InstantScrollRestoration';
import {WishlistProvider} from './lib/WishlistContext';
// import TikTokPixel from './components/TikTokPixel';

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 * @type {ShouldRevalidateFunction}
 */
export const shouldRevalidate = ({formMethod, defaultShouldRevalidate}) => {
  if (formMethod && formMethod !== 'GET') return true;
  return defaultShouldRevalidate;
};

const PIXEL_ID = '459846537541051'; // Replace with your actual Pixel ID
const GOOGLE_ANALYTICS_ID = 'G-CB623RXLSE';
const GOOGLE_ADS_ID = 'AW-378354284';
// const TIKTOK_PIXEL_ID = 'D0QOS83C77U6EL28VLR0';

export function links() {
  return [
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    // {rel: 'preconnect', href: 'https://shop.app'},
    {
      rel: 'icon',
      type: 'image/webp',
      href: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/newfavicon961.png?v=1772199150&format=webp',
    },
  ];
}

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/collections\/[^/]+\/products\/(.+)/);
  if (match) return redirect(`/products/${match[1]}`, {status: 301});

  const {storefront, env, session, customerAccount} = context;
  const checkoutDomain = resolveCheckoutDomain(
    env.PUBLIC_CHECKOUT_DOMAIN,
    request.url,
  );
  const cartPromise = context.cart.get().catch(() => null);
  const isLoggedInPromise = customerAccount.isLoggedIn().catch(() => false);

  const header = await storefront.query(HEADER_QUERY, {
    variables: {headerMenuHandle: 'new-main-menu'},
    cache: storefront.CacheLong(),
  });

  if (header?.menu?.items)
    header.menu.items = processMenuItems(header.menu.items);

  const headers = new Headers();
  headers.append('Set-Cookie', await session.commit());
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');

  return defer(
    {
      header,
      cart: cartPromise,
      isLoggedIn: isLoggedInPromise,
      storefrontHost: normalizeHostname(request.url),
      publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
      shop: getShopAnalytics({
        storefront,
        publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
      }),
      consent: {
        checkoutDomain,
        storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
    },
    {headers},
  );
}

/**
 * Load data necessary for rendering content above the fold.
 */
const processMenuItems = (items) => {
  return (items || [])
    .map((item) => {
      const nextItems = item.items ? processMenuItems(item.items) : [];

      return {
        ...item,
        imageUrl:
          item.resource?.image?.url || item.resource?.image?.src || null,
        altText: item.resource?.image?.altText || item.title,
        items: nextItems,
      };
    })
    .filter(Boolean);
};

/**
 * Layout component for the application.
 */
export function Layout({children}) {
  const nonce = useNonce();
  const data = useRouteLoaderData('root');
  const navigation = useNavigation();
  const [nprogress, setNProgress] = useState(null); // Store NProgress instance
  const clarityId = 'q97botmzx1'; // Replace with your Clarity project ID

  const isLoading = navigation.state !== 'idle';
  const analyticsCookieDomain = getAnalyticsCookieDomain(
    data?.storefrontHost,
    data?.consent?.checkoutDomain,
  );
  const stableNonce =
    nonce ||
    (typeof document !== 'undefined'
      ? document.querySelector('script[nonce]')?.getAttribute('nonce') ||
        document.querySelector('style[nonce]')?.getAttribute('nonce') ||
        undefined
      : undefined);

  useEffect(() => {
    if (navigation.state !== 'loading' || nprogress) return;

    let active = true;
    const loadNProgress = async () => {
      const {default: NProgress} = await import('nprogress');
      await import('nprogress/nprogress.css');
      if (!active) return;
      NProgress.configure({showSpinner: true});
      NProgress.start();
      setNProgress(NProgress);
    };

    loadNProgress();
    return () => {
      active = false;
    };
  }, [navigation.state, nprogress]);

  useEffect(() => {
    if (!nprogress) return;
    if (navigation.state === 'loading' && nprogress) {
      nprogress.start();
    } else if (nprogress) {
      nprogress.done();
    }

    return () => {
      if (nprogress) {
        nprogress.done();
      }
    };
  }, [navigation.state, nprogress]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,viewport-fit=cover"
        />
        <meta
          name="google-site-verification"
          content="GTiDuRqJ-vKIEfPSdkUrLXpHe2bUWWmAt2jrBHhKQt0"
        />
        <script
          nonce={stableNonce}
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var nav = window.navigator || {};
                  var connection =
                    nav.connection || nav.mozConnection || nav.webkitConnection;

                  var lowCpu =
                    typeof nav.hardwareConcurrency === 'number' &&
                    nav.hardwareConcurrency > 0 &&
                    nav.hardwareConcurrency <= 4;

                  var lowRam =
                    typeof nav.deviceMemory === 'number' &&
                    nav.deviceMemory > 0 &&
                    nav.deviceMemory <= 4;

                  var saveData = Boolean(connection && connection.saveData);
                  var reducedMotion =
                    typeof window.matchMedia === 'function' &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

                  if (lowCpu || lowRam || saveData || reducedMotion) {
                    document.documentElement.classList.add('reduced-glass');
                    document.documentElement.setAttribute(
                      'data-performance-tier',
                      'low',
                    );
                  }
                } catch (_e) {}
              })();
            `,
          }}
        />
        <link rel="stylesheet" href={appStyles}></link>
        {/* <link rel="stylesheet" href={fontStyles}></link> */}
        <Meta />
        <Links />
        <script
          nonce={stableNonce}
          dangerouslySetInnerHTML={{
            __html: `
          (function () {
            var gtagIds = ['${GOOGLE_ANALYTICS_ID}', '${GOOGLE_ADS_ID}'];
            var initialized = false;
            var interactionEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];

            function removeInteractionListeners() {
              for (var i = 0; i < interactionEvents.length; i++) {
                window.removeEventListener(interactionEvents[i], onFirstInteraction);
              }
            }

            function initializeAnalytics() {
              if (initialized) return;
              initialized = true;

              removeInteractionListeners();

              window.dataLayer = window.dataLayer || [];
              window.gtag = window.gtag || function () {
                window.dataLayer.push(arguments);
              };

              window.gtag('js', new Date());
              for (var i = 0; i < gtagIds.length; i++) {
                window.gtag('config', gtagIds[i]);
              }

              var script = document.createElement('script');
              script.async = true;
              script.src =
                'https://www.googletagmanager.com/gtag/js?id=' +
                encodeURIComponent(gtagIds[0]);
              document.head.appendChild(script);
            }

            function onFirstInteraction() {
              initializeAnalytics();
            }

            function addInteractionListeners() {
              for (var i = 0; i < interactionEvents.length; i++) {
                window.addEventListener(interactionEvents[i], onFirstInteraction, {
                  once: true,
                  passive: true,
                });
              }
            }

            function scheduleAnalyticsInit() {
              if ('requestIdleCallback' in window) {
                window.requestIdleCallback(initializeAnalytics, {timeout: 4000});
                return;
              }

              window.setTimeout(initializeAnalytics, 2500);
            }

            addInteractionListeners();

            if (document.readyState === 'complete') {
              scheduleAnalyticsInit();
            } else {
              window.addEventListener('load', scheduleAnalyticsInit, {once: true});
            }
          })();
        `,
          }}
        ></script>
        <MetaPixel pixelId={PIXEL_ID} />
        {/* <TikTokPixel pixelId={TIKTOK_PIXEL_ID} /> */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root { --route-fade-duration: 220ms; }

              #route-fade {
                opacity: 1;
                transition: opacity var(--route-fade-duration) ease-in-out;
                will-change: opacity;
              }

              #route-fade[data-loading="true"] {
                opacity: 0;                 /* full fade-out during navigation */
                pointer-events: none;       /* avoids clicks during transition */
              }

              @media (prefers-reduced-motion: reduce) {
                #route-fade { transition: none; }
              }
              `,
          }}
        />
      </head>
      <body>
        <ClarityTracker clarityId={clarityId} />
        {/* {loaderVisible && (
          <div
            ref={loaderRef}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              transition: 'opacity 0.3s ease-in-out',
              opacity: 1,
            }}
          >
            <img
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/newfavicon961.png?v=1772199150&format=webp"
              alt="Loading"
              width="80"
              height="80"
              style={{
                animation: 'pulse 2s infinite',
              }}
            />
            <style>{`
              @keyframes pulse {
                0% { transform: scale(0.95); }
                50% { transform: scale(1.05); }
                100% { transform: scale(0.95); }
              }
            `}</style>
          </div>
        )} */}
        <div id="route-fade" data-loading={isLoading}>
          {data ? (
            <Analytics.Provider
              cart={data.cart}
              shop={data.shop}
              consent={data.consent}
              cookieDomain={analyticsCookieDomain}
            >
              <SearchProvider>
                <WishlistProvider>
                  <PageLayout {...data}>{children}</PageLayout>
                </WishlistProvider>
              </SearchProvider>
            </Analytics.Provider>
          ) : (
            <SearchProvider>
              <WishlistProvider>
                <PageLayout>{children}</PageLayout>
              </WishlistProvider>
            </SearchProvider>
          )}
        </div>
        <InstantScrollRestoration />
        {/* <ScrollRestoration nonce={nonce} /> */}
        <Scripts nonce={stableNonce} />
        {/* This site is converting visitors into subscribers and customers with https://respond.io */}
        {/* <RespondIOWidget /> */}
        {/* https://respond.io */}
      </body>
    </html>
  );
}

/**
 * Main app component rendering the current route.
 */
export default function App() {
  return <Outlet />;
}

/**
 * Error boundary component for catching route errors.
 */
export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'An unexpected error occurred.';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data?.message || 'Route error occurred.';
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error) {
    errorMessage = String(error);
  }

  console.error('ErrorBoundary caught an error:', {
    error,
    errorMessage,
    errorStatus,
  });

  const isNotFound = errorStatus === 404;

  return (
    <div className="error-page">
      <section className="error-card" aria-labelledby="error-title">
        <p className="error-card__status">{isNotFound ? '404' : errorStatus}</p>
        <h1 id="error-title" className="error-card__title">
          {isNotFound ? 'Page Not Found' : 'Something Went Wrong'}
        </h1>
        <p className="error-card__message">
          {isNotFound
            ? "The page you're looking for doesn't exist or may have been moved."
            : errorMessage}
        </p>

        <div className="error-card__actions">
          <a
            href="/"
            className="error-card__button error-card__button--primary"
          >
            Go to Homepage
          </a>
          {isNotFound ? (
            <a
              href="/collections"
              className="error-card__button error-card__button--secondary"
            >
              Browse Collections
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}

/** @typedef {LoaderReturnData} RootLoader */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@remix-run/react').ShouldRevalidateFunction} ShouldRevalidateFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
