import { useNonce, getShopAnalytics, Analytics } from '@shopify/hydrogen';
import { defer } from '@shopify/remix-oxygen';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  useRouteError,
  useRouteLoaderData,
  ScrollRestoration,
  isRouteErrorResponse,
  useNavigation,  // Added useNavigation for route tracking
} from '@remix-run/react';
import favicon from '~/assets/favicon.svg';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import { PageLayout } from '~/components/PageLayout';
import { FOOTER_QUERY, HEADER_QUERY } from '~/lib/fragments';
import { useEffect } from 'react';
import NProgress from 'nprogress';  // Import NProgress
import 'nprogress/nprogress.css';  // Import NProgress styles

// Configure NProgress (Optional: Disable spinner)
NProgress.configure({ showSpinner: true });

/**
 * This is important to avoid re-fetching root queries on sub-navigations
 * @type {ShouldRevalidateFunction}
 */
export const shouldRevalidate = ({
  formMethod,
  currentUrl,
  nextUrl,
  defaultShouldRevalidate,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return defaultShouldRevalidate;
};

export function links() {
  return [
    { rel: 'stylesheet', href: appStyles },
    { rel: 'stylesheet', href: resetStyles },
    { rel: 'stylesheet', href: tailwindCss },
    { rel: 'preconnect', href: 'https://cdn.shopify.com' },
    { rel: 'preconnect', href: 'https://shop.app' },
    { rel: 'icon', type: 'image/svg+xml', href: favicon },
  ];
}

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  const { storefront, env } = args.context;

  return defer({
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
      withPrivacyBanner: true,
      country: args.context.storefront.i18n.country,
      language: args.context.storefront.i18n.language,
    },
  });
}

/**
 * Load data necessary for rendering content above the fold.
 */
const processMenuItems = (items) => {
  return items.map((item) => ({
    ...item,
    items: item.items ? processMenuItems(item.items) : [],
  }));
};

async function loadCriticalData({ context }) {
  const { storefront } = context;
  const header = await storefront.query(HEADER_QUERY, {
    variables: { headerMenuHandle: 'new-main-menu' },
  });

  // Process nested menus
  if (header?.menu?.items) {
    header.menu.items = processMenuItems(header.menu.items);
  }

  return { header };
}

/**
 * Load data for rendering content below the fold.
 */
async function loadDeferredData({ context }) {
  const { storefront, customerAccount, cart } = context;

  // Fetch both the Shop menu and Policies menu
  const footer = await storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {
        shopMenuHandle: 'new-main-menu', // Handle for Shop menu
        policiesMenuHandle: 'footer-menu', // Handle for Policies menu
      },
    })
    .catch((error) => {
      console.error('Error fetching footer data:', error);
      return null;
    });

  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer, // Return the fetched footer data
  };
}

/**
 * Layout component for the application.
 */
export function Layout({ children }) {
  const nonce = useNonce();
  const data = useRouteLoaderData('root'); // Assuming this includes footer data
  const navigation = useNavigation();  // Use useNavigation hook

  useEffect(() => {
    if (navigation.state === 'loading') {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [navigation.state]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {data ? (
          <Analytics.Provider
            cart={data.cart}
            shop={data.shop}
            consent={data.consent}
          >
            <PageLayout
              {...data}
              footerMenu={{
                shopMenu: data.footer?.shopMenu || {}, // Ensure this is the correct structure
                policiesMenu: data.footer?.policiesMenu || {}, // Ensure this is the correct structure
              }}
            >
              {children}
            </PageLayout>
          </Analytics.Provider>
        ) : (
          <>
            {children}
          </>
        )}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
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
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error?.data?.message ?? error.data;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}


/** @typedef {LoaderReturnData} RootLoader */

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@remix-run/react').ShouldRevalidateFunction} ShouldRevalidateFunction */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
