// app/routes/api.product-summary.jsx
import {json} from '@shopify/remix-oxygen';

const SHOPIFY_ADMIN_API_VERSION = '2025-07';

function normalizeShopDomain(raw) {
  if (!raw) return '';
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function normalizeSecret(raw) {
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function createRequestId() {
  try {
    if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // no-op fallback
  }
  return `ps-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function shortId(value) {
  if (typeof value !== 'string' || value.length < 12) return value || '';
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function logInfo(requestId, stage, meta = {}) {
  console.info(`[product-summary][${requestId}] ${stage}`, meta);
}

function logError(requestId, stage, meta = {}) {
  console.error(`[product-summary][${requestId}] ${stage}`, meta);
}

async function shopifyAdminGraphQL({
  shopDomain,
  adminToken,
  query,
  variables,
  requestId,
  op,
}) {
  const started = Date.now();
  logInfo(requestId, `shopify_admin:${op}:start`, {
    shopDomain,
    hasAdminToken: Boolean(adminToken),
  });

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
  logInfo(requestId, `shopify_admin:${op}:response`, {
    status: res.status,
    ok: res.ok,
    durationMs: Date.now() - started,
  });

  if (!res.ok) {
    const msg =
      data?.errors?.[0]?.message ||
      data?.error ||
      `Shopify Admin API error (${res.status})`;
    logError(requestId, `shopify_admin:${op}:http_error`, {
      status: res.status,
      body: data,
    });
    throw new Error(msg);
  }

  if (data?.errors?.length) {
    logError(requestId, `shopify_admin:${op}:graphql_error`, {
      errors: data.errors,
    });
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
  const requestId = createRequestId();

  logInfo(requestId, 'request:start', {
    method: request.method,
    url: request.url,
  });

  if (request.method !== 'POST') {
    logInfo(requestId, 'request:method_not_allowed');
    return json({error: 'Method not allowed', requestId}, {status: 405});
  }

  try {
    const body = await request.json().catch(() => ({}));
    const productId = typeof body?.productId === 'string' ? body.productId : '';
    if (!productId) {
      logInfo(requestId, 'request:missing_product_id', {body});
      return json({error: 'Missing productId', requestId}, {status: 400});
    }
    logInfo(requestId, 'request:parsed', {productId: shortId(productId)});

    const openaiKey = normalizeSecret(context.env.OPENAI_API_KEY);

    // IMPORTANT:
    // PUBLIC_STORE_DOMAIN should be your *.myshopify.com domain for Admin API calls.
    const adminShopDomain = normalizeShopDomain(
      context.env.PUBLIC_STORE_DOMAIN,
    );

    const adminToken = normalizeSecret(context.env.ADMIN_API_TOKEN);

    logInfo(requestId, 'env:check', {
      hasOpenAIKey: Boolean(openaiKey),
      hasAdminToken: Boolean(adminToken),
      adminTokenLength: adminToken?.length || 0,
      hasPublicStoreDomain: Boolean(adminShopDomain),
      adminShopDomain,
    });

    if (!openaiKey) {
      logError(requestId, 'env:missing_openai_key');
      return json(
        {error: 'Missing OPENAI_API_KEY', stage: 'env', requestId},
        {status: 500},
      );
    }
    if (!adminShopDomain) {
      logError(requestId, 'env:missing_public_store_domain');
      return json(
        {
          error:
            'Missing PUBLIC_STORE_DOMAIN (set it to yourstore.myshopify.com, not the custom domain).',
          stage: 'env',
          requestId,
        },
        {status: 500},
      );
    }
    if (!adminToken) {
      logError(requestId, 'env:missing_admin_token');
      return json(
        {error: 'Missing ADMIN_API_TOKEN', stage: 'env', requestId},
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
      requestId,
      op: 'read_summary_metafield',
    });

    const existing = readMf?.product?.metafield?.value?.trim() || '';
    if (existing) {
      logInfo(requestId, 'summary:cache_hit', {
        length: existing.length,
      });
      return json({summary: existing, cached: true, requestId});
    }
    logInfo(requestId, 'summary:cache_miss');

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

    const sfStarted = Date.now();
    const sf = await context.storefront.query(sfQuery, {
      variables: {id: productId},
    });
    logInfo(requestId, 'storefront:product_loaded', {
      durationMs: Date.now() - sfStarted,
      hasProduct: Boolean(sf?.product),
      title: sf?.product?.title || '',
    });

    const title = sf?.product?.title || '';
    const vendor = sf?.product?.vendor || '';
    const description = (sf?.product?.description || '').trim();

    if (!description) {
      logError(requestId, 'storefront:missing_description');
      return json(
        {
          error: 'Product has no description to summarize',
          stage: 'storefront',
          requestId,
        },
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

    logInfo(requestId, 'openai:request', {
      model: payload.model,
      inputLength: payload.input.length,
      maxOutputTokens: payload.max_output_tokens,
    });

    const openaiStarted = Date.now();
    const openaiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const openaiJson = await openaiRes.json().catch(() => null);
    logInfo(requestId, 'openai:response', {
      status: openaiRes.status,
      ok: openaiRes.ok,
      durationMs: Date.now() - openaiStarted,
      responseStatus: openaiJson?.status || null,
    });

    if (!openaiRes.ok) {
      const msg =
        openaiJson?.error?.message || `OpenAI API error (${openaiRes.status})`;
      logError(requestId, 'openai:http_error', {
        status: openaiRes.status,
        body: openaiJson,
      });
      return json(
        {
          error: msg,
          stage: 'openai',
          requestId,
          openaiStatus: openaiRes.status,
          openaiCode: openaiJson?.error?.code || null,
        },
        {status: 502},
      );
    }

    // If the model ended incomplete, return the reason + usage (this is your exact case)
    if (openaiJson?.status === 'incomplete') {
      logError(requestId, 'openai:incomplete', {
        incomplete_details: openaiJson?.incomplete_details,
        usage: openaiJson?.usage,
      });
      return json(
        {
          error: 'OpenAI returned status=incomplete (token budget issue).',
          stage: 'openai_incomplete',
          requestId,
          incomplete_details: openaiJson?.incomplete_details || null,
          usage: openaiJson?.usage || null,
        },
        {status: 502},
      );
    }

    let summary = extractOutputText(openaiJson).replace(/\s+/g, ' ').trim();

    if (!summary) {
      logError(requestId, 'openai:empty_output', {
        status: openaiJson?.status,
        usage: openaiJson?.usage,
        output: openaiJson?.output,
      });
      return json(
        {
          error: 'Empty summary from model',
          stage: 'openai_parse',
          requestId,
        },
        {status: 502},
      );
    }

    if (summary.length > 600) summary = summary.slice(0, 600).trim();
    logInfo(requestId, 'openai:summary_ready', {summaryLength: summary.length});

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
      requestId,
      op: 'write_summary_metafield',
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
      logError(requestId, 'shopify_admin:write_user_error', {
        userErrors,
      });
      return json(
        {
          error: userErrors[0]?.message || 'Failed to save metafield',
          stage: 'shopify_admin_write',
          requestId,
        },
        {status: 500},
      );
    }

    logInfo(requestId, 'request:success', {
      cached: false,
      summaryLength: summary.length,
    });
    return json({summary, cached: false, requestId});
  } catch (e) {
    logError(requestId, 'request:catch', {
      message: e?.message || 'Unknown error',
      stack: e?.stack || null,
    });
    return json(
      {error: e?.message || 'Server error', stage: 'catch', requestId},
      {status: 500},
    );
  }
}
