import {json} from '@shopify/remix-oxygen';
import {
  clampSearchLimit,
  createEmptySearchResponse,
  normalizeSearchResponse,
  SEARCH_DEFAULT_LIMIT,
  SEARCH_DEFAULT_SUGGEST_LIMIT,
  SEARCH_MIN_QUERY_LENGTH,
} from '../lib/customSearch';

const CACHE_CONTROL = 'public, max-age=10, stale-while-revalidate=60';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_SEARCH_MODEL = 'gpt-5.4-mini';
const DEFAULT_OPENAI_SEARCH_REASONING_EFFORT = 'none';
const SEARCH_INTENT_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_CORRECTION_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_RESPONSE_CACHE_TTL_MS = 15 * 1000;
const searchIntentCache = new Map<
  string,
  {
    value: SearchIntentResult;
    timestamp: number;
  }
>();
const searchCorrectionCache = new Map<
  string,
  {
    value: SearchCorrectionResult;
    timestamp: number;
  }
>();
const searchResponseCache = new Map<
  string,
  {
    value: ReturnType<typeof createEmptySearchResponse>;
    timestamp: number;
  }
>();

type SearchIntentResult = {
  intent: 'device' | 'accessory' | 'generic';
  subject: string;
  accessory: string;
  focusTerms: string[];
  excludeTerms: string[];
};

type SearchCorrectionResult = {
  correctedQuery: string;
  correctionConfidence: 'low' | 'medium' | 'high' | '';
  shouldReplace: boolean;
  changedTerms: string[];
  reason: string;
};

type OpenAIReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh';

function buildWorkerEndpoint(
  baseUrl: string,
  mode: 'search' | 'suggest',
): URL {
  const parsed = new URL(baseUrl);
  const normalizedPath = parsed.pathname.endsWith('/')
    ? parsed.pathname.slice(0, -1)
    : parsed.pathname;

  parsed.pathname = `${normalizedPath}/${mode}`;
  parsed.search = '';
  parsed.hash = '';

  return parsed;
}

function parseBooleanParam(value: string | null): boolean | null {
  if (value == null) return null;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return null;
}

function getOpenAISearchModel(context: any): string {
  const configured = context.env?.OPENAI_SEARCH_MODEL;
  return typeof configured === 'string' && configured.trim()
    ? configured.trim()
    : DEFAULT_OPENAI_SEARCH_MODEL;
}

function getOpenAISearchReasoningEffort(
  context: any,
): OpenAIReasoningEffort {
  const configured = context.env?.OPENAI_SEARCH_REASONING_EFFORT;
  return configured === 'low' ||
    configured === 'medium' ||
    configured === 'high' ||
    configured === 'xhigh' ||
    configured === 'none'
    ? configured
    : DEFAULT_OPENAI_SEARCH_REASONING_EFFORT;
}

function logOpenAIRequestFailure(
  task: 'intent' | 'correction',
  response: Response,
  openaiJson: any,
) {
  const error = openaiJson?.error;
  console.error('[api.custom-search] OpenAI request failed', {
    task,
    status: response.status,
    statusText: response.statusText,
    code: typeof error?.code === 'string' ? error.code : '',
    param: typeof error?.param === 'string' ? error.param : '',
    message: typeof error?.message === 'string' ? error.message : '',
  });
}

function logOpenAIIncompleteResponse(
  task: 'intent' | 'correction',
  openaiJson: any,
) {
  console.error('[api.custom-search] OpenAI response incomplete', {
    task,
    status: openaiJson?.status,
    incompleteDetails: openaiJson?.incomplete_details || null,
  });
}

function extractOutputText(openaiJson: any): string {
  if (typeof openaiJson?.output_text === 'string' && openaiJson.output_text) {
    return openaiJson.output_text.trim();
  }

  const output = Array.isArray(openaiJson?.output) ? openaiJson.output : [];
  let text = '';

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const block of content) {
      if (typeof block?.text === 'string' && block.text.trim()) {
        text += block.text;
      }
    }
  }

  return text.trim();
}

function cleanIntentValue(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 40);
}

function cleanIntentTerms(value: unknown, limit = 4): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) =>
      String(item || '')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 24),
    )
    .filter(Boolean)
    .filter((term, index, array) => array.indexOf(term) === index)
    .slice(0, limit);
}

function cleanCorrectedQuery(value: unknown): string {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function cleanShortReason(value: unknown): string {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 160);
}

function normalizeCorrectionConfidence(
  value: unknown,
): SearchCorrectionResult['correctionConfidence'] {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 0.8) return 'high';
    if (value >= 0.5) return 'medium';
    if (value > 0) return 'low';
  }

  return value === 'low' || value === 'medium' || value === 'high'
    ? value
    : '';
}

