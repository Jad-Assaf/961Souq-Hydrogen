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
  if (typeof openaiJson?.output_text === 'string' && openaiJson.output_text) {
    return openaiJson.output_text.trim();
  }

  const out = openaiJson?.output;
  if (!Array.isArray(out)) return '';

  let text = '';
  for (const item of out) {
    const content = item?.content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      // Common block types seen in Responses API
      if (block?.type === 'output_text' && typeof block?.text === 'string') {
        text += block.text;
      } else if (block?.type === 'text' && typeof block?.text === 'string') {
        text += block.text;
      } else if (
        block?.type === 'message' &&
        typeof block?.content === 'string'
      ) {
        text += block.content;
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
    // PUBLIC_STORE_DOMAIN should be your *.myshopify.com domain for Admin API calls.
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
            'Missing PUBLIC_STORE_DOMAIN (set it to yourstore.myshopify.com, not the custom domain).',
          stage: 'env',
        },
        {status: 500},
      );
    }
    if (!adminToken) {
      return json(
        {error: 'Missing ADMIN_API_TOKEN', stage: 'env'},
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

    // 2) Fetch product content via Storefront
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

    // Trim input so we don’t waste tokens on huge descriptions
    const trimmedDescription =
      description.length > 6000 ? description.slice(0, 6000) : description;

    // 3) OpenAI call
    // Key changes:
    // - max_output_tokens increased a lot
    // - reasoning effort minimal
    const payload = {
      model: 'gpt-5-nano',
      reasoning: {effort: 'minimal'},
      instructions:
        'Write a concise, neutral e-commerce summary. No prices, no warranty, no emojis, no exaggerated claims. Keep it easy to scan.',
      input: `Product: ${title}
Brand/Vendor: ${vendor}

Description:
${trimmedDescription}

Write 3–4 short sentences. Max 450 characters.`,
      max_output_tokens: 900,
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

    // If the model ended incomplete, return the reason + usage (this is your exact case)
    if (openaiJson?.status === 'incomplete') {
      console.error('OpenAI incomplete:', {
        incomplete_details: openaiJson?.incomplete_details,
        usage: openaiJson?.usage,
      });
      return json(
        {
          error: 'OpenAI returned status=incomplete (token budget issue).',
          stage: 'openai_incomplete',
          incomplete_details: openaiJson?.incomplete_details || null,
          usage: openaiJson?.usage || null,
        },
        {status: 502},
      );
    }

    let summary = extractOutputText(openaiJson).replace(/\s+/g, ' ').trim();

    if (!summary) {
      console.error('Empty OpenAI output:', {
        status: openaiJson?.status,
        usage: openaiJson?.usage,
        output: openaiJson?.output,
      });
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
