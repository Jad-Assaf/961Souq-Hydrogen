import {useNonce} from '@shopify/hydrogen';
import {useEffect} from 'react';
import {useLocation} from '@remix-run/react';

/* ------------------------------------------------------------------ */
/* helpers                                                            */
/* ------------------------------------------------------------------ */

/** Strongly-unique ID for every event fire (TikTok deduplication) */
const genEventId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;

/** Try to pull a product/variant ID off the clicked element */
const getContentId = (el) =>
  el?.dataset?.ttContentId || el?.dataset?.productId || el?.dataset?.variantId;

/* ------------------------------------------------------------------ */
/* TikTok Pixel wrapper                                               */
/* ------------------------------------------------------------------ */

export default function TikTokPixel({pixelId}) {
  const nonce = useNonce();
  const location = useLocation(); // detects SPA navigation changes

  /* 1️⃣ bootstrap the pixel once ------------------------------------ */
  useEffect(() => {
    if (!pixelId || window.ttq) return; // already loaded?

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
      ttq.setAndDefer = (obj, m) => (obj[m] = (...a) => obj.push([m, ...a]));
      ttq.methods.forEach((m) => ttq.setAndDefer(ttq, m));
      ttq.load = (pid, opts) => {
        const s = d.createElement('script');
        s.async = true;
        s.src =
          'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' +
          pid +
          '&lib=' +
          t;
        d.getElementsByTagName('script')[0].parentNode.insertBefore(s, null);
        ttq._i = ttq._i || {};
        ttq._i[pid] = [];
        ttq._t = ttq._t || {};
        ttq._t[pid] = +new Date();
        ttq._o = ttq._o || {};
        ttq._o[pid] = opts || {};
      };
      ttq.load(id);
    })(window, document, 'ttq', pixelId);
  }, [pixelId]);

  /* 2️⃣ send a single PageView per pathname ------------------------- */
  useEffect(() => {
    if (!window.ttq) return;

    const currentPath = location.pathname;

    /* global guard to stop duplicates (Strict-mode double-mount) */
    if (window.__tt_last_pageview_path === currentPath) return;

    window.__tt_last_pageview_path = currentPath;

    window.ttq.page({event_id: genEventId()}); // fires TikTok PageView
  }, [location.pathname]);

  /* 3️⃣ delegated AddToCart / Search click listener ----------------- */
  useEffect(() => {
    if (!window.ttq) return;

    const clickHandler = (e) => {
      const el = e.target.closest('button, a, input[type="submit"]');
      if (!el) return;

      const rawLabel =
        el.dataset.ttEvent ||
        el.getAttribute('aria-label') ||
        el.name ||
        el.id ||
        el.textContent ||
        '';

      const label = rawLabel.toLowerCase();

      /* ----- AddToCart --------------------------------------------- */
      if (
        label.includes('add to cart') ||
        label.includes('addtocart') ||
        label.includes('add_cart') ||
        el.dataset.ttEvent === 'AddToCart'
      ) {
        window.ttq.track('AddToCart', {
          event_id: genEventId(),
          content_id: getContentId(el),
          content_type: 'product',
        });
        return; // stop bubbling to Search
      }

      /* ----- Search -------------------------------------------------- */
      if (label.includes('search') || el.dataset.ttEvent === 'Search') {
        const form = el.closest('form');
        const q =
          form?.querySelector('input[type="search"]') ||
          form?.querySelector('input[name="q"]');

        window.ttq.track('Search', {
          event_id: genEventId(),
          search_string: q?.value,
        });
      }
    };

    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  }, []);

  /* nothing visible – script tag keeps React happy */
  return <script nonce={nonce} />;
}
