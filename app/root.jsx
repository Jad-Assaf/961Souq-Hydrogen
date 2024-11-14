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
import { Footer } from './components/Footer';

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
/**
 * Loader Function
 */
export async function loader(args) {
  const criticalData = await loadCriticalData(args);
  const deferredData = await loadDeferredData(args);

  const { storefront, env } = args.context;

  return defer({
    ...criticalData,
    ...deferredData,
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
 * Load Critical Data
 * Fetch data necessary for rendering above-the-fold content.
 */
async function loadCriticalData({ context }) {
  const { storefront } = context;

  const query = `
    query getHeaderMenu($headerHandle: String!) {
      headerMenu: menu(handle: $headerHandle) {
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
  `;

  const variables = {
    headerHandle: "new-main-menu",
  };

  const { data } = await storefront.query(query, { variables });

  // Process and return headerMenu
  const headerMenu = data.headerMenu || { items: [] };
  return { header: { menu: headerMenu } };
}

/**
 * Load Deferred Data
 * Fetch data necessary for rendering below-the-fold content.
 */
async function loadDeferredData({ context }) {
  const { storefront, cart, customerAccount } = context;

  const query = `
    query getFooterMenu($footerHandle: String!) {
      footerMenu: menu(handle: $footerHandle) {
        items {
          id
          title
          url
        }
      }
    }
  `;

  const variables = {
    footerHandle: "Footer-Menu1",
  };

  const { data } = await storefront.query(query, { variables });

  // Process and return footerMenu, cart, and isLoggedIn status
  const footerMenu = data.footerMenu || { items: [] };
  return {
    footerMenu,
    cart: await cart.get(),
    isLoggedIn: await customerAccount.isLoggedIn(),
  };
}
/**
 * Layout component for the application.
 */
export function Layout({ children }) {
  const nonce = useNonce();
  const data = useRouteLoaderData('root');
  const navigation = useNavigation();  // Use useNavigation hook

  // Manage NProgress on route transitions
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
            <PageLayout {...data}>{children}</PageLayout>
          </Analytics.Provider>
        ) : (
          children
        )}
        <Footer />
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
