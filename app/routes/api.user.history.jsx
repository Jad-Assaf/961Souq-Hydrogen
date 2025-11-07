// app/routes/api.user.history.jsx
import {json} from '@shopify/remix-oxygen';
import {viewedHandlesCookie} from '~/lib/viewedHandlesCookie.server';

export async function loader({request, context}) {
  const url = new URL(request.url);
  const limit = Math.max(
    1,
    Math.min(parseInt(url.searchParams.get('limit') || '60', 10), 60),
  );
  const expand = url.searchParams.get('expand'); // 'products' | undefined

  const cookieRaw = request.headers.get('Cookie');
  const handles = ((await viewedHandlesCookie.parse(cookieRaw)) || []).slice(
    0,
    limit,
  );

  if (!expand || handles.length === 0) {
    return json({handles});
  }

  // Expand to minimal product data using Storefront API.
  const {PUBLIC_STOREFRONT_API_TOKEN, PUBLIC_STORE_DOMAIN} = context.env;
  const API_URL = `https://${PUBLIC_STORE_DOMAIN}/api/2025-04/graphql.json`;
  const API_TOKEN = PUBLIC_STOREFRONT_API_TOKEN;

  // Build a single aliased query:
  // p0: product(handle:"h0"){ ...fields }
  const fields = `
    id
    handle
    title
    featuredImage { url altText }
    priceRange { minVariantPrice { amount currencyCode } }
  `;
  const capped = handles.slice(0, 25); // keep the query reasonable
  const blocks = capped.map(
    (h, i) => `p${i}: product(handle: ${JSON.stringify(h)}) { ${fields} }`,
  );
  const query = `query UserHistory { ${blocks.join('\n')} }`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': API_TOKEN,
    },
    body: JSON.stringify({query}),
  });
  const jsonRes = await res.json();

  const products = [];
  if (jsonRes?.data) {
    // Preserve cookie order
    for (let i = 0; i < capped.length; i++) {
      const node = jsonRes.data[`p${i}`];
      if (node) products.push(node);
    }
  }

  return json({handles, products});
}
