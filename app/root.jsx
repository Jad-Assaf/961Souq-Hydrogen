// src/root.jsx
import appStyles from '~/styles/app.css?url';
import appStylesInline from '~/styles/app.css?raw';
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
import {WishlistProvider} from './lib/WishlistContext';
import RespondIOWidget from './components/RespondIOWidget';
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
    {rel: 'preconnect', href: 'https://shop.app'},
    {
      rel: 'icon',
      type: 'image/png',
      href: 'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/newfavicon961.png?v=1772199150',
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

  const [cart, isLoggedIn, header] = await Promise.all([
    context.cart.get(),
    customerAccount.isLoggedIn(),
    storefront.query(HEADER_QUERY, {
      variables: {headerMenuHandle: 'new-main-menu'},
      cache: storefront.CacheLong(),
    }),
  ]);

  if (header?.menu?.items)
    header.menu.items = processMenuItems(header.menu.items);

  const headers = new Headers();
  headers.append('Set-Cookie', await session.commit());
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');

  return data(
    {
      header,
      cart,
      isLoggedIn,
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
    },
    {headers},
  );
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
  const inlineAppStyles =
    typeof document === 'undefined'
      ? appStylesInline
      : document.getElementById('app-styles-inline')?.textContent ||
        appStylesInline;
  const stableNonce =
    nonce ||
    (typeof document !== 'undefined'
      ? document.querySelector('script[nonce]')?.getAttribute('nonce') ||
        document.querySelector('style[nonce]')?.getAttribute('nonce') ||
        undefined
      : undefined);

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
        <style id="app-styles-inline" suppressHydrationWarning>
          {inlineAppStyles}
        </style>
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
              src="https://cdn.shopify.com/s/files/1/0552/0883/7292/files/newfavicon961.png?v=1772199150"
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

function TicTacToeGame() {
  const WIN_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const [board, setBoard] = useState(Array(9).fill(null));
  const [current, setCurrent] = useState('X');
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [playerWins, setPlayerWins] = useState(0);
  const [aiWins, setAiWins] = useState(0);
  const [draws, setDraws] = useState(0);

  const getWinner = (nextBoard, symbol) => {
    for (const [a, b, c] of WIN_LINES) {
      if (
        nextBoard[a] === symbol &&
        nextBoard[b] === symbol &&
        nextBoard[c] === symbol
      ) {
        return true;
      }
    }
    return false;
  };

  const getBestAiMove = (nextBoard) => {
    const available = nextBoard
      .map((cell, index) => (cell ? -1 : index))
      .filter((index) => index !== -1);

    for (const index of available) {
      const testBoard = [...nextBoard];
      testBoard[index] = 'O';
      if (getWinner(testBoard, 'O')) return index;
    }

    for (const index of available) {
      const testBoard = [...nextBoard];
      testBoard[index] = 'X';
      if (getWinner(testBoard, 'X')) return index;
    }

    if (available.includes(4)) return 4;

    const corners = [0, 2, 6, 8].filter((index) => available.includes(index));
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }

    return available[Math.floor(Math.random() * available.length)];
  };

  const requestAiMove = async (boardSnapshot) => {
    const res = await fetch('/api/minigame-ai', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({board: boardSnapshot}),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to get AI move');
    }

    const move = data?.move;
    if (!Number.isInteger(move) || move < 0 || move > 8) {
      throw new Error('Invalid AI move');
    }

    return move;
  };

  const onCellClick = (index) => {
    if (current !== 'X' || board[index] || winner || isDraw) return;

    const nextBoard = [...board];
    nextBoard[index] = 'X';
    setBoard(nextBoard);

    if (getWinner(nextBoard, 'X')) {
      setWinner('X');
      setPlayerWins((prev) => prev + 1);
      return;
    }

    const filled = nextBoard.every(Boolean);
    if (filled) {
      setIsDraw(true);
      setDraws((prev) => prev + 1);
      return;
    }

    setCurrent('O');
  };

  useEffect(() => {
    if (current !== 'O' || winner || isDraw) return;

    let cancelled = false;
    const snapshot = [...board];
    const snapshotKey = snapshot.map((cell) => cell || '-').join('|');

    const playAiTurn = async () => {
      await new Promise((resolve) => setTimeout(resolve, 280));

      let move = null;
      try {
        move = await requestAiMove(snapshot);
      } catch {
        move = getBestAiMove(snapshot);
      }

      if (cancelled) return;

      setBoard((prevBoard) => {
        const prevKey = prevBoard.map((cell) => cell || '-').join('|');
        if (prevKey !== snapshotKey) return prevBoard;

        let nextMove = move;
        if (
          !Number.isInteger(nextMove) ||
          nextMove < 0 ||
          nextMove > 8 ||
          prevBoard[nextMove]
        ) {
          nextMove = getBestAiMove(prevBoard);
        }

        if (!Number.isInteger(nextMove) || prevBoard[nextMove]) {
          return prevBoard;
        }

        const nextBoard = [...prevBoard];
        nextBoard[nextMove] = 'O';

        if (getWinner(nextBoard, 'O')) {
          setWinner('O');
          setAiWins((prev) => prev + 1);
          return nextBoard;
        }

        const filled = nextBoard.every(Boolean);
        if (filled) {
          setIsDraw(true);
          setDraws((prev) => prev + 1);
          return nextBoard;
        }

        setCurrent('X');
        return nextBoard;
      });
    };

    playAiTurn();

    return () => {
      cancelled = true;
    };
  }, [board, current, winner, isDraw]);

  useEffect(() => {
    if (winner || isDraw) {
      setCurrent('X');
    }
  }, [winner, isDraw]);

  const getStatusText = () => {
    if (winner === 'X') return 'You win';
    if (winner === 'O') return 'AI wins';
    if (isDraw) return 'Draw game';
    if (current === 'O') return 'AI is thinking...';
    return 'Your turn';
  };

  const newBoard = () => {
    setBoard(Array(9).fill(null));
    setCurrent('X');
    setWinner(null);
    setIsDraw(false);
  };

  const resetAll = () => {
    newBoard();
    setPlayerWins(0);
    setAiWins(0);
    setDraws(0);
  };

  return (
    <div className="notfound-game__panel">
      <div className="notfound-game__stats">
        <span>You: {playerWins}</span>
        <span>AI: {aiWins}</span>
        <span>Draws: {draws}</span>
      </div>

      <p className="notfound-game__helper">{getStatusText()}</p>

      <div className="notfound-game__tictac-grid" role="grid" aria-label="Tic tac toe board">
        {board.map((cell, index) => (
          <button
            key={index}
            type="button"
            className="notfound-game__tictac-cell"
            onClick={() => onCellClick(index)}
            disabled={Boolean(cell) || Boolean(winner) || isDraw || current === 'O'}
            aria-label={`Cell ${index + 1}`}
          >
            {cell}
          </button>
        ))}
      </div>

      <div className="notfound-game__input-row">
        <button type="button" className="notfound-game__submit" onClick={newBoard}>
          New Board
        </button>
        <button type="button" className="notfound-game__start" onClick={resetAll}>
          Reset Match
        </button>
      </div>
    </div>
  );
}

function NotFoundMiniGame() {
  return (
    <section className="notfound-game" aria-label="404 mini game">
      <h3 className="notfound-game__title">Tic-Tac-Toe Challenge</h3>
      <TicTacToeGame />
    </section>
  );
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

        {isNotFound ? <NotFoundMiniGame /> : null}

        <div className="error-card__actions">
          <a href="/" className="error-card__button error-card__button--primary">
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