function buildOpenAIQueryInput(query: string, task: string) {
  return [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: `Search query: ${JSON.stringify(query)}\n${task}. Return JSON only.`,
        },
      ],
    },
  ];
}

function getQueryTerms(value: string): string[] {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function shouldUseCorrectedQuery(
  originalQuery: string,
  correction: SearchCorrectionResult | null,
): boolean {
  if (!correction) return false;

  const {correctedQuery} = correction;
  if (!correctedQuery) return false;

  return (
    correctedQuery.trim().toLowerCase() !== originalQuery.trim().toLowerCase()
  );
}

function parseIntentJson(text: string): SearchIntentResult | null {
  if (!text) return null;

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]);
    const intent =
      parsed?.intent === 'device' ||
      parsed?.intent === 'accessory' ||
      parsed?.intent === 'generic'
        ? parsed.intent
        : 'generic';

    return {
      intent,
      subject: cleanIntentValue(parsed?.subject),
      accessory: cleanIntentValue(parsed?.accessory),
      focusTerms: cleanIntentTerms(parsed?.focus_terms),
      excludeTerms: cleanIntentTerms(parsed?.exclude_terms),
    };
  } catch {
    return null;
  }
}

function parseCorrectionJson(text: string): SearchCorrectionResult | null {
  if (!text) return null;

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]);

    return {
      correctedQuery: cleanCorrectedQuery(parsed?.corrected_query),
      correctionConfidence: normalizeCorrectionConfidence(
        parsed?.correction_confidence,
      ),
      shouldReplace:
        typeof parsed?.should_replace === 'boolean'
          ? parsed.should_replace
          : Boolean(
              cleanCorrectedQuery(parsed?.corrected_query),
            ),
      changedTerms: cleanIntentTerms(parsed?.changed_terms, 8),
      reason: cleanShortReason(parsed?.reason),
    };
  } catch {
    return null;
  }
}

function shouldDetectSearchIntent(query: string, mode: 'search' | 'suggest') {
  if (mode !== 'search') return false;
  const trimmed = query.trim();
  if (trimmed.length < 3 || trimmed.length > 80) return false;
  return /[a-zA-Z]/.test(trimmed);
}

function buildSearchResponseCacheKey(input: {
  query: string;
  mode: 'search' | 'suggest';
  limit: number;
  page: number;
  available: boolean | null;
}): string {
  return [
    input.mode,
    input.query.trim().toLowerCase(),
    input.limit,
    input.page,
    input.available == null ? 'any' : String(input.available),
  ].join('|');
}

function getCachedSearchResponse(cacheKey: string) {
  const cached = searchResponseCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.timestamp >= SEARCH_RESPONSE_CACHE_TTL_MS) {
    searchResponseCache.delete(cacheKey);
    return null;
  }
  return cached.value;
}

function setCachedSearchResponse(
  cacheKey: string,
  value: ReturnType<typeof createEmptySearchResponse>,
) {
  searchResponseCache.set(cacheKey, {
    value,
    timestamp: Date.now(),
  });
}

async function detectSearchIntent(
  query: string,
  context: any,
): Promise<SearchIntentResult | null> {
  const cacheKey = query.trim().toLowerCase();
  const cached = searchIntentCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < SEARCH_INTENT_CACHE_TTL_MS) {
    return cached.value;
  }

  const openaiKey = context.env?.OPENAI_API_KEY;
  if (!openaiKey) {
    return null;
  }

  try {
    const payload = {
      model: getOpenAISearchModel(context),
      reasoning: {effort: getOpenAISearchReasoningEffort(context)},
      instructions:
        'Classify ecommerce search intent for a consumer electronics store. Return JSON only with keys intent, subject, accessory, focus_terms, exclude_terms. intent must be one of: device, accessory, generic. Use accessory when the user wants a case, cover, charger, cable, adapter, protector, stand, holder, keyboard, mouse, bag, sleeve, or similar add-on. Use device when the user is looking for the main product itself like iphone, ipad, samsung phone, macbook, laptop, airpods, playstation, monitor, tv. subject should be the main product family if clear. accessory should be the accessory type if clear. focus_terms should be up to 4 short terms that the search engine should prioritize in titles and tags. exclude_terms should be up to 4 short terms that likely represent the wrong product class for this query, such as case or cover when the user wants the actual device. Return empty strings or empty arrays when unknown. JSON only.',
      input: buildOpenAIQueryInput(query, 'Classify the ecommerce search intent'),
      text: {
        format: {
          type: 'json_object',
        },
      },
      max_output_tokens: 120,
    };

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const openaiJson = await response.json().catch(() => null);
    if (!response.ok) {
      logOpenAIRequestFailure('intent', response, openaiJson);
      return null;
    }
    if (openaiJson?.status === 'incomplete') {
      logOpenAIIncompleteResponse('intent', openaiJson);
      return null;
    }

    const parsed = parseIntentJson(extractOutputText(openaiJson));
    if (parsed) {
      searchIntentCache.set(cacheKey, {
        value: parsed,
        timestamp: Date.now(),
      });
    }

    return parsed;
  } catch {
    return null;
  }
}

