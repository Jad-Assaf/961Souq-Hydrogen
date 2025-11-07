// app/routes/api.track.view.jsx
import {json} from '@shopify/remix-oxygen';

/**
 * Body: { handle: string }
 * Persists the viewed product *ID list* on the Customer metafield (namespace: "personal", key: "viewed")
 * Requirements:
 *  - env.PRIVATE_ADMIN_API_TOKEN  (Admin API)
 *  - env.PUBLIC_STORE_DOMAIN
 */
export async function action({request, context}) {
  try {
    const {storefront, env} = context;
    const adminToken = env.PRIVATE_ADMIN_API_TOKEN;
    const shop = env.PUBLIC_STORE_DOMAIN;
    if (!adminToken || !shop) return new Response(null, {status: 204});

    const body = await request.json().catch(() => ({}));
    const handle = body?.handle?.trim();
    if (!handle) return new Response(null, {status: 204});

    // 1) Who is the customer? (read access token from cookie)
    const cookies = Object.fromEntries(
      (request.headers.get('cookie') || '')
        .split(';')
        .map((c) => c.trim().split('=').map(decodeURIComponent))
        .filter(([k]) => k),
    );
    const customerAccessToken =
      cookies.customerAccessToken || cookies['hydrogen_customer_token'] || '';

    if (!customerAccessToken) return new Response(null, {status: 204});

    const CUSTOMER_Q = `#graphql
      query CustomerFromToken($token: String!) {
        customer(customerAccessToken: $token) { id email }
      }
    `;
    const {data: cData} = await storefront.query(CUSTOMER_Q, {
      variables: {token: customerAccessToken},
    });
    const customerId = cData?.customer?.id;
    if (!customerId) return new Response(null, {status: 204});

    // 2) Resolve product ID from handle (Storefront API)
    const PROD_Q = `#graphql
      query GetProd($handle: String!) {
        product(handle: $handle) { id }
      }
    `;
    const {data: pData} = await storefront.query(PROD_Q, {variables: {handle}});
    const productId = pData?.product?.id;
    if (!productId) return new Response(null, {status: 204});

    // 3) Read current metafield via Admin GraphQL, merge, write back
    const adminUrl = `https://${shop}/admin/api/2025-10/graphql.json`;

    const adminFetch = async (query, variables) => {
      const res = await fetch(adminUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
        body: JSON.stringify({query, variables}),
      });
      return res.json();
    };

    const GET_MF = `
      query GetViewed($id: ID!) {
        customer(id: $id) {
          id
          metafield(namespace: "personal", key: "viewed") { id value }
        }
      }
    `;
    const mfResp = await adminFetch(GET_MF, {id: customerId});
    const raw = mfResp?.data?.customer?.metafield?.value || '{}';
    let current = [];
    try {
      const parsed = JSON.parse(raw);
      current = Array.isArray(parsed?.ids) ? parsed.ids : [];
    } catch {}

    // Move current product to the front, dedupe, cap size
    const set = new Set([productId, ...current]);
    const ids = Array.from(set).slice(0, 200);

    const METAFIELDS_SET = `
      mutation SetViewed($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key namespace }
          userErrors { field message }
        }
      }
    `;
    const value = JSON.stringify({ids, updatedAt: new Date().toISOString()});
    const setResp = await adminFetch(METAFIELDS_SET, {
      metafields: [
        {
          ownerId: customerId,
          namespace: 'personal',
          key: 'viewed',
          type: 'json',
          value,
        },
      ],
    });

    // Ignore userErrors here (best-effort)
    return new Response(null, {status: 204});
  } catch {
    return new Response(null, {status: 204});
  }
}
