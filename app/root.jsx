// src/root.jsx
import appStyles from '~/styles/app.css?url';
// import fontStyles from '~/styles/fonts.css?url';
import favicon from '~/assets/961souqLogo_Cart_19e9e372-5859-44c9-8915-11b81ed78213.png';
import {useNonce, getShopAnalytics, Analytics} from '@shopify/hydrogen';
import {redirect} from '@shopify/remix-oxygen';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  useRouteError,
  useRouteLoaderData,
  ScrollRestoration,
  isRouteErrorResponse,
  useNavigation,
  data,
} from '@remix-run/react';
// import footerStyles from '~/styles/Footer.css?url';
// import productStyles from '~/styles/ProductPage.css?url';
// import productImgStyles from '~/styles/ProductImage.css?url';
// import searchStyles from '~/styles/SearchPage.css?url';
// import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from '~/components/PageLayout';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';
import React, {Suspense, useEffect, useRef, useState} from 'react';
import ClarityTracker from './components/ClarityTracker';
import MetaPixel from './components/MetaPixel';
import {SearchProvider} from './lib/searchContext.jsx';
import InstantScrollRestoration from './components/InstantScrollRestoration';
import { WishlistProvider } from './lib/WishlistContext';
// import TikTokPixel from './components/TikTokPixel';

/* -------------------- IP BLOCKING (added) -------------------- */
const BLOCKED_IPS = new Set([
  '185.187.93.210',
  '185.142.40.248',
  '185.217.84.230',
  '78.108.169.25',
  '45.67.99.13',
  '185.160.227.197',
  '185.134.178.144',
  '2001:16a2:c078:ca7d:6060:b30d:ed55:ee56', // IPv6
  '185.134.176.77',
  '185.97.94.106',
  '185.242.37.66',
  '5.100.243.242',
  '80.81.144.75',
  '82.146.183.24',
  '185.142.40.38',
  '185.217.84.252',
  '213.204.71.122',
  '91.232.101.117',
]);

function getClientIpFromHeaders(headers) {
  const cf = headers.get("cf-connecting-ip");
  const tci = headers.get("true-client-ip");
  const xri = headers.get("x-real-ip");
  const xff = headers.get("x-forwarded-for");

  const raw =
    cf ||
    tci ||
    xri ||
    (xff ? xff.split(",")[0].trim() : "") ||
    "";

  if (!raw) return null;

  // Clean possible bracketed IPv6 or IPv4:port
  const cleaned = raw.replace(/^\[|]$/g, "").trim().toLowerCase();
  const maybeIpv4WithPort = cleaned.match(
    /^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/
  );
  if (maybeIpv4WithPort) return maybeIpv4WithPort[1];
  return cleaned;
}

function blockResponse(ip) {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Forbidden</title>
  <style>
    body{margin:0;min-height:100dvh;display:grid;place-items:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial,sans-serif;background:#0b0b0b;color:#fff}
    .card{max-width:680px;width:92%;border-radius:16px;padding:28px;background:#121212;border:1px solid #2a2a2a;box-shadow:0 6px 30px rgba(0,0,0,0.35)}
    h1{font-size:28px;margin:0 0 12px}
    p{opacity:0.9;line-height:1.55;margin:0}
    .muted{opacity:0.65;margin-top:12px;font-size:14px}
    code{background:#1e1e1e;border:1px solid #333;padding:2px 6px;border-radius:6px}
  </style>
</head>
<body>
  <div class="card">
    <h1>403 — Access Forbidden</h1>
    <p>Requests from your IP are not allowed.</p>
    <p class="muted">IP: <code>${ip || "unknown"}</code></p>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 403,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
    },
  });
}

function maybeBlockIp(request) {
  try {
    let ip = getClientIpFromHeaders(request.headers);

    // Dev-only override: simulate an IP via query or header
    if (process.env.NODE_ENV !== 'production') {
      const url = new URL(request.url);
      const forced = url.searchParams.get('forceTestIp') || request.headers.get('x-test-ip');
      if (forced) ip = forced.trim().toLowerCase();
    }

    if (ip && BLOCKED_IPS.has(ip)) {
      return blockResponse(ip);
    }
  } catch (_) {
    // If anything goes wrong, don't block by default
  }
  return null;
}
/* ------------------ END IP BLOCKING (added) ------------------ */

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 * @type {ShouldRevalidateFunction}
 */
