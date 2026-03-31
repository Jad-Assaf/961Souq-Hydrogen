import {flattenConnection} from '@shopify/hydrogen';
import {CUSTOMER_DETAILS_QUERY} from '~/graphql/customer-account/CustomerDetailsQuery';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import {
  getTypesenseSearchClientFromEnv,
  TYPESENSE_PRODUCTS_COLLECTION,
} from '~/lib/typesense.server';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = 'gpt-5.4-mini';
const MAX_TOOL_ROUNDS = 6;
const MAX_MESSAGES = 16;
const MAX_TEXT_BLOCK = 4000;
const OFF_TOPIC_REPLY =
  '<p>I can only help with 961 Souq shopping questions, including products, collections, prices, availability, store policies, cart, checkout, and account or order help.</p><p>I can’t help with coding, writing, translation, weather, news, or other unrelated topics.</p>';

function createRequestId() {
  try {
    if (typeof crypto?.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // no-op fallback
  }

  return `chatbot-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function normalizeSecret(raw) {
  if (raw == null) return '';
  if (typeof raw === 'object' && 'value' in raw) {
    return normalizeSecret(raw.value);
  }
  const trimmed = String(raw).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function describeSecretCandidate(raw) {
  const isObject = typeof raw === 'object' && raw !== null;

  return {
    exists: raw != null,
    type: typeof raw,
    constructorName: raw?.constructor?.name || null,
    hasValueProp: Boolean(isObject && 'value' in raw),
    keys: isObject ? Object.keys(raw).slice(0, 5) : [],
    normalizedLength: normalizeSecret(raw).length,
  };
}

function resolveEnvSecret(env, key) {
  const runtimeRaw = env?.[key];
  const runtimeValue = normalizeSecret(runtimeRaw);
  if (runtimeValue) {
    return {
      secret: runtimeValue,
      source: 'context.env',
      runtimeShape: describeSecretCandidate(runtimeRaw),
      processShape: null,
    };
  }

  let processRaw = null;

  try {
    if (typeof process !== 'undefined') {
      processRaw = process?.env?.[key];
      const processValue = normalizeSecret(processRaw);
      if (processValue) {
        return {
          secret: processValue,
          source: 'process.env',
          runtimeShape: describeSecretCandidate(runtimeRaw),
          processShape: describeSecretCandidate(processRaw),
        };
      }
    }
  } catch {
    // no-op fallback for runtimes without process.env
  }

  return {
    secret: '',
    source: null,
    runtimeShape: describeSecretCandidate(runtimeRaw),
    processShape: describeSecretCandidate(processRaw),
  };
}

function logInfo(requestId, stage, meta = {}) {
  console.info(`[chatbot][${requestId}] ${stage}`, meta);
}

function logError(requestId, stage, meta = {}) {
  console.error(`[chatbot][${requestId}] ${stage}`, meta);
}

const PRODUCT_DETAILS_QUERY = `#graphql
  query ChatbotProductDetails($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      vendor
      productType
      description
      descriptionHtml
      onlineStoreUrl
      featuredImage {
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      options {
        name
        values
      }
      variants(first: 12) {
        nodes {
          id
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    name: 'search_store_catalog',
    description:
      'Search the 961 Souq product catalog when the shopper wants product options, availability clues, or recommendations.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: {
          type: 'string',
          description: 'The shopper request, product name, use case, or query.',
        },
        shopping_context: {
          type: 'string',
          description:
            'Optional context such as budget, brand preference, specs, or intended use.',
        },
      },
      required: ['query'],
    },
  },
  {
    type: 'function',
    name: 'search_store_policies',
    description:
      'Answer store policy, shipping, payment, warranty, return, pickup, and FAQ questions.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        question: {
          type: 'string',
          description: 'The policy or FAQ question to answer.',
        },
        context: {
          type: 'string',
          description:
            'Optional shopping context, such as the product being discussed.',
        },
      },
      required: ['question'],
    },
  },
  {
    type: 'function',
    name: 'get_product_details',
    description:
      'Retrieve richer details for a single product by handle or product URL.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        handle: {
          type: 'string',
          description:
            'The Shopify product handle, for example macbook-air-m3.',
        },
        product_url: {
          type: 'string',
          description: 'A product URL if the handle is not already known.',
        },
      },
      required: [],
    },
  },
  {
    type: 'function',
    name: 'get_cart_summary',
    description:
      'Read the current shopper cart before discussing totals, items, or checkout.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {},
      required: [],
    },
  },
  {
    type: 'function',
    name: 'add_to_cart',
    description:
      'Add a specific product variant to the current cart after the shopper has chosen the exact item.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        merchandise_id: {
          type: 'string',
          description:
            'The Shopify ProductVariant GID, usually returned from catalog search.',
        },
        quantity: {
          type: 'integer',
          description: 'The number of units to add.',
          minimum: 1,
        },
      },
      required: ['merchandise_id'],
    },
  },
  {
    type: 'function',
    name: 'update_cart_line',
    description:
      'Update the quantity of an existing cart line. Use quantity 0 to remove it.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        line_id: {
          type: 'string',
          description: 'The cart line ID from get_cart_summary.',
        },
        quantity: {
          type: 'integer',
          description: 'New quantity. Use 0 to remove the line.',
          minimum: 0,
        },
      },
      required: ['line_id', 'quantity'],
    },
  },
  {
    type: 'function',
    name: 'get_account_profile',
    description: 'Retrieve the signed-in customer profile and saved addresses.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {},
      required: [],
    },
  },
  {
    type: 'function',
    name: 'get_recent_orders',
    description:
      'Retrieve recent orders for the signed-in customer when they ask about purchase history or recent orders.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        limit: {
          type: 'integer',
          description: 'How many recent orders to return.',
          minimum: 1,
          maximum: 10,
        },
      },
      required: [],
    },
  },
  {
    type: 'function',
    name: 'get_order_details',
    description:
      'Retrieve a specific signed-in customer order by order number, such as #1234.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        order_number: {
          type: 'string',
          description:
            'The human-facing order number, with or without the # prefix.',
        },
      },
      required: ['order_number'],
    },
  },
];