async function detectSearchCorrection(
  query: string,
  context: any,
): Promise<SearchCorrectionResult | null> {
  const cacheKey = query.trim().toLowerCase();
  const cached = searchCorrectionCache.get(cacheKey);

  if (
    cached &&
    Date.now() - cached.timestamp < SEARCH_CORRECTION_CACHE_TTL_MS
  ) {
    return cached.value;
  }

  const openaiKey = context.env?.OPENAI_API_KEY;
  if (!openaiKey) {
    return null;
  }

  try {
    const payload = {
      model: getOpenAISearchModel(context),
      reasoning: {effort: getOpenAISearchReasoningEffort(context)},
      instructions:
        'You are a typo-correction engine for ecommerce search. Return JSON only with keys corrected_query, correction_confidence, should_replace, changed_terms, reason. Your job is to output the most likely intended query after fixing typos automatically. corrected_query must preserve user intent and fix typos, missing letters, swapped letters, repeated letters, spacing mistakes, and obvious brand/model misspellings. Do not broaden the query or add new product concepts. For obvious typos you must correct them: iphnoe -> iphone, ipohne -> iphone, iphne -> iphone, macbok -> macbook, mabcook -> macbook, airpds -> airpods, samsng -> samsung. If the user query contains a typo, return the corrected query and set should_replace to true. Only return an empty corrected_query when the original query is already correct. changed_terms must list the corrected terms. reason must briefly explain the correction. correction_confidence must be one of high, medium, low, or empty string. JSON only.',
      input: buildOpenAIQueryInput(query, 'Correct typos in the search query'),
      text: {
        format: {
          type: 'json_object',
        },
      },
      max_output_tokens: 120,
    };

    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const openaiJson = await response.json().catch(() => null);
    if (!response.ok) {
      logOpenAIRequestFailure('correction', response, openaiJson);
      return null;
    }
    if (openaiJson?.status === 'incomplete') {
      logOpenAIIncompleteResponse('correction', openaiJson);
      return null;
    }

    const parsed = parseCorrectionJson(extractOutputText(openaiJson));
    if (parsed) {
      searchCorrectionCache.set(cacheKey, {
        value: parsed,
        timestamp: Date.now(),
      });
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function loader({
  request,
  context,
}: {
  request: Request;
  context: any;
}) {
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get('q')?.trim() ?? '';
  const requestedMode = requestUrl.searchParams.get('mode');
  const mode =
    requestedMode === 'correct'
      ? 'correct'
      : requestedMode === 'suggest'
        ? 'suggest'
        : 'search';
  const defaultLimit =
    mode === 'suggest' ? SEARCH_DEFAULT_SUGGEST_LIMIT : SEARCH_DEFAULT_LIMIT;
  const limit = clampSearchLimit(
    requestUrl.searchParams.get('limit'),
    defaultLimit,
  );
  const page = Math.max(
    1,
    Number.parseInt(requestUrl.searchParams.get('page') || '1', 10) || 1,
  );
  const available = parseBooleanParam(requestUrl.searchParams.get('available'));
  const headers = {
    'Cache-Control': CACHE_CONTROL,
  };

  console.log('[api.custom-search] incoming request', {
    query,
    mode,
    limit,
    page,
    available,
  });

  if (query.length < SEARCH_MIN_QUERY_LENGTH) {
    console.log('[api.custom-search] short query, returning empty result', {
      query,
      mode,
    });

    if (mode === 'correct') {
      return json(
        {
          originalQuery: query,
          query,
          correctedQuery: '',
          shouldReplace: false,
          correctionConfidence: '',
          changedTerms: [],
          reason: '',
        },
        {headers},
      );
    }

    return json(createEmptySearchResponse(query), {headers});
  }

  if (mode === 'correct') {
    const correction = shouldDetectSearchIntent(query, 'search')
      ? await detectSearchCorrection(query, context)
      : null;
    const resolvedQuery = shouldUseCorrectedQuery(query, correction)
      ? correction!.correctedQuery
      : query;

    return json(
      {
        originalQuery: query,
        query: resolvedQuery,
        correctedQuery: correction?.correctedQuery || '',
        shouldReplace: Boolean(
          correction?.correctedQuery &&
            resolvedQuery.trim().toLowerCase() !== query.trim().toLowerCase(),
        ),
        correctionConfidence: correction?.correctionConfidence || '',
        changedTerms: correction?.changedTerms || [],
        reason: correction?.reason || '',
      },
      {headers},
    );
  }

  const searchServiceUrl = context.env?.SEARCH_SERVICE_URL;
  const searchServiceToken = context.env?.SEARCH_SERVICE_TOKEN;

  if (!searchServiceUrl) {
    console.error(
      '[api.custom-search] SEARCH_SERVICE_URL is not configured on context.env',
    );
    return json(createEmptySearchResponse(query), {headers});
  }

  const endpoint = buildWorkerEndpoint(searchServiceUrl, mode);
  const shouldUseAI = shouldDetectSearchIntent(query, mode);
  const [searchCorrection, searchIntent] = shouldUseAI
    ? await Promise.all([
        detectSearchCorrection(query, context),
        detectSearchIntent(query, context),
      ])
    : [null, null];
  const resolvedQuery = shouldUseCorrectedQuery(query, searchCorrection)
    ? searchCorrection!.correctedQuery
    : query;
  const responseCacheKey = buildSearchResponseCacheKey({
    query: resolvedQuery,
    mode,
    limit,
    page,
    available,
  });
  const cachedResponse = getCachedSearchResponse(responseCacheKey);

  if (cachedResponse) {
    console.log('[api.custom-search] response cache hit', {
      query,
      resolvedQuery,
      mode,
      limit,
      page,
      available,
    });
    return json(cachedResponse, {headers});
  }

  endpoint.searchParams.set('q', resolvedQuery);
  endpoint.searchParams.set('limit', String(limit));

  if (mode === 'search') {
    endpoint.searchParams.set('page', String(page));
    if (available != null) {
      endpoint.searchParams.set('available', String(available));
    }
    if (searchIntent?.intent && searchIntent.intent !== 'generic') {
      endpoint.searchParams.set('intent', searchIntent.intent);
      if (searchIntent.subject) {
        endpoint.searchParams.set('intent_subject', searchIntent.subject);
      }
      if (searchIntent.accessory) {
        endpoint.searchParams.set('intent_accessory', searchIntent.accessory);
      }
      if (searchIntent.focusTerms.length) {
        endpoint.searchParams.set(
          'intent_focus',
          searchIntent.focusTerms.join(','),
        );
      }
      if (searchIntent.excludeTerms.length) {
        endpoint.searchParams.set(
          'intent_exclude',
          searchIntent.excludeTerms.join(','),
        );
      }
    }
  }

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
  };

  if (searchServiceToken) {
    requestHeaders.Authorization = `Bearer ${searchServiceToken}`;
  }

  try {
    console.log('[api.custom-search] proxying request', {
      query,
      resolvedQuery,
      mode,
      searchCorrection,
      searchIntent,
      endpoint: endpoint.toString(),
      hasToken: Boolean(searchServiceToken),
    });

    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: requestHeaders,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      console.error('[api.custom-search] worker error', {
        url: endpoint.toString(),
        status: response.status,
        statusText: response.statusText,
        body: errorBody,
      });
      return json(createEmptySearchResponse(query), {headers});
    }

    const normalized = normalizeSearchResponse(
      await response.json(),
      resolvedQuery,
    );
    const responsePayload = {
      ...normalized,
      query: resolvedQuery,
      normalizedQuery: resolvedQuery.trim().toLowerCase(),
      debugCorrection: {
        originalQuery: query,
        resolvedQuery,
        correctionSource: searchCorrection ? 'llm' : 'none',
        correctionConfidence: searchCorrection?.correctionConfidence || '',
        correctedQuery: searchCorrection?.correctedQuery || '',
        shouldReplace: Boolean(searchCorrection?.shouldReplace),
        changedTerms: searchCorrection?.changedTerms || [],
        reason: searchCorrection?.reason || '',
      },
    };
    setCachedSearchResponse(responseCacheKey, responsePayload);
    console.log('[api.custom-search] proxy success', {
      query,
      resolvedQuery,
      mode,
      total: normalized.total,
      products: normalized.products.length,
      suggestions: normalized.suggestions.length,
      tookMs: normalized.tookMs,
    });

    return json(responsePayload, {headers});
  } catch (error) {
    console.error('[api.custom-search] worker request failed', {
      query,
      resolvedQuery,
      mode,
      endpoint: endpoint.toString(),
      error,
    });
    return json(createEmptySearchResponse(resolvedQuery), {headers});
  }
}
