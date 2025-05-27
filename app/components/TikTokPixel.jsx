// /app/components/TikTokPixel.jsx
import {useNonce} from '@shopify/hydrogen';

export default function TikTokPixel({pixelId}) {
  const nonce = useNonce();
  if (!pixelId) return null;

  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject = t;
  var ttq = w[t] = w[t] || [];
  ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie"];
  ttq.setAndDefer = function (obj, method) {
    obj[method] = function () { obj.push([method].concat(Array.prototype.slice.call(arguments, 0))); };
  };
  for (var i = 0; i < ttq.methods.length; i++) { ttq.setAndDefer(ttq, ttq.methods[i]); }
  ttq.instance = function (id) {
    var inst = ttq._i[id] || [];
    for (var i = 0; i < ttq.methods.length; i++) { ttq.setAndDefer(inst, ttq.methods[i]); }
    return inst;
  };
  ttq.load = function (id, opts) {
    var js = d.createElement('script');
    js.type = 'text/javascript';
    js.async = true;
    js.src = 'https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + id + '&lib=' + t;
    var first = d.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(js, first);
    ttq._i = ttq._i || {};
    ttq._i[id] = [];
    ttq._t = ttq._t || {};
    ttq._t[id] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[id] = opts || {};
  };
  ttq.load('${pixelId}');
  ttq.page();
}(window, document, 'ttq');
        `,
      }}
    />
  );
}