export async function action({request, context}) {
  const requestId = createRequestId();
  logInfo(requestId, 'request:start', {
    method: request.method,
    url: request.url,
  });

  if (request.method !== 'POST') {
    logInfo(requestId, 'request:method_not_allowed');
    return createJsonResponse(
      {error: 'Method not allowed', requestId},
      {status: 405},
    );
  }

  const openaiKeyResolution = resolveEnvSecret(context.env, 'OPENAI_API_KEY');
  const openaiKey = openaiKeyResolution.secret;
  logInfo(requestId, 'env:openai_key_check', {
    source: openaiKeyResolution.source,
    runtimeShape: openaiKeyResolution.runtimeShape,
    processShape: openaiKeyResolution.processShape,
    envOpenAIKeys: Object.keys(context.env || {}).filter((key) =>
      key.toUpperCase().includes('OPENAI'),
    ),
  });

  if (!openaiKey) {
    logError(requestId, 'env:missing_openai_key', {
      runtimeShape: openaiKeyResolution.runtimeShape,
      processShape: openaiKeyResolution.processShape,
    });
    return createJsonResponse(
      {error: 'Missing OPENAI_API_KEY', requestId},
      {status: 500},
    );
  }

  const body = await request.json().catch(() => ({}));
  const messages = sanitizeMessages(body?.messages);

  if (!messages.length) {
    logInfo(requestId, 'request:missing_messages', {
      bodyKeys: Object.keys(body),
    });
    return createJsonResponse(
      {error: 'No messages provided', requestId},
      {status: 400},
    );
  }

  const pageContext = normalizePageContext(body?.pageContext);
  const currentProductHandle = detectCurrentProductHandle(pageContext);
  const lastUserMessage = getLastUserMessage(messages);

  if (
    shouldRejectClearlyOffTopicRequest(lastUserMessage, {
      currentProductHandle,
      pageContext,
    })
  ) {
    logInfo(requestId, 'request:clearly_off_topic', {
      lastUserMessage,
      pathname: pageContext?.pathname || null,
      currentProductHandle,
    });
    return createJsonResponse(
      {
        success: true,
        answer: OFF_TOPIC_REPLY,
        answerHtml: OFF_TOPIC_REPLY,
        cards: [],
        cartAction: {didChange: false, action: null, message: null},
        loggedIn: false,
        requestId,
        outOfScope: true,
      },
      {
        headers: new Headers({
          'Cache-Control': 'no-store',
        }),
      },
    );
  }

  const isLoggedIn = await context.customerAccount
    .isLoggedIn()
    .catch(() => false);

  const responseHeaders = new Headers({
    'Cache-Control': 'no-store',
  });

  const toolContext = {
    context,
    responseHeaders,
    currentProductHandle,
    pageContext,
    isLoggedIn,
  };

  const instructions = buildInstructions({pageContext, currentProductHandle});
  const conversation = serializeConversation(messages);
  const model = context.env.OPENAI_CHATBOT_MODEL || DEFAULT_MODEL;

  try {
    const {response: finalResponse, ui} = await runToolLoop({
      apiKey: openaiKey,
      model,
      instructions,
      conversation,
      toolContext,
    });

    const answer = extractOutputText(finalResponse);
    if (!answer) {
      logError(requestId, 'openai:empty_answer');
      return createJsonResponse(
        {error: 'The chatbot returned an empty response.', requestId},
        {status: 502, headers: responseHeaders},
      );
    }

    logInfo(requestId, 'request:success', {
      answerLength: answer.trim().length,
      loggedIn: isLoggedIn,
      cardCount: ui.cards.length,
      cartChanged: ui.cartAction.didChange,
    });
    return createJsonResponse(
      {
        success: true,
        answer: answer.trim(),
        answerHtml: answer.trim(),
        cards: ui.cards,
        cartAction: ui.cartAction,
        loggedIn: isLoggedIn,
        requestId,
      },
      {headers: responseHeaders},
    );
  } catch (error) {
    logError(requestId, 'request:failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return createJsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : 'The chatbot request failed.',
        requestId,
      },
      {status: 500, headers: responseHeaders},
    );
  }
}

async function runToolLoop({
  apiKey,
  model,
  instructions,
  conversation,
  toolContext,
}) {
  const uiState = createResponseUiState();
  let response = await createOpenAIResponse(apiKey, {
    model,
    reasoning: {effort: 'medium'},
    instructions,
    input: conversation,
    tools: TOOL_DEFINITIONS,
    max_output_tokens: 900,
  });

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const functionCalls = getFunctionCalls(response);
    if (!functionCalls.length) {
      return {
        response,
        ui: finalizeResponseUiState(uiState),
      };
    }

    const toolOutputs = [];
    for (const call of functionCalls) {
      const args = safeParseJson(call.arguments) || {};
      const output = await runToolByName(call.name, args, toolContext).catch(
        (error) => ({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Tool execution failed unexpectedly.',
        }),
      );
      updateUiStateFromTool(uiState, call.name, output);

      toolOutputs.push({
        type: 'function_call_output',
        call_id: call.call_id,
        output: JSON.stringify(output),
      });
    }

    response = await createOpenAIResponse(apiKey, {
      model,
      previous_response_id: response.id,
      input: toolOutputs,
      tools: TOOL_DEFINITIONS,
      max_output_tokens: 900,
    });
  }

  throw new Error('The chatbot exceeded its tool-call limit.');
}

