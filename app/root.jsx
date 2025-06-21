// src/root.jsx
import appStyles from '~/styles/app.css?url';
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
// import TikTokPixel from './components/TikTokPixel';

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 * @type {ShouldRevalidateFunction}
 */
export const shouldRevalidate = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

const PIXEL_ID = '459846537541051'; // Replace with your actual Pixel ID
// const TIKTOK_PIXEL_ID = 'D0QOS83C77U6EL28VLR0';

export function links() {
  return [
    {rel: 'stylesheet', href: appStyles},
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
  // Implement the redirect for legacy URLs:
  const url = new URL(request.url);
  const pathname = url.pathname;
  const match = pathname.match(/^\/collections\/[^/]+\/products\/(.+)/);
  if (match) {
    const productSlug = match[1];
    return redirect(`/products/${productSlug}`, {status: 301});
  }

  try {
    const deferredData = await loadDeferredData({request, context});
    const criticalData = await loadCriticalData({request, context});
    const {storefront, env} = context;

    return data({
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
    });
  } catch (error) {
    console.error('Loader error:', error);
    throw new Response('Failed to load data', {status: 500});
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

  // useEffect(() => {
  //   // Only run on client
  //   if (typeof document === 'undefined') return;

  //   // Check if styles are already loaded
  //   const stylesheetUrls = [
  //     appStyles,
  //     // footerStyles,
  //     // productStyles,
  //     // productImgStyles,
  //     // searchStyles,
  //   ];

  //   // Function to check if stylesheets are loaded
  //   const areStylesLoaded = () => {
  //     return stylesheetUrls.every((href) => {
  //       return Array.from(document.styleSheets).some(
  //         (sheet) => sheet.href === new URL(href, window.location.href).href,
  //       );
  //     });
  //   };

  //   if (areStylesLoaded()) {
  //     setStylesLoaded(true);
  //     return;
  //   }

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

  //   // Wait for all stylesheets to load or timeout
  //   const timeout = new Promise((resolve) => setTimeout(resolve, 3000));

  //   Promise.race([Promise.all(loadPromises), timeout])
  //     .then(() => setStylesLoaded(true))
  //     .catch(() => setStylesLoaded(true)); // Fail safe

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
        {data ? (
          <Analytics.Provider
            cart={data.cart}
            shop={data.shop}
            consent={data.consent}
          >
            <SearchProvider>
              <PageLayout {...data}>{children}</PageLayout>
            </SearchProvider>
          </Analytics.Provider>
        ) : (
          children
        )}
        <ScrollRestoration nonce={nonce} />
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
