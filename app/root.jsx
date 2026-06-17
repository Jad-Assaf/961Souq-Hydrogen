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
// import tailwindCss from './styles/tailwind.css?url';
import {PageLayout} from '~/components/PageLayout';
import {HEADER_QUERY} from '~/lib/fragments';
import {normalizeHostname, resolveCheckoutDomain} from '~/lib/shopifyAnalytics';
import React, {useEffect, useState} from 'react';
import ClarityTracker from './components/ClarityTracker';
import MetaPixel from './components/MetaPixel';
import InstantScrollRestoration from './components/InstantScrollRestoration';
import {WishlistProvider} from './lib/WishlistContext';
import {AttributionTracker} from './components/AttributionTracker';
import {getCollectionImage} from '~/lib/collectionImage';
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
const SHOPIFY_COOKIE_DOMAIN = '.961souq.com';
// const TIKTOK_PIXEL_ID = 'D0QOS83C77U6EL28VLR0';

const WEB_MCP_READ_ONLY_TOOLS_SCRIPT = `
(function () {
  if (window.__961souqWebMcpRegistered) return;

  var modelContext = document.modelContext || (window.navigator && window.navigator.modelContext);

  var categories = [
    ['Mobiles', '/collections/mobiles'],
    ['Tablets', '/collections/tablets'],
    ['Apple', '/collections/apple'],
    ['Gaming', '/collections/gaming'],
    ['Gaming Laptops', '/collections/gaming-laptops'],
    ['Business Laptops', '/collections/business-laptops'],
    ['PC Parts', '/collections/pc-parts'],
    ['Monitors', '/collections/monitors'],
    ['Networking', '/collections/networking'],
    ['Audio', '/collections/audio'],
    ['Photography', '/collections/photography'],
    ['Home Appliances', '/collections/home-appliances'],
    ['Cosmetics', '/cosmetics'],
    ['Body Care', '/collections/body-care'],
    ['Fitness', '/collections/fitness'],
    ['Accessories', '/collections/accessories']
  ];

  function clampInteger(value, fallback, min, max) {
    var number = parseInt(value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function absolutizeUrl(value) {
    if (!value) return null;
    try {
      return new URL(value, window.location.origin).toString();
    } catch (_error) {
      return null;
    }
  }

  function createToolResult(data) {
    return JSON.stringify(data, null, 2);
  }

  function describeCartAction(action) {
    switch (action) {
      case 'LinesAdd':
        return {
          name: 'add_to_cart',
          description: 'Prepares the selected 961Souq product or variant to be added to the shopping cart.'
        };
      case 'LinesUpdate':
        return {
          name: 'update_cart_qty',
          description: 'Prepares a quantity update for an existing product line in the 961Souq shopping cart.'
        };
      case 'LinesRemove':
        return {
          name: 'remove_cart_line',
          description: 'Prepares removal of an existing product line from the 961Souq shopping cart.'
        };
      case 'DiscountCodesUpdate':
        return {
          name: 'apply_discount',
          description: 'Prepares a discount code update for the 961Souq shopping cart.'
        };
      case 'GiftCardCodesUpdate':
        return {
          name: 'apply_gift_card',
          description: 'Prepares a gift card code update for the 961Souq shopping cart.'
        };
      default:
        return null;
    }
  }

  function getCartAction(form) {
    var input = form.querySelector('input[name="cartFormInput"]');
    if (!input || !input.value) return null;

    try {
      var payload = JSON.parse(input.value);
      return payload && payload.action;
    } catch (_error) {
      return null;
    }
  }

  function applyFormTool(form, name, description) {
    if (!form || form.hasAttribute('toolname')) return;
    form.setAttribute('toolname', name);
    form.setAttribute('tooldescription', description);
  }

  function annotateWebMcpForms() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function (form, index) {
      if (form.matches('.search-form')) {
        applyFormTool(
          form,
          form.querySelector('[data-typesense-search]') ? 'search_products_page_predictive' : 'search_products_page',
          'Search the 961Souq product catalog and navigate to matching product results.'
        );
        var searchInput = form.querySelector('input[type="search"], input[name="q"]');
        if (searchInput && !searchInput.hasAttribute('toolparamdescription')) {
          searchInput.setAttribute('toolparamdescription', 'Product search query, such as a brand, model, category, or accessory.');
        }
        return;
      }

      if (form.matches('.contact-form')) {
        applyFormTool(
          form,
          'prepare_customer_support_message',
          'Prepares a customer support message with name, email address, and message body for 961Souq.'
        );
        var contactName = form.querySelector('input[name="name"]');
        var contactEmail = form.querySelector('input[name="email"]');
        var contactMessage = form.querySelector('textarea[name="message"]');
        if (contactName && !contactName.hasAttribute('toolparamdescription')) {
          contactName.setAttribute('toolparamdescription', 'Customer full name.');
        }
        if (contactEmail && !contactEmail.hasAttribute('toolparamdescription')) {
          contactEmail.setAttribute('toolparamdescription', 'Customer email address for the reply.');
        }
        if (contactMessage && !contactMessage.hasAttribute('toolparamdescription')) {
          contactMessage.setAttribute('toolparamdescription', 'Message or question for 961Souq customer support.');
        }
        return;
      }

      if (form.matches('.account-logout')) {
        applyFormTool(form, 'sign_out_customer', 'Prepares signing the current customer out of their 961Souq account.');
        return;
      }

      if (form.closest('.account-profile')) {
        applyFormTool(
          form,
          'update_customer_profile',
          'Prepares updates to the current customer profile information in a 961Souq account.'
        );
        return;
      }

      if (form.querySelector('input[name="addressId"]')) {
        applyFormTool(
          form,
          'update_customer_address_' + index,
          'Prepares updates to a shipping address in the current 961Souq customer account.'
        );
        return;
      }

      var cartAction = describeCartAction(getCartAction(form));
      if (cartAction) {
        applyFormTool(form, cartAction.name + '_' + index, cartAction.description);
        var discountInput = form.querySelector('input[name="discountCode"]');
        if (discountInput && !discountInput.hasAttribute('toolparamdescription')) {
          discountInput.setAttribute('toolparamdescription', 'Discount code to apply to the cart.');
        }
        var giftCardInput = form.querySelector('input[name="giftCardCode"]');
        if (giftCardInput && !giftCardInput.hasAttribute('toolparamdescription')) {
          giftCardInput.setAttribute('toolparamdescription', 'Gift card code to apply to the cart.');
        }
        return;
      }

      if (form.matches('.product-chat-input')) {
        applyFormTool(
          form,
          'prepare_product_chat_message_' + index,
          'Prepares a product support chat message for 961Souq customer assistance.'
        );
      }
    });
  }

  async function searchProducts(input) {
    input = input || {};
    var query = String(input.query || '').trim();
    var limit = clampInteger(input.limit, 5, 1, 10);

    if (!query) {
      return createToolResult({error: 'Missing query', products: []});
    }

    var params = new URLSearchParams({
      q: query,
      perPage: String(limit),
      page: '1'
    });
    var response = await fetch('/api/typesensesearch?' + params.toString(), {
      headers: {'Accept': 'application/json'}
    });
    var data = await response.json();

    if (!response.ok) {
      return createToolResult({
        error: data && data.error ? data.error : 'Search failed',
        products: []
      });
    }

    var products = (data.hits || []).slice(0, limit).map(function (product) {
      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        price: product.price,
        available: product.available,
        image: absolutizeUrl(product.image),
        url: absolutizeUrl(product.url || ('/products/' + product.handle))
      };
    });

    return createToolResult({
      query: query,
      found: data.found || products.length,
      products: products
    });
  }

  async function getProductSummary(input) {
    input = input || {};
    var handle = String(input.handle || '').trim();

    if (!handle) {
      return createToolResult({error: 'Missing handle'});
    }

    var params = new URLSearchParams({handle: handle});
    var response = await fetch('/api/mcp-product?' + params.toString(), {
      headers: {'Accept': 'application/json'}
    });
    var data = await response.json();

    if (!response.ok) {
      return createToolResult({
        error: data && data.error ? data.error : 'Product lookup failed'
      });
    }

    return createToolResult(data);
  }

  async function getStoreNavigation() {
    var origin = window.location.origin;

    return createToolResult({
      name: '961Souq',
      home: origin + '/',
      collections: origin + '/collections',
      contact: origin + '/contact',
      policies: origin + '/policies',
      sitemap: origin + '/sitemap.xml',
      llms: origin + '/llms.txt',
      categories: categories.map(function (entry) {
        return {
          name: entry[0],
          url: origin + entry[1]
        };
      })
    });
  }

  var annotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
  };

  var tools = [
    {
      name: 'search_products',
      description: 'Search the 961Souq product catalog and return matching products with titles, handles, prices, images, and product URLs.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            minLength: 1,
            maxLength: 120,
            description: 'Product search query, such as a brand, model, or category.'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
            default: 5,
            description: 'Maximum number of products to return.'
          }
        },
        required: ['query'],
        additionalProperties: false
      },
      annotations: annotations,
      execute: searchProducts
    },
    {
      name: 'get_product_summary',
      description: 'Get read-only product details from 961Souq by product handle, including title, vendor, type, description, price range, availability, variants, and canonical URL.',
      inputSchema: {
        type: 'object',
        properties: {
          handle: {
            type: 'string',
            minLength: 1,
            maxLength: 160,
            pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]*$',
            description: 'Product handle from a 961Souq product URL.'
          }
        },
        required: ['handle'],
        additionalProperties: false
      },
      annotations: annotations,
      execute: getProductSummary
    },
    {
      name: 'get_store_navigation',
      description: 'Return key 961Souq store pages, category URLs, sitemap URL, and contact/policy URLs for navigation.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: annotations,
      execute: getStoreNavigation
    }
  ];

  if (modelContext && typeof modelContext.registerTool === 'function') {
    try {
      tools.forEach(function (tool) {
        modelContext.registerTool(tool);
      });
      window.__961souqWebMcpRegistered = true;
    } catch (_error) {
      window.__961souqWebMcpRegistered = false;
    }
  }

  annotateWebMcpForms();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', annotateWebMcpForms, {once: true});
  }
  if ('MutationObserver' in window) {
    var observer = new MutationObserver(function () {
      annotateWebMcpForms();
    });
    observer.observe(document.documentElement, {childList: true, subtree: true});
  }
})();
`;

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
  if (match) {
    return redirect(`/products/${match[1]}${url.search}`, {status: 301});
  }

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

      const image = getCollectionImage(item.resource);

      return {
        ...item,
        imageUrl: image?.url || null,
        altText: image?.altText || item.title,
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
            __html: WEB_MCP_READ_ONLY_TOOLS_SCRIPT,
          }}
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
        <AttributionTracker />
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
              cookieDomain={SHOPIFY_COOKIE_DOMAIN}
            >
              <WishlistProvider>
                <PageLayout {...data}>{children}</PageLayout>
              </WishlistProvider>
            </Analytics.Provider>
          ) : (
            <WishlistProvider>
              <PageLayout>{children}</PageLayout>
            </WishlistProvider>
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