export const shouldRevalidate = ({formMethod, currentUrl, nextUrl}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

const PIXEL_ID = '459846537541051'; // Replace with your actual Pixel ID
// const TIKTOK_PIXEL_ID = 'D0QOS83C77U6EL28VLR0';

export function links() {
  return [
    // {rel: 'stylesheet', href: appStyles},
    // {rel: 'stylesheet', href: footerStyles},
    // {rel: 'stylesheet', href: productStyles},
    // {rel: 'stylesheet', href: productImgStyles},
    // {rel: 'stylesheet', href: searchStyles},
    // {rel: 'stylesheet', href: tailwindCss},
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    {rel: 'preconnect', href: 'https://shop.app'},
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
    {rel: 'alternate', hrefLang: 'en-LB', href: 'https://961souq.com/'},
    {rel: 'alternate', hrefLang: 'en', href: 'https://961souq.com/'},
    {rel: 'alternate', hrefLang: 'x-default', href: 'https://961souq.com/'},
  ];
}

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader({request, context}) {
  // IP block (added)
  const __blocked = maybeBlockIp(request);
  if (__blocked) throw __blocked;

  // 1) Legacy URL redirect
  const url = new URL(request.url);
  const pathname = url.pathname;
  const match = pathname.match(/^\/collections\/[^/]+\/products\/(.+)/);
  const cart = await context.cart.get(); // includes totalQuantity
  if (match) {
    const productSlug = match[1];
    return redirect(`/products/${productSlug}`, {status: 301});
  }

  try {
    const deferredData = await loadDeferredData({request, context});
    const criticalData = await loadCriticalData({request, context});
    const {storefront, env} = context;

    const session = context.session;
    const headers = new Headers();
    headers.append('Set-Cookie', await session.commit());

    // ↙ add these two lines
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-Content-Type-Options', 'nosniff');

    return data(
      {
        ...deferredData,
        ...criticalData,
        publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
        shop: getShopAnalytics({
          storefront,
          publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
        }),
        consent: {
          checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
          storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
          country: storefront.i18n.country,
          language: storefront.i18n.language,
        },
        cart,
      },
      {headers},
    );
  } catch (error) {
    console.error('Loader error:', error);
    // include headers on error responses too
    return new Response('Failed to load data', {
      status: 500,
      headers: SECURITY_HEADERS,
    });
  }
}

/**
 * Load data necessary for rendering content above the fold.
 */
const processMenuItems = (items) => {
  return items.map((item) => ({
    ...item,
    imageUrl: item.resource?.image?.src || null, // Extract image URL if available
    altText: item.resource?.image?.altText || item.title, // Use altText or fallback to title
    items: item.items ? processMenuItems(item.items) : [], // Recursively process submenus
  }));
};

async function loadCriticalData({context}) {
  const {storefront} = context;

  try {
    // Fetch header data using the HEADER_QUERY
    // --- ADDED: cache: storefront.CacheLong() ---
    const header = await storefront.query(HEADER_QUERY, {
      variables: {headerMenuHandle: 'new-main-menu'},
      cache: storefront.CacheLong(), // <-- This is the key performance-related change
    });

    // Process nested menus to extract images
    if (header?.menu?.items) {
      header.menu.items = processMenuItems(header.menu.items);
    }

    return {header};
  } catch (error) {
    return {header: null}; // Fallback in case of error
  }
}

/**
 * Load data for rendering content below the fold.
 */
function loadDeferredData({context}) {
  const {storefront, customerAccount, cart} = context;

  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
  };
}

/**
 * Layout component for the application.
 */