async function createOpenAIResponse(apiKey, payload) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message || `OpenAI API error (${response.status})`;
    throw new Error(message);
  }

  return data;
}

function getFunctionCalls(openaiResponse) {
  if (!Array.isArray(openaiResponse?.output)) {
    return [];
  }

  return openaiResponse.output.filter((item) => item?.type === 'function_call');
}

function createResponseUiState() {
  return {
    cards: new Map(),
    cartAction: {
      didChange: false,
      action: null,
      message: null,
    },
  };
}

function updateUiStateFromTool(state, toolName, output) {
  if (!state || !output?.ok) {
    return;
  }

  if (toolName === 'search_store_catalog') {
    registerUiCards(state, output.products);
    registerUiCards(state, output.collections);
    return;
  }

  if (toolName === 'get_product_details' && output.product) {
    registerUiCards(state, [output.product]);
    return;
  }

  if (toolName === 'add_to_cart' || toolName === 'update_cart_line') {
    state.cartAction = {
      didChange: true,
      action: toolName === 'add_to_cart' ? 'add' : 'update',
      message: firstString(output.message) || null,
    };
  }
}

function registerUiCards(state, items) {
  if (!Array.isArray(items)) {
    return;
  }

  for (const item of items) {
    const card = normalizeUiCard(item);
    if (!card?.href) {
      continue;
    }

    state.cards.set(card.href, card);
  }
}

function normalizeUiCard(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const kind =
    String(item.kind || '')
      .trim()
      .toLowerCase() === 'collection'
      ? 'collection'
      : 'product';
  const href = normalizeStorefrontUrl(
    firstString(item.href, item.url, item.link, item.details_url),
  );
  const title = firstString(item.title, item.name);

  if (!title && !href) {
    return null;
  }

  const imageUrl =
    firstString(
      item.image_url,
      item.imageUrl,
      item.image,
      item?.featured_image?.url,
    ) || null;
  const price =
    kind === 'product'
      ? firstString(item.price, item.price_range, item.price_text)
      : null;
  const subtitle =
    kind === 'collection' ? firstString(item.subtitle) || 'Collection' : null;

  return {
    kind,
    href,
    title: title || href || 'Untitled',
    image_url: imageUrl,
    price,
    subtitle,
  };
}

function finalizeResponseUiState(state) {
  return {
    cards: Array.from(state.cards.values()).slice(0, 8),
    cartAction: state.cartAction,
  };
}

function createJsonResponse(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function extractOutputText(openaiJson) {
  if (typeof openaiJson?.output_text === 'string' && openaiJson.output_text) {
    return openaiJson.output_text;
  }

  const output = Array.isArray(openaiJson?.output) ? openaiJson.output : [];
  let text = '';

  for (const item of output) {
    if (item?.type !== 'message' || !Array.isArray(item?.content)) {
      continue;
    }

    for (const content of item.content) {
      if (
        (content?.type === 'output_text' || content?.type === 'text') &&
        typeof content?.text === 'string'
      ) {
        text += content.text;
      }
    }
  }

  return text;
}

function buildInstructions({pageContext, currentProductHandle}) {
  const currentPageLine = pageContext?.pathname
    ? `Current page: ${pageContext.pathname}.`
    : '';
  const productHandleLine = currentProductHandle
    ? `The shopper is currently viewing product handle "${currentProductHandle}". If they refer to "this" or "this product", use get_product_details with that handle.`
    : '';

  return [
    'You are the 961 Souq storefront assistant.',
    'Help shoppers find products, compare products, answer store policy questions, manage the live cart, and help signed-in customers with account or order questions.',
    'If the shopper clearly asks for something unrelated to the store, such as coding, translation, general knowledge, writing, math, weather, or news, refuse briefly and redirect them back to store or product questions.',
    'Always use tools for factual store data. Never invent product availability, pricing, policies, cart contents, or order details.',
    'For shopping or recommendation requests, search the store catalog first before answering.',
    'If the shopper has not chosen an exact variant or quantity, ask a short follow-up question before adding to cart.',
    'Respond with simple HTML only. Allowed tags: p, br, ul, ol, li, strong, em, a.',
    'Do not use Markdown.',
    'Use relative links only, such as <a href="/account/login">sign in</a> or <a href="/cart">cart</a>. Never output raw URLs or full domains.',
    'When referencing products or collections, mention their names in the HTML but do not include inline product or collection links because the UI renders cards for those separately.',
    'If account or order tools report that the shopper must sign in, direct them to <a href="/account/login">account login</a>.',
    'Keep answers concise and practical. Use lists only when comparing items or summarizing multiple results.',
    currentPageLine,
    productHandleLine,
  ]
    .filter(Boolean)
    .join(' ');
}

function serializeConversation(messages) {
  return messages
    .map((message) => {
      const role = message.role === 'assistant' ? 'Assistant' : 'User';
      return `${role}: ${message.content}`;
    })
    .join('\n\n');
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      content: truncateText(String(message?.content || '').trim(), 1600),
    }))
    .filter((message) => message.content);
}

function normalizePageContext(pageContext) {
  if (!pageContext || typeof pageContext !== 'object') {
    return null;
  }

  const pathname = String(pageContext.pathname || '').trim();
  const url = String(pageContext.url || '').trim();
  const title = String(pageContext.title || '').trim();

  if (!pathname && !url && !title) {
    return null;
  }

  return {pathname, url, title};
}

