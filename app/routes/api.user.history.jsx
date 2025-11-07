// app/routes/api.user.history.jsx
import {json} from '@shopify/remix-oxygen';

export async function loader({request, context}) {
  try {
    const {storefront, env} = context;
    const adminToken = env.PRIVATE_ADMIN_API_TOKEN;
    const shop = env.PUBLIC_STORE_DOMAIN;
    if (!adminToken || !shop) return json({ids: []});

    const cookies = Object.fromEntries(
      (request.headers.get('cookie') || '')
        .split(';')
        .map((c) => c.trim().split('=').map(decodeURIComponent))
        .filter(([k]) => k),
    );
    const customerAccessToken =
      cookies.customerAccessToken || cookies['hydrogen_customer_token'] || '';
    if (!customerAccessToken) return json({ids: []});

    const CUSTOMER_Q = `#graphql
      query CustomerFromToken($token: String!) {
        customer(customerAccessToken: $token) { id }
      }
    `;
    const {data: cData} = await storefront.query(CUSTOMER_Q, {
      variables: {token: customerAccessToken},
    });
    const customerId = cData?.customer?.id;
    if (!customerId) return json({ids: []});

    const adminUrl = `https://${shop}/admin/api/2025-10/graphql.json`;

    const res = await fetch(adminUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': adminToken,
      },
      body: JSON.stringify({
        query: `
          query GetViewed($id: ID!) {
            customer(id: $id) {
              metafield(namespace: "personal", key: "viewed") { value }
            }
          }
        `,
        variables: {id: customerId},
      }),
    });
    const j = await res.json();
    const raw = j?.data?.customer?.metafield?.value || '{}';
    let ids = [];
    try {
      const parsed = JSON.parse(raw);
      ids = Array.isArray(parsed?.ids) ? parsed.ids : [];
    } catch {}

    return json({ids});
  } catch {
    return json({ids: []});
  }
}