export function Layout({children}) {
  const nonce = useNonce();
  const data = useRouteLoaderData('root');
  const navigation = useNavigation();
  const [nprogress, setNProgress] = useState(null); // Store NProgress instance
  const clarityId = 'q97botmzx1'; // Replace with your Clarity project ID

  const [stylesLoaded, setStylesLoaded] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const loaderRef = useRef(null);
  const animationRef = useRef(null);
  const isLoading = navigation.state !== 'idle';

  // useEffect(() => {
  //   // Only run on client
  //   if (typeof document === 'undefined') return;
  //
  //   // Check if styles are already loaded
  //   const stylesheetUrls = [
  //     appStyles,
  //     // footerStyles,
  //     // productStyles,
  //     // productImgStyles,
  //     // searchStyles,
  //   ];
  //
  //   // Function to check if stylesheets are loaded
  //   const areStylesLoaded = () => {
  //     return stylesheetUrls.every((href) => {
  //       return Array.from(document.styleSheets).some(
  //         (sheet) => sheet.href === new URL(href, window.location.href).href,
  //       );
  //     });
  //   };
  //
  //   if (areStylesLoaded()) {
  //     setStylesLoaded(true);
  //     return;
  //   }
  //
  //   // Set up load event listeners
  //   const loadPromises = stylesheetUrls.map((href) => {
  //     return new Promise((resolve) => {
  //       const link = document.querySelector(`link[href="${href}"]`);
  //       if (link) {
  //         if (link.sheet) resolve(); // Already loaded
  //         else link.addEventListener('load', resolve);
  //       } else {
  //         resolve(); // Not found, skip
  //       }
  //     });
  //   });
  //
  //   // Wait for all stylesheets to load or timeout
  //   const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
  //
  //   Promise.race([Promise.all(loadPromises), timeout])
  //     .then(() => setStylesLoaded(true))
  //     .catch(() => setStylesLoaded(true)); // Fail safe
  //
  //   return () => {
  //     // Clean up event listeners
  //     stylesheetUrls.forEach((href) => {
  //       const link = document.querySelector(`link[href="${href}"]`);
  //       if (link) link.removeEventListener('load', loadPromises);
  //     });
  //   };
  // }, []);

  // Handle loader fade-out animation
  useEffect(() => {
    if (!stylesLoaded || !loaderRef.current) return;

    // Start fade out animation
    loaderRef.current.style.opacity = '0';

    // Remove loader after animation completes
    animationRef.current = setTimeout(() => {
      setLoaderVisible(false);
    }, 500);

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [stylesLoaded]);

  useEffect(() => {
    // Load NProgress once and set it in the state
    const loadNProgress = async () => {
      const {default: NProgress} = await import('nprogress');
      await import('nprogress/nprogress.css');
      NProgress.configure({showSpinner: true});
      setNProgress(NProgress); // Set NProgress once it's loaded
    };

    if (!nprogress) {
      loadNProgress(); // Only load NProgress the first time
    }

    // Handle the route loading state
    if (navigation.state === 'loading' && nprogress) {
      nprogress.start(); // Start progress bar
    } else if (nprogress) {
      nprogress.done(); // Finish progress bar
    }

    return () => {
      // Clean up NProgress when component unmounts or state changes
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
        <link rel="stylesheet" href={appStyles}></link>
        {/* <link rel="stylesheet" href={fontStyles}></link> */}
        <Meta />
        <Links />
        {nonce ? (
          <>
            <script
              defer
              nonce={nonce}
              src="https://www.googletagmanager.com/gtag/js?id=G-CB623RXLSE"
            ></script>
            <script
              defer
              nonce={nonce}
              dangerouslySetInnerHTML={{
                __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-CB623RXLSE');
        `,
              }}
            ></script>
            <script
              defer
              nonce={nonce}
              src="https://www.googletagmanager.com/gtag/js?id=AW-378354284"
            ></script>
            <script
              defer
              nonce={nonce}
              dangerouslySetInnerHTML={{
                __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-378354284');
        `,
              }}
            ></script>
          </>
        ) : null}
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
              src={favicon}
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
        {nonce ? <Scripts nonce={nonce} /> : <Scripts />}
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

  // Common error page styling
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '70vh',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    color: '#333',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  };

  const titleStyle = {
    fontSize: '6rem',
    fontWeight: 'bold',
    margin: '0 0 10px',
    color: '#232323',
  };

  const messageStyle = {
    fontSize: '1.5rem',
    marginBottom: '20px',
  };

  const linkStyle = {
    fontSize: '1rem',
    color: '#232323',
    textDecoration: 'none',
    padding: '10px 20px',
    border: '1px solid #232323',
    borderRadius: '30px',
    transition: 'background-color 0.3s, color 0.3s',
  };

  const handleMouseEnter = (e) => {
    e.target.style.backgroundColor = '#232323';
    e.target.style.color = '#fff';
  };

  const handleMouseLeave = (e) => {
    e.target.style.backgroundColor = '#fff';
    e.target.style.color = '#232323';
  };

  // Render the error page with appropriate status and message
  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>{errorStatus}</h1>
      <p style={messageStyle}>{errorMessage}</p>
      <a
        href="/"
        style={linkStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        Go to Homepage
      </a>
    </div>
  );
}

/** @typedef {LoaderReturnData} RootLoader */
/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@remix-run/react').ShouldRevalidateFunction} ShouldRevalidateFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
