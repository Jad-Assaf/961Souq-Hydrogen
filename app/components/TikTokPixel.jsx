// /app/components/TikTokPixel.jsx
import {useNonce} from '@shopify/hydrogen';
import {useEffect} from 'react';
import {useLocation} from '@remix-run/react';

/**
 * TikTok Pixel wrapper
 * @param {{pixelId: string}} props
 */
export default function TikTokPixel({pixelId}) {
  const nonce = useNonce();
  const location = useLocation(); // Detect route changes in Remix/Hydrogen

  /* ------------------------------------------------------------------ */
  /* 1. Load the pixel once                                              */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!pixelId || window.ttq) return; // Already loaded?
    (function (w, d, t, id) {
      w.TiktokAnalyticsObject = t;
      const ttq = (w[t] = w[t] || []);
      ttq.methods = [
        'page',
        'track',
        'identify',
        'instances',
        'debug',
        'on',
        'off',
        'once',
        'ready',
        'alias',
        'group',
        'enableCookie',
      ];
      ttq.setAndDefer = function (obj, method) {
        obj[method] = function () {
          obj.push([method].concat([].slice.call(arguments)));
        };
      };
      ttq.methods.forEach((m) => ttq.setAndDefer(ttq, m));
      ttq.load = function (pid, opts) {
        const js = d.createElement('script');
        js.type = 'text/javascript';
        js.async = true;
        js.src =
          'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' +
          pid +
          '&lib=' +
          t;
        const first = d.getElementsByTagName('script')[0];
        first.parentNode.insertBefore(js, first);
        ttq._i = ttq._i || {};
        ttq._i[pid] = [];
        ttq._t = ttq._t || {};
        ttq._t[pid] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[pid] = opts || {};
      };
      ttq.load(id);
      ttq.page(); // First page view
    })(window, document, 'ttq', pixelId);
  }, [pixelId]);

  /* ------------------------------------------------------------------ */
  /* 2. Fire page-view on every client-side navigation                  */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (window.ttq) window.ttq.page();
  }, [location.pathname]);

  /* ------------------------------------------------------------------ */
  /* 3. Delegate AddToCart / Search click tracking                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!window.ttq) return;

    const handler = (e) => {
      const el = e.target.closest('button, a, input[type="submit"]');
      if (!el) return;

      const label = (
        el.getAttribute('data-tt-event') ||
        el.getAttribute('aria-label') ||
        el.name ||
        el.id ||
        el.textContent ||
        ''
      ) // empty string fallback
        .toLowerCase();

      if (
        label.includes('add to cart') ||
        label.includes('addtocart') ||
        label.includes('add_cart')
      ) {
        window.ttq.track('AddToCart');
      } else if (label.includes('search')) {
        window.ttq.track('Search');
      }
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  /* nothing visible to render */
  return (
    <script
      nonce={nonce}
      // empty element so React keeps this component in the tree
    />
  );
}
