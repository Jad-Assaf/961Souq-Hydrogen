// app/routes/api.product-summary.jsx
import {json} from '@shopify/remix-oxygen';

const SHOPIFY_ADMIN_API_VERSION = '2025-07';

function normalizeShopDomain(raw) {
  if (!raw) return '';
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

async function shopifyAdminGraphQL({shopDomain, adminToken, query, variables}) {
  const res = await fetch(
    `https://${shopDomain}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-shopify-access-token': adminToken,
      },
      body: JSON.stringify({query, variables}),
    },
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      data?.errors?.[0]?.message ||
      data?.error ||
      `Shopify Admin API error (${res.status})`;
    throw new Error(msg);
  }

  if (data?.errors?.length) {
    throw new Error(data.errors[0].message || 'Shopify Admin API error');
  }

  return data.data;
}

function extractOutputText(openaiJson) {
  // Newer Responses API often provides this convenience field:
  if (typeof openaiJson?.output_text === 'string' && openaiJson.output_text) {
    return openaiJson.output_text.trim();
  }

  // Fallback: parse output array
  const out = openaiJson?.output;
  if (!Array.isArray(out)) return '';

  let text = '';
  for (const item of out) {
    const content = item?.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block?.type === 'output_text' && typeof block?.text === 'string') {
        text += block.text;
      }
    }
  }

  return text.trim();
}

export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === 'string' ? body.productId : '';
    if (!productId) return json({error: 'Missing productId'}, {status: 400});

    const openaiKey = context.env.OPENAI_API_KEY;

    // IMPORTANT:
    // This MUST be your *.myshopify.com domain for Admin API calls.
    const adminShopDomain = normalizeShopDomain(
      context.env.PUBLIC_STORE_DOMAIN,
    );

    const adminToken = context.env.ADMIN_API_TOKEN;

    if (!openaiKey) {
      return json(
        {error: 'Missing OPENAI_API_KEY', stage: 'env'},
        {status: 500},
      );
    }
    if (!adminShopDomain) {
      return json(
        {
          error:
            'Missing SHOPIFY_ADMIN_DOMAIN (set it to something like yourstore.myshopify.com)',
          stage: 'env',
        },
        {status: 500},
      );
    }
    if (!adminToken) {
      return json(
        {error: 'Missing SHOPIFY_ADMIN_API_ACCESS_TOKEN', stage: 'env'},
        {status: 500},
      );
    }

    // 1) Check metafield cache
    const readMfQuery = `#graphql
      query ReadSummary($id: ID!) {
        product(id: $id) {
          id
          metafield(namespace: "custom", key: "ai_summary") {
            id
            value
          }
        }
      }
    `;

    const readMf = await shopifyAdminGraphQL({
      shopDomain: adminShopDomain,
      adminToken,
      query: readMfQuery,
      variables: {id: productId},
    });

    const existing = readMf?.product?.metafield?.value?.trim() || '';
    if (existing) return json({summary: existing, cached: true});

    // 2) Fetch product content via Storefront (trusted source)
    const sfQuery = `#graphql
      query ProductForSummary($id: ID!) {
        product(id: $id) {
          id
          title
          vendor
          description
        }
      }
    `;

    const sf = await context.storefront.query(sfQuery, {
      variables: {id: productId},
    });

    const title = sf?.product?.title || '';
    const vendor = sf?.product?.vendor || '';
    const description = (sf?.product?.description || '').trim();

    if (!description) {
      return json(
        {error: 'Product has no description to summarize', stage: 'storefront'},
        {status: 400},
      );
    }

    const trimmedDescription =
      description.length > 8000 ? description.slice(0, 8000) : description;

    // 3) OpenAI call
    const payload = {
      model: 'gpt-5-nano',
      instructions:
        'Write a concise, neutral e-commerce summary. No prices, no warranty, no emojis, no exaggerated claims. Keep it easy to scan.',
      input: `Product: ${title}
Brand/Vendor: ${vendor}

Description:
${trimmedDescription}

Write a single short paragraph (2–3 sentences). Max 350 characters.`,
      max_output_tokens: 180,
    };

    const openaiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const openaiJson = await openaiRes.json().catch(() => null);

    if (!openaiRes.ok) {
      const msg =
        openaiJson?.error?.message || `OpenAI API error (${openaiRes.status})`;
      console.error('OpenAI error:', openaiRes.status, openaiJson);
      return json(
        {
          error: msg,
          stage: 'openai',
          openaiStatus: openaiRes.status,
          openaiCode: openaiJson?.error?.code || null,
        },
        {status: 502},
      );
    }

    let summary = extractOutputText(openaiJson).replace(/\s+/g, ' ').trim();

    if (!summary) {
      console.error('Empty OpenAI output:', openaiJson);
      return json(
        {error: 'Empty summary from model', stage: 'openai_parse'},
        {status: 502},
      );
    }

    if (summary.length > 600) summary = summary.slice(0, 600).trim();

    // 4) Save metafield
    const writeMfMutation = `#graphql
      mutation WriteSummary($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id namespace key value }
          userErrors { field message }
        }
      }
    `;

    const writeRes = await shopifyAdminGraphQL({
      shopDomain: adminShopDomain,
      adminToken,
      query: writeMfMutation,
      variables: {
        metafields: [
          {
            ownerId: productId,
            namespace: 'custom',
            key: 'ai_summary',
            type: 'multi_line_text_field',
            value: summary,
          },
        ],
      },
    });

    const userErrors = writeRes?.metafieldsSet?.userErrors || [];
    if (userErrors.length) {
      return json(
        {
          error: userErrors[0]?.message || 'Failed to save metafield',
          stage: 'shopify_admin_write',
        },
        {status: 500},
      );
    }

    return json({summary, cached: false});
  } catch (e) {
    console.error('product-summary route crashed:', e);
    return json(
      {error: e?.message || 'Server error', stage: 'catch'},
      {status: 500},
    );
  }
}
