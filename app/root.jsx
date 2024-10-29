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
} from '@remix-run/react';
import favicon from '~/assets/favicon.svg';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';
import tailwindCss from './styles/tailwind.css?url';
import { PageLayout } from '~/components/PageLayout';
import { FOOTER_QUERY, HEADER_QUERY } from '~/lib/fragments';
import { useEffect } from 'react';
import { useTransition } from '@remix-run/react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress (Optional: Disable spinner)
NProgress.configure({ showSpinner: false });

export function Layout({ children }) {
  const nonce = useNonce();
  const data = useRouteLoaderData('root');
  const transition = useTransition();

  // Start and stop NProgress on route transitions
  useEffect(() => {
    if (transition.state === 'loading') {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [transition.state]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

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

async function loadCriticalData({ context }) {
  const { storefront } = context;
  const [header] = await Promise.all([
    storefront.query(HEADER_QUERY, {
      cache: storefront.CacheLong(),
      variables: { headerMenuHandle: 'new-main-menu' },
    }),
  ]);
  return { header };
}

function loadDeferredData({ context }) {
  const { storefront, customerAccount, cart } = context;
  const footer = storefront.query(FOOTER_QUERY, {
    cache: storefront.CacheLong(),
    variables: { footerMenuHandle: 'footer' },
  }).catch((error) => {
    console.error(error);
    return null;
  });

  return {
    cart: cart.get(),
    isLoggedIn: customerAccount.isLoggedIn(),
    footer,
  };
}

export default function App() {
  return <Outlet />;
}

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
