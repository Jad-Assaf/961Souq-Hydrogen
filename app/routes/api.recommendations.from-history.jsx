// app/routes/api.recommendations.from-history.jsx
import {json} from '@shopify/remix-oxygen';

/** Tuning defaults (server-side) */
const DEFAULT_SOURCE_LIMIT = 15;
const DEFAULT_OUTPUT_LIMIT = 24;
const DEFAULT_RANDOM_FIRST = 40;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Simple in-isolate cache (works well on Oxygen)
const recsCache =
  globalThis.__recsFromHistoryCache ||
  (globalThis.__recsFromHistoryCache = new Map());

function cacheKey(id) {
  return `recs:${id}`;
}

function getCached(id) {
  try {
    const v = recsCache.get(cacheKey(id));
    if (!v) return null;
    if (v.expires <= Date.now()) {
      recsCache.delete(cacheKey(id));
      return null;
    }
    return Array.isArray(v.items) ? v.items : null;
  } catch {
    return null;
  }
}

function setCached(id, items) {
  try {
    recsCache.set(cacheKey(id), {
      items: Array.isArray(items) ? items : [],
      expires: Date.now() + CACHE_TTL_MS,
    });
  } catch {}
}

function uniqPreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!x || seen.has(x)) continue;
    seen.add(x);
    out.push(x);
  }
  return out;
}

function dedupeProducts(list, currentProductId) {
  const map = new Map();
  for (const p of list || []) {
    if (!p || !p.id) continue;
    if (currentProductId && p.id === currentProductId) continue;
    if (!map.has(p.id)) map.set(p.id, p);
  }
  return Array.from(map.values());
}

async function fetchRecommendationsForId({productId, signal, apiUrl, token}) {
  const query = `
    query productRecommendations($productId: ID!) {
      productRecommendations(productId: $productId) {
        id
        title
        handle
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  `;

  const res = await fetch(apiUrl, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({query, variables: {productId}}),
  });

  const jsonRes = await res.json();
  if (jsonRes?.errors) return [];
  return jsonRes?.data?.productRecommendations || [];
}

async function fetchRandomProducts({signal, apiUrl, token}) {
  const query = `
    query RandomProducts {
      products(first: ${DEFAULT_RANDOM_FIRST}, sortKey: BEST_SELLING) {
        nodes {
          id
          handle
          title
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  `;

  const res = await fetch(apiUrl, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({query}),
  });

  const jsonRes = await res.json();
  if (jsonRes?.errors) return [];
  const nodes = jsonRes?.data?.products?.nodes || [];

  // shuffle to keep it “random”
  const arr = nodes.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchWithConcurrency(ids, workerFn, concurrency = 3) {
  const results = new Array(ids.length);
  let idx = 0;

  async function worker() {
    while (idx < ids.length) {
      const i = idx++;
      const id = ids[i];
      try {
        results[i] = await workerFn(id);
      } catch {
        results[i] = [];
      }
    }
  }

  const workers = Array.from({length: Math.min(concurrency, ids.length)}, () =>
    worker(),
  );
  await Promise.all(workers);

  return results;
}

export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({error: 'Method Not Allowed'}, {status: 405});
  }

  try {
    const body = await request.json().catch(() => ({}));

    const currentProductId = body.currentProductId || '';
    const sourceLimit = Number(body.sourceLimit || DEFAULT_SOURCE_LIMIT);
    const outputLimit = Number(body.outputLimit || DEFAULT_OUTPUT_LIMIT);

    // Client can send either sourceIds or seedIds
    const rawIds = Array.isArray(body.sourceIds)
      ? body.sourceIds
      : Array.isArray(body.seedIds)
      ? body.seedIds
      : [];

    const cleaned = uniqPreserveOrder(rawIds)
      .filter((id) => id && id !== currentProductId)
      .slice(0, sourceLimit);

    const domain = context.env.SHOPIFY_STORE_DOMAIN || '961souqs.myshopify.com';

    const token =
      context.env.PUBLIC_STOREFRONT_API_TOKEN ||
      context.env.STOREFRONT_API_TOKEN ||
      'e00803cf918c262c99957f078d8b6d44';

    const apiUrl = `https://${domain}/api/2025-04/graphql.json`;

    const controller = new AbortController();
    const signal = controller.signal;

    // If no ids, return random fallback
    if (!cleaned.length) {
      const randomItems = await fetchRandomProducts({signal, apiUrl, token});
      const deduped = dedupeProducts(randomItems, currentProductId).slice(
        0,
        outputLimit,
      );

      return json({
        heading: 'Random Items',
        items: deduped,
        sourceIds: [],
      });
    }

    // 1) Pull cached first
    const cachedBatches = [];
    const missing = [];

    for (const id of cleaned) {
      const c = getCached(id);
      if (c) cachedBatches.push(c);
      else missing.push(id);
    }

    // 2) Fetch missing with controlled concurrency
    if (missing.length) {
      const fetched = await fetchWithConcurrency(
        missing,
        async (id) =>
          await fetchRecommendationsForId({
            productId: id,
            signal,
            apiUrl,
            token,
          }),
        3,
      );

      fetched.forEach((items, i) => {
        const id = missing[i];
        setCached(id, items);
      });
    }

    // 3) Merge all from cache now that missing were filled
    const merged = [];
    for (const id of cleaned) {
      const c = getCached(id);
      if (c) merged.push(...c);
    }

    const deduped = dedupeProducts(merged, currentProductId).slice(
      0,
      outputLimit,
    );

    return json({
      heading: 'Based on items you viewed',
      items: deduped,
      sourceIds: cleaned,
    });
  } catch (err) {
    console.error('[api.recommendations.from-history] Error:', err);
    return json({error: 'Server Error'}, {status: 500});
  }
}
