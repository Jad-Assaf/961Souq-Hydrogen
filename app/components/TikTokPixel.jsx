import {useNonce} from '@shopify/hydrogen';
import {useEffect} from 'react';
import {useLocation} from '@remix-run/react';

const genEventId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;

const getContentId = (el) =>
  el?.dataset?.ttContentId || el?.dataset?.productId || el?.dataset?.variantId;

const sendServer = async (body) => {
  try {
    const res = await fetch('/tiktok-event', {
      // ⇦ new path
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
      keepalive: true,
    });
    console.log(
      `[TikTok] relay • ${body.event} • id=${body.event_id} • ${res.status}`,
    );
  } catch (err) {
    console.error('[TikTok] relay failed', err);
  }
};

export default function TikTokPixel({pixelId}) {
  const nonce = useNonce();
  const {pathname, href} = useLocation();

  /* 1️⃣ load pixel once */
  useEffect(() => {
    if (!pixelId || window.ttq) return;
    (function (w, d, t, id) {
      w.TiktokAnalyticsObject = t;
      const ttq = (w[t] = w[t] || []);
      ttq.methods =
        'page track identify instances debug on off once ready alias group enableCookie'.split(
          ' ',
        );
      ttq.setAndDefer = (o, m) => (o[m] = (...a) => o.push([m, ...a]));
      ttq.methods.forEach((m) => ttq.setAndDefer(ttq, m));
      ttq.load = (pid) => {
        const s = d.createElement('script');
        s.async = true;
        s.src =
          'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' +
          pid +
          '&lib=' +
          t;
        d.getElementsByTagName('script')[0].parentNode.insertBefore(s, null);
      };
      ttq.load(id);
    })(window, document, 'ttq', pixelId);
  }, [pixelId]);

  /* 2️⃣ PageView once per URL */
  useEffect(() => {
    if (!window.ttq) return;
    if (window.__tt_last_path === pathname) return;
    window.__tt_last_path = pathname;

    const event_id = genEventId();
    window.ttq.page({event_id});
    sendServer({event: 'PageView', event_id, url: href});
  }, [pathname, href]);

  /* 3️⃣ AddToCart + Search */
  useEffect(() => {
    if (!window.ttq) return;

    const handler = (e) => {
      const el = e.target.closest('button,a,input[type="submit"]');
      if (!el) return;

      const label = (
        el.dataset.ttEvent ||
        el.getAttribute('aria-label') ||
        el.name ||
        el.id ||
        el.textContent ||
        ''
      ).toLowerCase();

      /* AddToCart */
      if (
        label.includes('add to cart') ||
        label.includes('addtocart') ||
        label.includes('add_cart') ||
        el.dataset.ttEvent === 'AddToCart'
      ) {
        const event_id = genEventId();
        const body = {
          event: 'AddToCart',
          event_id,
          content_id: getContentId(el),
          content_type: 'product',
          url: location.href,
        };
        window.ttq.track('AddToCart', body);
        sendServer(body);
        return;
      }

      /* Search */
      if (label.includes('search') || el.dataset.ttEvent === 'Search') {
        const form = el.closest('form');
        const q =
          form?.querySelector('input[type="search"]') ||
          form?.querySelector('input[name="q"]');
        const event_id = genEventId();
        const body = {
          event: 'Search',
          event_id,
          search_string: q?.value,
          url: location.href,
        };
        window.ttq.track('Search', body);
        sendServer(body);
      }
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return <script nonce={nonce} />;
}