function detectCurrentProductHandle(pageContext) {
  const pathname = pageContext?.pathname || '';
  const match = pathname.match(/^\/products\/([^/?#]+)/i);

  return match ? decodeURIComponent(match[1]) : null;
}

function getLastUserMessage(messages) {
  if (!Array.isArray(messages)) {
    return '';
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'user' && typeof message?.content === 'string') {
      return message.content.trim();
    }
  }

  return '';
}

function shouldRejectClearlyOffTopicRequest(message, context = {}) {
  const normalized = String(message || '')
    .trim()
    .toLowerCase();

  if (!normalized || looksStoreRelatedMessage(normalized, context)) {
    return false;
  }

  const offTopicPatterns = [
    /\b(write|generate|create|build|debug|fix|review|explain|optimize)\b.{0,50}\b(code|javascript|js|typescript|ts|python|react|css|html|sql|api|function|component|script)\b/,
    /\b(code|javascript|js|typescript|ts|python|react|css|html|sql|api|function|component|script)\b.{0,50}\b(write|generate|create|build|debug|fix|review|explain|optimize)\b/,
    /\btranslate\b|\btranslation\b|\bproofread\b|\bparaphrase\b|\bsummarize\b|\bsummary\b|\brewrite\b/,
    /\bweather\b|\btemperature\b|\bforecast\b/,
    /\bnews\b|\bheadline\b|\bcurrent events\b/,
    /\bcapital of\b|\bpopulation of\b|\bpresident\b|\bprime minister\b/,
    /\bpoem\b|\bstory\b|\bessay\b|\bjoke\b|\briddle\b/,
    /\bmath\b|\balgebra\b|\bcalculus\b|\bequation\b|\bsolve\b.{0,30}\b(x|y|\d)/,
    /\bmedical\b|\bsymptom\b|\bdiagnosis\b|\blegal\b|\blawyer\b/,
    /\bstock market\b|\bcrypto\b|\bbitcoin\b|\bethereum\b|\bhoroscope\b/,
  ];

  return offTopicPatterns.some((pattern) => pattern.test(normalized));
}

function looksStoreRelatedMessage(message, context = {}) {
  const normalized = String(message || '')
    .trim()
    .toLowerCase();

  if (!normalized) {
    return false;
  }

  const pathname = String(context?.pageContext?.pathname || '').toLowerCase();
  if (
    (context?.currentProductHandle || pathname.startsWith('/products/')) &&
    /\b(this|it|that|this one|that one|same one|same product)\b/.test(
      normalized,
    )
  ) {
    return true;
  }

  if (
    /\b(product|products|item|items|collection|collections|category|categories|catalog|shop|store|brand|brands|price|prices|pricing|cost|budget|deal|discount|discount code|coupon|promo code|voucher|sale|stock|available|availability|recommend|recommendation|suggest|show|list|find|search|compare|comparison|spec|specs|specifications|feature|features|buy|purchase|cart|basket|checkout|shipping|delivery|pickup|return|returns|refund|refunds|warranty|policy|policies|faq|payment|installment|cash on delivery|cod|account|login|sign in|sign-in|order|orders|track|tracking|wishlist)\b/.test(
      normalized,
    )
  ) {
    return true;
  }

  return /\b(laptop|laptops|gaming laptop|desktop|pc|computer|monitor|keyboard|mouse|headset|chair|iphone|ipad|macbook|tablet|phone|smartphone|camera|router|ssd|hdd|ram|memory|processor|cpu|gpu|graphics card|printer|console|playstation|ps5|xbox|accessory|accessories|gaming|apple|dell|hp|acer|lenovo|msi|asus|samsung|ryzen|intel|amd|rtx|gtx)\b/.test(
    normalized,
  );
}

async function runToolByName(name, args, toolContext) {
  switch (name) {
    case 'search_store_catalog':
      return searchStoreCatalog(args, toolContext);
    case 'search_store_policies':
      return searchStorePolicies(args, toolContext);
    case 'get_product_details':
      return getProductDetails(args, toolContext);
    case 'get_cart_summary':
      return getCartSummary(toolContext);
    case 'add_to_cart':
      return addToCart(args, toolContext);
    case 'update_cart_line':
      return updateCartLine(args, toolContext);
    case 'get_account_profile':
      return getAccountProfile(toolContext);
    case 'get_recent_orders':
      return getRecentOrders(args, toolContext);
    case 'get_order_details':
      return getOrderDetails(args, toolContext);
    default:
      return {
        ok: false,
        error: `Unknown tool "${name}".`,
      };
  }
}

async function searchStoreCatalog(args, toolContext) {
  const query = String(args?.query || '').trim();
  const shoppingContext = String(
    args?.shopping_context || args?.context || 'General storefront help',
  ).trim();
  const searchQuery = normalizeCatalogSearchQuery(query) || query;
  const fallbackQueries = Array.from(
    new Set([searchQuery, query].filter(Boolean)),
  );

  if (!query) {
    return {ok: false, error: 'Missing query.'};
  }

  try {
    const result = await callStorefrontMcp(
      'search_shop_catalog',
      {
        query: searchQuery,
        context: shoppingContext || 'General storefront help',
      },
      toolContext.context.env.PUBLIC_STORE_DOMAIN,
    );

    const normalizedResult = filterCatalogSearchResult(
      normalizeCatalogSearchResult(result),
      query,
    );

    if (!hasCatalogEntries(normalizedResult)) {
      const fallback = await searchCatalogFallback(
        fallbackQueries,
        toolContext,
        query,
      ).catch(() => null);

      if (fallback && hasCatalogEntries(fallback)) {
        return {
          ok: true,
          source: 'typesense_fallback',
          query,
          search_query: searchQuery,
          note: 'Catalog results were refined with the local search index to match the requested product type.',
          ...fallback,
        };
      }
    }

    return {
      ok: true,
      source: 'shopify_storefront_mcp',
      query,
      search_query: searchQuery,
      ...normalizedResult,
    };
  } catch (error) {
    const fallback = await searchCatalogFallback(
      fallbackQueries,
      toolContext,
      query,
    ).catch(() => null);

    if (fallback && hasCatalogEntries(fallback)) {
      return {
        ok: true,
        source: 'typesense_fallback',
        query,
        search_query: searchQuery,
        note: 'Storefront MCP search was unavailable, so fallback catalog results were used.',
        ...fallback,
      };
    }

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Catalog search is unavailable right now.',
    };
  }
}

async function searchStorePolicies(args, toolContext) {
  const question = String(args?.question || '').trim();
  const policyContext = String(args?.context || '').trim();

  if (!question) {
    return {ok: false, error: 'Missing question.'};
  }

  try {
    const result = await callStorefrontMcp(
      'search_shop_policies_and_faqs',
      {
        query: question,
        ...(policyContext ? {context: policyContext} : {}),
      },
      toolContext.context.env.PUBLIC_STORE_DOMAIN,
    );

    return {
      ok: true,
      source: 'shopify_storefront_mcp',
      question,
      ...normalizePolicyResult(result),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Policy lookup is unavailable right now.',
    };
  }
}

async function getProductDetails(args, toolContext) {
  const handle =
    String(args?.handle || '').trim() ||
    extractHandleFromUrl(String(args?.product_url || '').trim(), 'product');

  if (!handle) {
    return {
      ok: false,
      error: 'Provide a product handle or a product URL.',
    };
  }

  const {product} = await toolContext.context.storefront.query(
    PRODUCT_DETAILS_QUERY,
    {
      variables: {handle},
      cache: toolContext.context.storefront.CacheShort(),
    },
  );

  if (!product) {
    return {
      ok: false,
      error: `Product not found for handle "${handle}".`,
    };
  }

  return {
    ok: true,
    product: {
      id: product.id,
      handle: product.handle,
      title: product.title,
      vendor: product.vendor,
      product_type: product.productType,
      description: truncateText(
        stripHtml(product.descriptionHtml || product.description || ''),
        2000,
      ),
      url:
        normalizeStorefrontUrl(product.onlineStoreUrl) ||
        `/products/${product.handle}`,
      featured_image: product.featuredImage
        ? {
            url: product.featuredImage.url,
            alt_text: product.featuredImage.altText || product.title,
          }
        : null,
      price_range: formatPriceRange(product.priceRange),
      options: Array.isArray(product.options)
        ? product.options.map((option) => ({
            name: option.name,
            values: option.values,
          }))
        : [],
      variants: Array.isArray(product?.variants?.nodes)
        ? product.variants.nodes.map((variant) => ({
            id: variant.id,
            title: variant.title,
            available_for_sale: Boolean(variant.availableForSale),
            price: formatMoney(variant.price),
            compare_at_price: formatMoney(variant.compareAtPrice),
            selected_options: variant.selectedOptions || [],
          }))
        : [],
    },
  };
}

async function getCartSummary(toolContext) {
  const cart = await toolContext.context.cart.get().catch(() => null);

  return {
    ok: true,
    cart: summarizeCart(cart),
  };
}

async function addToCart(args, toolContext) {
  const merchandiseId = String(args?.merchandise_id || '').trim();
  const quantity = clampInteger(args?.quantity, 1, 99, 1);

  if (!merchandiseId) {
    return {ok: false, error: 'Missing merchandise_id.'};
  }

  const result = await toolContext.context.cart.addLines([
    {merchandiseId, quantity},
  ]);

  if (result?.errors?.length) {
    return {
      ok: false,
      error:
        result.errors[0]?.message || 'Unable to add that item to the cart.',
    };
  }

  appendCartHeaders(
    toolContext.responseHeaders,
    toolContext.context.cart,
    result,
  );

  return {
    ok: true,
    message: 'Item added to cart.',
    cart: summarizeCart(result?.cart || null),
  };
}

async function updateCartLine(args, toolContext) {
  const lineId = String(args?.line_id || '').trim();
  const quantity = clampInteger(args?.quantity, 0, 99, 1);

  if (!lineId) {
    return {ok: false, error: 'Missing line_id.'};
  }

  let result;
  if (quantity === 0) {
    result = await toolContext.context.cart.removeLines([lineId]);
  } else {
    result = await toolContext.context.cart.updateLines([
      {
        id: lineId,
        quantity,
      },
    ]);
  }

  if (result?.errors?.length) {
    return {
      ok: false,
      error:
        result.errors[0]?.message ||
        'Unable to update that cart line right now.',
    };
  }

  appendCartHeaders(
    toolContext.responseHeaders,
    toolContext.context.cart,
    result,
  );

  return {
    ok: true,
    message: quantity === 0 ? 'Item removed from cart.' : 'Cart updated.',
    cart: summarizeCart(result?.cart || null),
  };
}

async function getAccountProfile(toolContext) {
  if (!toolContext.isLoggedIn) {
    return requiresLoginResult();
  }

  const {data, errors} = await toolContext.context.customerAccount.query(
    CUSTOMER_DETAILS_QUERY,
  );

  if (errors?.length || !data?.customer) {
    return {
      ok: false,
      error: 'Unable to load the signed-in account profile right now.',
    };
  }

  return {
    ok: true,
    customer: {
      first_name: data.customer.firstName || '',
      last_name: data.customer.lastName || '',
      addresses: Array.isArray(data.customer.addresses?.nodes)
        ? data.customer.addresses.nodes.map((address) => ({
            id: address.id,
            formatted: address.formatted || [],
            city: address.city || '',
            phone: address.phoneNumber || '',
          }))
        : [],
    },
  };
}

async function getRecentOrders(args, toolContext) {
  if (!toolContext.isLoggedIn) {
    return requiresLoginResult();
  }

  const first = clampInteger(args?.limit, 1, 10, 5);
  const {data, errors} = await toolContext.context.customerAccount.query(
    CUSTOMER_ORDERS_QUERY,
    {
      variables: {first},
    },
  );

  if (errors?.length || !data?.customer) {
    return {
      ok: false,
      error: 'Unable to load recent orders right now.',
    };
  }

  return {
    ok: true,
    orders: (data.customer.orders?.nodes || []).map((order) => ({
      id: order.id,
      number: order.number,
      name: `#${order.number}`,
      total: formatMoney(order.totalPrice),
      financial_status: order.financialStatus,
      fulfillment_status: order.fulfillments?.nodes?.[0]?.status || null,
      processed_at: order.processedAt,
      details_url: `/account/orders/${btoa(order.id)}`,
    })),
  };
}

async function getOrderDetails(args, toolContext) {
  if (!toolContext.isLoggedIn) {
    return requiresLoginResult();
  }

  const targetNumber = normalizeOrderNumber(args?.order_number);
  if (!targetNumber) {
    return {ok: false, error: 'Missing order_number.'};
  }

  const {data: ordersData, errors: orderListErrors} =
    await toolContext.context.customerAccount.query(CUSTOMER_ORDERS_QUERY, {
      variables: {first: 50},
    });

  if (orderListErrors?.length || !ordersData?.customer) {
    return {
      ok: false,
      error: 'Unable to search orders right now.',
    };
  }

  const matchedOrder = (ordersData.customer.orders?.nodes || []).find(
    (order) => normalizeOrderNumber(order.number) === targetNumber,
  );

  if (!matchedOrder?.id) {
    return {
      ok: false,
      error: `Order #${targetNumber} was not found on this signed-in account.`,
    };
  }

  const {data, errors} = await toolContext.context.customerAccount.query(
    CUSTOMER_ORDER_QUERY,
    {
      variables: {orderId: matchedOrder.id},
    },
  );

  if (errors?.length || !data?.order) {
    return {
      ok: false,
      error: `Unable to load order #${targetNumber}.`,
    };
  }

  const fulfillmentStatus =
    flattenConnection(data.order.fulfillments)[0]?.status || null;
  const discountValue = flattenConnection(data.order.discountApplications)[0]
    ?.value;

  return {
    ok: true,
    order: {
      id: data.order.id,
      name: data.order.name,
      processed_at: data.order.processedAt,
      fulfillment_status: fulfillmentStatus,
      subtotal: formatMoney(data.order.subtotal),
      total_tax: formatMoney(data.order.totalTax),
      total_price: formatMoney(data.order.totalPrice),
      status_page_url: data.order.statusPageUrl,
      details_url: `/account/orders/${btoa(data.order.id)}`,
      shipping_address: data.order.shippingAddress
        ? {
            name: data.order.shippingAddress.name || '',
            formatted: data.order.shippingAddress.formatted || [],
            area: data.order.shippingAddress.formattedArea || '',
          }
        : null,
      discount:
        discountValue?.__typename === 'MoneyV2'
          ? formatMoney(discountValue)
          : discountValue?.__typename === 'PricingPercentageValue'
          ? `${discountValue.percentage}%`
          : null,
      items: (data.order.lineItems?.nodes || []).map((line) => ({
        title: line.title,
        variant_title: line.variantTitle,
        quantity: line.quantity,
        price: formatMoney(line.price),
        total_discount: formatMoney(line.totalDiscount),
      })),
    },
  };
}

async function callStorefrontMcp(name, args, storeDomain) {
  const domain = sanitizeStoreDomain(storeDomain);
  if (!domain) {
    throw new Error('PUBLIC_STORE_DOMAIN is not configured.');
  }

  const response = await fetch(`https://${domain}/api/mcp`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      id: Date.now(),
      params: {
        name,
        arguments: args,
      },
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Storefront MCP request failed (${response.status}).`);
  }

  if (data?.error) {
    throw new Error(data.error.message || 'Storefront MCP returned an error.');
  }

  const result = data?.result || data;
  const structured = result?.structuredContent || null;
  const text = extractMcpText(result);
  const parsedText = safeParseJson(text);

  return {
    raw: result,
    structured,
    parsed: structured || parsedText || null,
    text,
  };
}

function extractMcpText(result) {
  if (typeof result?.text === 'string') {
    return truncateText(result.text, MAX_TEXT_BLOCK);
  }

  const parts = Array.isArray(result?.content)
    ? result.content
        .map((entry) => {
          if (typeof entry?.text === 'string') return entry.text;
          if (typeof entry?.content === 'string') return entry.content;
          return '';
        })
        .filter(Boolean)
    : [];

  return truncateText(parts.join('\n\n').trim(), MAX_TEXT_BLOCK);
}

function normalizeCatalogSearchResult(result) {
  const parsed = result.parsed;
  const arrayCandidate = pickFirstArray(parsed, [
    'products',
    'collections',
    'items',
    'results',
    'matches',
    'catalog',
  ]);

  const rawArray = Array.isArray(parsed) ? parsed : arrayCandidate;
  const entries = Array.isArray(rawArray)
    ? rawArray.slice(0, 12).map(normalizeCatalogEntry).filter(Boolean)
    : [];
  const products = entries.filter((entry) => entry.kind === 'product');
  const collections = entries.filter((entry) => entry.kind === 'collection');

  return {
    products,
    collections,
    raw_text: entries.length ? null : result.text || null,
  };
}

function normalizePolicyResult(result) {
  const parsed = result.parsed;
  const answer =
    firstString(
      parsed?.answer,
      parsed?.response,
      parsed?.text,
      parsed?.message,
      parsed?.content,
    ) || result.text;

  return {
    answer: answer || null,
    raw: parsed && !answer ? parsed : null,
  };
}

function normalizeCatalogEntry(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const url = normalizeStorefrontUrl(
    firstString(item.url, item.product_url, item.link, item.href),
  );
  const kind = detectCatalogItemKind(item, url);
  const handle =
    firstString(item.handle) || extractHandleFromUrl(url, kind) || null;
  const imageUrl =
    firstString(item.image_url, item.imageUrl, item.image, item.thumbnail) ||
    null;
  const variantId =
    firstString(
      item.variant_id,
      item.variantId,
      item.merchandise_id,
      item.merchandiseId,
    ) || null;
  const title =
    firstString(item.title, item.name, item.product_title, item.productTitle) ||
    null;

  if (!title && !url && !variantId) {
    return null;
  }

  return {
    kind,
    title,
    handle,
    url:
      url ||
      (handle
        ? kind === 'collection'
          ? `/collections/${handle}`
          : `/products/${handle}`
        : null),
    image_url: imageUrl,
    description:
      truncateText(
        firstString(item.description, item.body, item.summary, item.text) || '',
        420,
      ) || null,
    price:
      kind === 'product'
        ? firstString(
            item.price,
            item.formatted_price,
            item.formattedPrice,
            item.price_text,
          ) || null
        : null,
    currency: firstString(item.currency, item.currency_code, item.currencyCode),
    variant_id: kind === 'product' ? variantId : null,
    subtitle:
      kind === 'collection' ? firstString(item.subtitle) || 'Collection' : null,
  };
}

function detectCatalogItemKind(item, url) {
  const explicitType = firstString(
    item.type,
    item.kind,
    item.object_type,
    item.objectType,
    item.resource_type,
    item.resourceType,
  );

  if (explicitType) {
    const normalizedType = explicitType.toLowerCase();
    if (normalizedType.includes('collection')) {
      return 'collection';
    }
    if (
      normalizedType.includes('product') ||
      normalizedType.includes('variant')
    ) {
      return 'product';
    }
  }

  if (typeof url === 'string' && /\/collections\//i.test(url)) {
    return 'collection';
  }

  return 'product';
}

async function searchCatalogFallback(queries, toolContext, originalQuery = '') {
  const client = getTypesenseSearchClientFromEnv(toolContext.context.env);
  const queryList = Array.isArray(queries)
    ? queries
    : [String(queries || '').trim()].filter(Boolean);

  for (const currentQuery of queryList) {
    const result = await client
      .collections(TYPESENSE_PRODUCTS_COLLECTION)
      .documents()
      .search({
        q: expandCatalogSearchQueryTokens(currentQuery),
        query_by: 'title,sku,handle,tags',
        query_by_weights: '10,10,5,2',
        per_page: 8,
        prefix: true,
        infix: 'always,fallback,always,always',
        num_typos: '2,1,0,0',
        min_len_1typo: 5,
        min_len_2typo: 8,
        typo_tokens_threshold: 1,
        enable_typos_for_numerical_tokens: false,
        enable_typos_for_alpha_numerical_tokens: false,
        drop_tokens_threshold: 0,
        exhaustive_search: true,
        sort_by: '_text_match:desc,price:desc',
        prioritize_exact_match: true,
        prioritize_token_position: true,
        prioritize_num_matching_fields: true,
        text_match_type: 'max_score',
        filter_by: 'status:=active',
      });

    const hits = Array.isArray(result?.hits) ? result.hits : [];
    const mapped = hits.map(({document}) => ({
      kind: 'product',
      title: document.title,
      handle: document.handle,
      url:
        normalizeStorefrontUrl(document.url) || `/products/${document.handle}`,
      image_url: document.image || null,
      description: null,
      price:
        typeof document.price === 'number' && document.price > 0
          ? `${document.price}`
          : 'Call for price',
      currency: null,
      variant_id: null,
    }));

    const filtered = filterCatalogSearchResult(
      {products: mapped, collections: [], raw_text: null},
      originalQuery || currentQuery,
    );

    if (hasCatalogEntries(filtered)) {
      return filtered;
    }
  }

  return {
    products: [],
    collections: [],
    raw_text: null,
  };
}

function hasCatalogEntries(result) {
  return Boolean(result?.products?.length || result?.collections?.length);
}

function normalizeCatalogSearchQuery(query) {
  const raw = String(query || '').trim();
  if (!raw) {
    return '';
  }

  const normalized = raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s/+.-]/gu, ' ')
    .replace(
      /\b(i need|i want|i would like|i'm looking for|i am looking for|looking for|show me|find me|help me find|can you find|can you show me|could you show me|recommend|suggest|give me|a good|some|please)\b/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || raw;
}

function expandCatalogSearchQueryTokens(query) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\s+/)
    .flatMap((term) => {
      if (/^\d+$/.test(term)) {
        return [term, `${term}gb`];
      }

      return [term];
    })
    .join(' ');
}

function filterCatalogSearchResult(result, query) {
  const requestedFamily = getRequestedCatalogFamily(query);
  if (!requestedFamily) {
    return result;
  }

  const filteredProducts = Array.isArray(result?.products)
    ? result.products.filter((product) =>
        matchesRequestedCatalogFamily(product, requestedFamily),
      )
    : [];

  return {
    ...result,
    products: filteredProducts,
    raw_text:
      filteredProducts.length || result?.collections?.length
        ? null
        : result?.raw_text || null,
  };
}

function getRequestedCatalogFamily(query) {
  const normalized = String(query || '')
    .trim()
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  if (/\b(laptop|laptops|notebook|notebooks|macbook)\b/.test(normalized)) {
    return 'laptop';
  }

  if (
    /\b(desktop|desktops|gaming pc|pc build|tower pc|tower)\b/.test(normalized)
  ) {
    return 'desktop';
  }

  if (/\b(monitor|monitors|display)\b/.test(normalized)) {
    return 'monitor';
  }

  if (
    /\b(phone|phones|smartphone|smartphones|iphone|mobile|mobiles)\b/.test(
      normalized,
    )
  ) {
    return 'phone';
  }

  if (/\b(tablet|tablets|ipad|ipads)\b/.test(normalized)) {
    return 'tablet';
  }

  return null;
}

function matchesRequestedCatalogFamily(product, family) {
  const haystack = [
    product?.title,
    product?.handle,
    product?.url,
    product?.description,
    product?.subtitle,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!haystack) {
    return false;
  }

  switch (family) {
    case 'laptop':
      return (
        /\b(laptop|notebook|macbook|alienware|omen|nitro|legion|zenbook|vivobook|thinkpad|rog|predator)\b/.test(
          haystack,
        ) && !isAccessoryLikeProduct(haystack)
      );
    case 'desktop':
      return (
        /\b(desktop|pc|computer|tower|all in one|aio)\b/.test(haystack) &&
        !isAccessoryLikeProduct(haystack)
      );
    case 'monitor':
      return /\b(monitor|display)\b/.test(haystack);
    case 'phone':
      return (
        /\b(phone|smartphone|iphone|mobile|galaxy|pixel)\b/.test(haystack) &&
        !isAccessoryLikeProduct(haystack)
      );
    case 'tablet':
      return (
        /\b(tablet|ipad|tab)\b/.test(haystack) &&
        !isAccessoryLikeProduct(haystack)
      );
    default:
      return true;
  }
}

function isAccessoryLikeProduct(text) {
  return /\b(backpack|bag|sleeve|cooling|cooler|fan|pad|stand|holder|dock|docking|adapter|charger|cable|hub|case|cover|skin|sticker|mouse|keyboard|headset|speaker|controller|accessor(?:y|ies))\b/.test(
    String(text || '').toLowerCase(),
  );
}

function summarizeCart(cart) {
  if (!cart?.id) {
    return {
      id: null,
      total_quantity: 0,
      subtotal: null,
      total: null,
      cart_url: '/cart',
      checkout_url: null,
      items: [],
    };
  }

  const lines = Array.isArray(cart?.lines?.nodes) ? cart.lines.nodes : [];

  return {
    id: cart.id,
    total_quantity: cart.totalQuantity || 0,
    subtotal: formatMoney(cart.cost?.subtotalAmount),
    total: formatMoney(cart.cost?.totalAmount),
    cart_url: '/cart',
    checkout_url: cart.checkoutUrl || null,
    items: lines.map((line) => ({
      line_id: line.id,
      merchandise_id: line.merchandise?.id || null,
      product_id: line.merchandise?.product?.id || null,
      product_title: line.merchandise?.product?.title || null,
      variant_title: line.merchandise?.title || null,
      handle: line.merchandise?.product?.handle || null,
      quantity: line.quantity,
      price_each: formatMoney(line.cost?.amountPerQuantity),
      line_total: formatMoney(line.cost?.totalAmount),
    })),
  };
}

function appendCartHeaders(targetHeaders, cartApi, result) {
  const cartId = result?.cart?.id;
  if (!cartId) {
    return;
  }

  const cartHeaders = cartApi.setCartId(cartId);
  cartHeaders.forEach((value, key) => {
    targetHeaders.append(key, value);
  });
}

function requiresLoginResult() {
  return {
    ok: false,
    requires_login: true,
    login_url: '/account/login',
    account_url: '/account',
    error: 'The shopper must sign in to access account details.',
  };
}

function formatMoney(money) {
  if (!money?.amount || !money?.currencyCode) {
    return null;
  }

  return `${money.amount} ${money.currencyCode}`;
}

function formatPriceRange(priceRange) {
  const min = formatMoney(priceRange?.minVariantPrice);
  const max = formatMoney(priceRange?.maxVariantPrice);

  if (!min && !max) return null;
  if (min && max && min !== max) return `${min} - ${max}`;
  return min || max;
}

function normalizeOrderNumber(value) {
  const clean = String(value || '')
    .trim()
    .replace(/^#/, '');
  return clean || null;
}

function safeParseJson(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function sanitizeStoreDomain(domain) {
  return String(domain || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function pickFirstArray(value, keys) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  for (const key of keys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  return null;
}

function normalizeStorefrontUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  try {
    const parsed = new URL(raw, 'https://961souq.com');
    const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    const isInternal =
      raw.startsWith('/') ||
      hostname === '961souq.com' ||
      hostname === '961souqs.myshopify.com';

    if (isInternal) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
    }

    return parsed.toString();
  } catch {
    return raw.startsWith('/')
      ? raw
      : raw.replace(/^(https?:\/\/)www\./i, '$1');
  }
}

function extractHandleFromUrl(url, type = 'product') {
  if (!url) return null;

  try {
    const parsed = new URL(url, 'https://961souq.com');
    const basePath = type === 'collection' ? 'collections' : 'products';
    const match = parsed.pathname.match(
      new RegExp(`^\\/${basePath}\\/([^/?#]+)`, 'i'),
    );
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value, maxLength) {
  const text = String(value || '').trim();
  if (!text || text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}
