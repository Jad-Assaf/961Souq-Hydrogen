import {json} from '@shopify/remix-oxygen';
import {
  clampSearchLimit,
  createEmptySearchResponse,
  normalizeSearchResponse,
  SEARCH_DEFAULT_LIMIT,
  SEARCH_DEFAULT_SUGGEST_LIMIT,
  SEARCH_MIN_QUERY_LENGTH,
  type SearchResponse,
} from '../lib/customSearch';

const CACHE_CONTROL = 'public, max-age=10, stale-while-revalidate=60';
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_OPENAI_SEARCH_MODEL = 'gpt-5.4-mini-2026-03-17';
const DEFAULT_OPENAI_SEARCH_REASONING_EFFORT = 'none';
const SEARCH_INTELLIGENCE_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_RESPONSE_CACHE_TTL_MS = 15 * 1000;
const MAX_EXPANSION_QUERIES = 4;
const SEARCH_EXPANSION_LIMIT = 8;
const searchIntelligenceCache = new Map<
  string,
  {
    value: SearchIntelligenceResult;
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

type SearchIntelligenceResult = {
  correction: SearchCorrectionResult;
  intent: SearchIntentResult;
};

type OpenAIReasoningEffort = 'none' | 'low' | 'medium' | 'high' | 'xhigh';

const ELECTRONICS_SYNONYM_GROUPS = [
  ['ps5', 'ps 5', 'playstation 5', 'playstation5', 'sony playstation 5'],
  ['ps4', 'ps 4', 'playstation 4', 'playstation4', 'sony playstation 4'],
  ['ps3', 'ps 3', 'playstation 3', 'playstation3'],
  ['ps portal', 'playstation portal'],
  ['dualsense', 'ps5 controller', 'playstation 5 controller'],
  ['xbox series x', 'series x', 'xbox sx'],
  ['xbox series s', 'series s', 'xbox ss'],
  ['xbox one', 'xbone'],
  ['nintendo switch', 'switch oled', 'switch lite'],
  [
    'xm6',
    '1000xm6',
    'wh-1000xm6',
    'wf-1000xm6',
    'sony xm6',
    'sony wh-1000xm6',
    'sony wf-1000xm6',
  ],
  ['xm5', '1000xm5', 'wh-1000xm5', 'sony xm5', 'sony wh-1000xm5'],
  ['xm4', '1000xm4', 'wh-1000xm4', 'sony xm4', 'sony wh-1000xm4'],
  ['xm3', '1000xm3', 'wh-1000xm3', 'sony xm3', 'sony wh-1000xm3'],
  ['wf xm5', 'wfxm5', 'wf-1000xm5', 'sony wf-1000xm5'],
  ['wf xm4', 'wfxm4', 'wf-1000xm4', 'sony wf-1000xm4'],
  ['ch720', 'ch720n', 'wh-ch720n', 'sony wh-ch720n'],
  ['ch520', 'wh-ch520', 'sony wh-ch520'],
  ['qc ultra', 'quietcomfort ultra', 'bose quietcomfort ultra'],
  ['qc earbuds', 'quietcomfort earbuds', 'bose quietcomfort earbuds'],
  ['airpods pro', 'airpod pro', 'apple airpods pro'],
  ['airpods max', 'airpod max', 'apple airpods max'],
  ['airpods', 'airpod', 'apple airpods'],
  [
    'whoop',
    'woop',
    'whop',
    'whooop',
    'whoop band',
    'whoop strap',
    'whoop 4.0',
    'whoop 5.0',
    'whoop mg',
  ],
  ['iphone', 'apple iphone'],
  ['ipad', 'apple ipad'],
  ['macbook', 'apple macbook'],
  ['apple watch', 'iwatch'],
  ['galaxy watch', 'samsung watch'],
  ['galaxy buds', 'samsung buds', 'buds pro', 'buds2 pro', 'buds 2 pro'],
  ['galaxy s24', 's24', 'samsung s24', 'samsung galaxy s24'],
  ['galaxy s25', 's25', 'samsung s25', 'samsung galaxy s25'],
  ['nvme', 'm.2', 'm2 ssd', 'm.2 ssd', 'ssd m2'],
  ['ssd', 'solid state drive'],
  ['hdd', 'hard drive', 'hard disk'],
  ['ram', 'memory'],
  ['gpu', 'graphics card', 'vga'],
  ['cpu', 'processor'],
  ['psu', 'power supply'],
  ['ups', 'battery backup'],
  ['motherboard', 'mainboard', 'mobo'],
  ['computer case', 'pc case', 'chassis'],
  ['thermal paste', 'thermal compound'],
  ['heatsink', 'heat sink'],
  ['liquid cooler', 'water cooler', 'aio cooler'],
  ['ddr5', 'ddr5 ram', 'ddr5 memory'],
  ['ddr4', 'ddr4 ram', 'ddr4 memory'],
  ['rtx', 'geforce rtx', 'nvidia rtx'],
  ['gtx', 'geforce gtx', 'nvidia gtx'],
  ['radeon', 'amd radeon'],
  ['ryzen', 'amd ryzen'],
  ['core i9', 'i9', 'intel i9'],
  ['core i7', 'i7', 'intel i7'],
  ['core i5', 'i5', 'intel i5'],
  ['core i3', 'i3', 'intel i3'],
  ['wifi', 'wi-fi', 'wireless'],
  ['wifi 7', 'wi-fi 7', '802.11be', 'be wifi'],
  ['wifi 6e', 'wi-fi 6e', '802.11ax 6e', 'ax wifi 6e'],
  ['wifi 6', 'wi-fi 6', '802.11ax', 'ax wifi'],
  ['wifi 5', 'wi-fi 5', '802.11ac', 'ac wifi'],
  ['router', 'wifi router', 'wireless router'],
  ['ap', 'access point'],
  ['mesh', 'mesh wifi', 'mesh router'],
  ['network switch', 'ethernet switch'],
  ['lan', 'ethernet', 'network cable'],
  ['poe', 'power over ethernet'],
  ['sfp', 'fiber module', 'sfp module'],
  ['onu', 'ont', 'fiber modem'],
  ['bt', 'bluetooth'],
  ['nfc', 'near field communication'],
  ['qi', 'wireless charging', 'qi charger'],
  ['tws', 'true wireless', 'wireless earbuds'],
  ['anc', 'noise cancelling', 'noise canceling'],
  ['nc', 'noise cancelling', 'noise canceling'],
  ['transparency mode', 'ambient mode', 'ambient sound'],
  ['hi res', 'hi-res', 'high resolution audio'],
  ['ldac', 'sony ldac'],
  ['aptx', 'apt-x', 'qualcomm aptx'],
  ['dac', 'digital to analog converter'],
  ['amp', 'amplifier'],
  ['soundbar', 'sound bar'],
  ['sub', 'subwoofer'],
  ['oled', 'amoled'],
  ['mini led', 'miniled'],
  ['micro led', 'microled'],
  ['qled', 'quantum dot'],
  ['hdr', 'high dynamic range'],
  ['dolby vision', 'dv hdr'],
  ['hfr', 'high frame rate'],
  ['hz', 'refresh rate'],
  ['uhd', '4k'],
  ['4k', 'uhd', '2160p', 'ultra hd'],
  ['fhd', '1080p', 'full hd'],
  ['hd', '720p'],
  ['qhd', '1440p', '2k', 'wqhd'],
  ['uwqhd', 'ultrawide qhd', '3440x1440'],
  ['5k', '5120x2880'],
  ['8k', '4320p', '8k uhd'],
  ['usb c', 'usb-c', 'type c', 'type-c'],
  ['usb a', 'usb-a', 'type a', 'type-a'],
  ['micro usb', 'micro-usb'],
  ['lightning', 'apple lightning'],
  ['pd', 'power delivery', 'usb pd'],
  ['gan', 'gallium nitride'],
  ['hdmi', 'hdmi cable'],
  ['hdmi 2.1', 'hdmi2.1'],
  ['dp', 'displayport'],
  ['vga', 'd sub', 'd-sub'],
  ['dvi', 'digital visual interface'],
  ['tb3', 'thunderbolt 3'],
  ['tb4', 'thunderbolt 4'],
  ['tb5', 'thunderbolt 5'],
  ['aio', 'all in one', 'all-in-one'],
  ['vr', 'virtual reality'],
  ['ar', 'augmented reality'],
  ['mr', 'mixed reality'],
  ['nas', 'network attached storage'],
  ['cctv', 'security camera', 'surveillance camera'],
  ['ptz', 'pan tilt zoom'],
  ['nvr', 'network video recorder'],
  ['dvr', 'digital video recorder'],
  ['pos', 'point of sale'],
  ['ups battery', 'replacement battery', 'ups replacement battery'],
  ['sim', 'sim card'],
  ['esim', 'e-sim', 'embedded sim'],
  ['sd card', 'memory card', 'secure digital card'],
  ['microsd', 'micro sd', 'micro-sd', 'tf card'],
] as const;

const DETERMINISTIC_SEARCH_CORRECTIONS = [
  {
    canonical: 'whoop',
    aliases: [
      'woop',
      'whop',
      'whoop',
      'whoo',
      'whooop',
      'wooop',
      'whopp',
      'whoopp',
      'woopp',
      'woops',
      'whoops',
    ],
  },
] as const;

function buildWorkerEndpoint(baseUrl: string, mode: 'search' | 'suggest'): URL {
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

function normalizeExpansionText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_/+.]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactExpansionText(value: string): string {
  return normalizeExpansionText(value).replace(/\s+/g, '');
}

function buildInchExpansionQueries(query: string): string[] {
  const expansions: string[] = [];
  const seen = new Set([query.trim().toLowerCase()]);
  const inchPattern =
    /(\d{1,3}(?:\.\d{1,2})?)\s*(?:"|″|inches|inch|in\b|-inch)/gi;
  const matches = [...query.matchAll(inchPattern)].slice(0, 2);

  for (const match of matches) {
    const size = match[1];
    const current = match[0];
    const variants = [`${size} inch`, `${size}"`, `${size} in`, `${size}-inch`];

    for (const variant of variants) {
      if (variant.toLowerCase() === current.toLowerCase()) continue;
      const expanded = query
        .replace(current, variant)
        .replace(/\s+/g, ' ')
        .trim();
      const key = expanded.toLowerCase();
      if (!expanded || seen.has(key)) continue;
      seen.add(key);
      expansions.push(expanded);
    }
  }

  return expansions;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getEditDistanceWithinLimit(
  first: string,
  second: string,
  limit: number,
): number {
  if (Math.abs(first.length - second.length) > limit) return limit + 1;

  let previous = Array.from({length: second.length + 1}, (_, index) => index);

  for (let i = 1; i <= first.length; i += 1) {
    const current = [i];
    let rowMin = current[0];

    for (let j = 1; j <= second.length; j += 1) {
      const cost = first[i - 1] === second[j - 1] ? 0 : 1;
      const value = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
      current[j] = value;
      rowMin = Math.min(rowMin, value);
    }

    if (rowMin > limit) return limit + 1;
    previous = current;
  }

  return previous[second.length];
}

function isDeterministicCorrectionMatch(token: string, canonical: string) {
  if (!token || token.length < 4 || token.length > canonical.length + 1) {
    return false;
  }

  return getEditDistanceWithinLimit(token, canonical, 1) <= 1;
}

function getDeterministicSearchCorrection(
  query: string,
): SearchCorrectionResult | null {
  let changed = false;
  const changedTerms: string[] = [];

  const correctedQuery = query.replace(/[\p{L}\p{N}]+/gu, (rawToken) => {
    const token = normalizeExpansionText(rawToken);
    for (const correction of DETERMINISTIC_SEARCH_CORRECTIONS) {
      if (
        correction.aliases.includes(token as any) ||
        isDeterministicCorrectionMatch(token, correction.canonical)
      ) {
        if (token !== correction.canonical) {
          changed = true;
          changedTerms.push(rawToken);
        }
        return correction.canonical;
      }
    }

    return rawToken;
  });

  if (!changed) return null;

  return {
    correctedQuery: correctedQuery.replace(/\s+/g, ' ').trim(),
    correctionConfidence: 'high',
    shouldReplace: true,
    changedTerms: Array.from(new Set(changedTerms)),
    reason: 'Known product-name typo corrected before LLM processing.',
  };
}

function replaceAliasInQuery(
  query: string,
  alias: string,
  replacement: string,
): string | null {
  const aliasWords = normalizeExpansionText(alias).split(' ').filter(Boolean);
  if (!aliasWords.length) return null;

  const pattern = aliasWords.map(escapeRegExp).join('[-_/+.\\s]*');
  const regex = new RegExp(
    `(^|[^\\p{L}\\p{N}])(${pattern})(?=$|[^\\p{L}\\p{N}])`,
    'iu',
  );
  if (!regex.test(query)) return null;

  return query
    .replace(regex, (_match, prefix) => `${prefix}${replacement}`)
    .replace(/\s+/g, ' ')
    .trim();
}

function getSearchExpansionQueries(query: string): string[] {
  const normalizedQuery = normalizeExpansionText(query);
  const compactQuery = compactExpansionText(query);
  const expansionQueries = buildInchExpansionQueries(query);
  const seen = new Set([normalizedQuery, compactQuery]);

  for (const expansion of expansionQueries) {
    seen.add(normalizeExpansionText(expansion));
    seen.add(compactExpansionText(expansion));
  }

  if (expansionQueries.length >= MAX_EXPANSION_QUERIES) {
    return expansionQueries.slice(0, MAX_EXPANSION_QUERIES);
  }

  for (const group of ELECTRONICS_SYNONYM_GROUPS) {
    const matchedAlias = group.find((alias) => {
      const normalizedAlias = normalizeExpansionText(alias);
      const compactAlias = compactExpansionText(alias);
      if (!normalizedAlias || !compactAlias) return false;
      if (
        normalizedQuery === normalizedAlias ||
        compactQuery === compactAlias
      ) {
        return true;
      }
      return (
        replaceAliasInQuery(
          normalizedQuery,
          normalizedAlias,
          normalizedAlias,
        ) != null
      );
    });

    if (!matchedAlias) continue;

    for (const synonym of group) {
      const normalizedSynonym = normalizeExpansionText(synonym);
      const compactSynonym = compactExpansionText(synonym);
      if (
        !normalizedSynonym ||
        seen.has(normalizedSynonym) ||
        seen.has(compactSynonym)
      ) {
        continue;
      }

      const expandedQuery =
        replaceAliasInQuery(normalizedQuery, matchedAlias, normalizedSynonym) ||
        normalizedSynonym;
      const normalizedExpandedQuery = normalizeExpansionText(expandedQuery);
      const compactExpandedQuery = compactExpansionText(expandedQuery);

      if (
        normalizedExpandedQuery &&
        !seen.has(normalizedExpandedQuery) &&
        !seen.has(compactExpandedQuery)
      ) {
        seen.add(normalizedExpandedQuery);
        seen.add(compactExpandedQuery);
        expansionQueries.push(normalizedExpandedQuery);
      }

      if (expansionQueries.length >= MAX_EXPANSION_QUERIES) {
        return expansionQueries;
      }
    }
  }

  return expansionQueries;
}

function getOpenAISearchModel(context: any): string {
  const configured = context.env?.OPENAI_SEARCH_MODEL;
  return typeof configured === 'string' && configured.trim()
    ? configured.trim()
    : DEFAULT_OPENAI_SEARCH_MODEL;
}

function getOpenAISearchReasoningEffort(context: any): OpenAIReasoningEffort {
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
  task: 'search_intelligence',
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
  task: 'search_intelligence',
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

  return value === 'low' || value === 'medium' || value === 'high' ? value : '';
}

function buildOpenAIQueryInput(query: string, task: string) {
  return [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: `Search query: ${JSON.stringify(
            query,
          )}\n${task}. Return JSON only.`,
        },
      ],
    },
  ];
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

function parseSearchIntelligenceJson(
  text: string,
): SearchIntelligenceResult | null {
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
      correction: {
        correctedQuery: cleanCorrectedQuery(parsed?.corrected_query),
        correctionConfidence: normalizeCorrectionConfidence(
          parsed?.correction_confidence,
        ),
        shouldReplace:
          typeof parsed?.should_replace === 'boolean'
            ? parsed.should_replace
            : Boolean(cleanCorrectedQuery(parsed?.corrected_query)),
        changedTerms: cleanIntentTerms(parsed?.changed_terms, 8),
        reason: cleanShortReason(parsed?.reason),
      },
      intent: {
        intent,
        subject: cleanIntentValue(parsed?.subject),
        accessory: cleanIntentValue(parsed?.accessory),
        focusTerms: cleanIntentTerms(parsed?.focus_terms),
        excludeTerms: cleanIntentTerms(parsed?.exclude_terms),
      },
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
  aiEnabled: boolean;
}): string {
  return [
    input.mode,
    input.query.trim().toLowerCase(),
    input.limit,
    input.page,
    input.available == null ? 'any' : String(input.available),
    input.aiEnabled ? 'ai' : 'raw',
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

function mergeSupplementalSearchResponses(
  primary: SearchResponse,
  supplementalResponses: SearchResponse[],
  maxAddedProducts = SEARCH_EXPANSION_LIMIT,
): SearchResponse {
  const products = [...primary.products];
  let addedProducts = 0;
  const seenProducts = new Set(
    products.map((product) => product.id || product.handle).filter(Boolean),
  );
  const suggestions = [...primary.suggestions];
  const seenSuggestions = new Set(
    suggestions.map((suggestion) => suggestion.trim().toLowerCase()),
  );

  for (const response of supplementalResponses) {
    for (const product of response.products) {
      if (addedProducts >= maxAddedProducts) break;
      const key = product.id || product.handle;
      if (!key || seenProducts.has(key)) continue;
      seenProducts.add(key);
      products.push(product);
      addedProducts += 1;
    }

    for (const suggestion of response.suggestions) {
      const key = suggestion.trim().toLowerCase();
      if (!key || seenSuggestions.has(key)) continue;
      seenSuggestions.add(key);
      suggestions.push(suggestion);
    }
  }

  return {
    ...primary,
    products,
    suggestions,
    total: Math.max(primary.total, products.length),
    tookMs: Math.max(
      primary.tookMs,
      ...supplementalResponses.map((response) => response.tookMs),
    ),
  };
}

function applyWorkerSearchParams(input: {
  endpoint: URL;
  query: string;
  limit: number;
  page: number;
  available: boolean | null;
  mode: 'search' | 'suggest';
  searchIntent: SearchIntentResult | null;
}) {
  input.endpoint.searchParams.set('q', input.query);
  input.endpoint.searchParams.set('limit', String(input.limit));

  if (input.mode !== 'search') return;

  input.endpoint.searchParams.set('page', String(input.page));
  if (input.available != null) {
    input.endpoint.searchParams.set('available', String(input.available));
  }
  if (input.searchIntent?.intent && input.searchIntent.intent !== 'generic') {
    input.endpoint.searchParams.set('intent', input.searchIntent.intent);
    if (input.searchIntent.subject) {
      input.endpoint.searchParams.set(
        'intent_subject',
        input.searchIntent.subject,
      );
    }
    if (input.searchIntent.accessory) {
      input.endpoint.searchParams.set(
        'intent_accessory',
        input.searchIntent.accessory,
      );
    }
    if (input.searchIntent.focusTerms.length) {
      input.endpoint.searchParams.set(
        'intent_focus',
        input.searchIntent.focusTerms.join(','),
      );
    }
    if (input.searchIntent.excludeTerms.length) {
      input.endpoint.searchParams.set(
        'intent_exclude',
        input.searchIntent.excludeTerms.join(','),
      );
    }
  }
}

async function fetchWorkerSearchResponse(input: {
  endpoint: URL;
  requestHeaders: Record<string, string>;
  fallbackQuery: string;
}): Promise<SearchResponse | null> {
  const response = await fetch(input.endpoint.toString(), {
    method: 'GET',
    headers: input.requestHeaders,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('[api.custom-search] worker error', {
      url: input.endpoint.toString(),
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    });
    return null;
  }

  return normalizeSearchResponse(await response.json(), input.fallbackQuery);
}

async function detectSearchIntelligence(
  query: string,
  context: any,
): Promise<SearchIntelligenceResult | null> {
  const cacheKey = query.trim().toLowerCase();
  const cached = searchIntelligenceCache.get(cacheKey);

  if (
    cached &&
    Date.now() - cached.timestamp < SEARCH_INTELLIGENCE_CACHE_TTL_MS
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
        'You are a search-intelligence engine for a consumer electronics ecommerce store. Return JSON only with keys corrected_query, correction_confidence, should_replace, changed_terms, reason, intent, subject, accessory, focus_terms, exclude_terms. First, correct typos in the search query. corrected_query must preserve user intent and fix typos, missing letters, swapped letters, repeated letters, spacing mistakes, and obvious brand/model misspellings. Do not broaden the query or add new product concepts. For obvious typos you must correct them: woop -> whoop, whop -> whoop, whooop -> whoop, iphnoe -> iphone, ipohne -> iphone, iphne -> iphone, macbok -> macbook, mabcook -> macbook, airpds -> airpods, samsng -> samsung. If the query contains a typo, return the corrected query and set should_replace to true. Only return an empty corrected_query when the original query is already correct. correction_confidence must be high, medium, low, or empty string. Then classify ecommerce search intent. intent must be one of: device, accessory, generic. Use accessory when the user wants a case, cover, charger, cable, adapter, protector, stand, holder, keyboard, mouse, bag, sleeve, or similar add-on. Use device when the user is looking for the main product itself like iphone, ipad, samsung phone, macbook, laptop, airpods, playstation, monitor, tv, or wearable tracker. subject should be the main product family if clear. accessory should be the accessory type if clear. focus_terms should be up to 4 short terms to prioritize in titles and tags. exclude_terms should be up to 4 short terms that likely represent the wrong product class, such as case or cover when the user wants the actual device. Return empty strings or empty arrays when unknown. JSON only.',
      input: buildOpenAIQueryInput(
        query,
        'Correct typos and classify ecommerce search intent',
      ),
      text: {
        format: {
          type: 'json_object',
        },
      },
      max_output_tokens: 180,
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
      logOpenAIRequestFailure('search_intelligence', response, openaiJson);
      return null;
    }
    if (openaiJson?.status === 'incomplete') {
      logOpenAIIncompleteResponse('search_intelligence', openaiJson);
      return null;
    }

    const parsed = parseSearchIntelligenceJson(extractOutputText(openaiJson));
    if (parsed) {
      searchIntelligenceCache.set(cacheKey, {
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
  const aiParam = parseBooleanParam(requestUrl.searchParams.get('ai'));
  const aiEnabled = aiParam !== false;
  const headers = {
    'Cache-Control': CACHE_CONTROL,
  };

  console.log('[api.custom-search] incoming request', {
    query,
    mode,
    limit,
    page,
    available,
    aiEnabled,
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
    const deterministicCorrection = getDeterministicSearchCorrection(query);
    const intelligence =
      !deterministicCorrection && shouldDetectSearchIntent(query, 'search')
        ? await detectSearchIntelligence(query, context)
        : null;
    const correction =
      deterministicCorrection || intelligence?.correction || null;
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
  const shouldUseAI = aiEnabled && shouldDetectSearchIntent(query, mode);
  const deterministicCorrection = getDeterministicSearchCorrection(query);
  const intelligenceQuery = deterministicCorrection?.correctedQuery || query;
  const searchIntelligence = shouldUseAI
    ? await detectSearchIntelligence(intelligenceQuery, context)
    : null;
  const searchCorrection =
    deterministicCorrection || searchIntelligence?.correction || null;
  const searchIntent = searchIntelligence?.intent || null;
  const resolvedQuery = shouldUseCorrectedQuery(query, searchCorrection)
    ? searchCorrection!.correctedQuery
    : query;
  const responseCacheKey = buildSearchResponseCacheKey({
    query: resolvedQuery,
    mode,
    limit,
    page,
    available,
    aiEnabled: shouldUseAI,
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

  applyWorkerSearchParams({
    endpoint,
    query: resolvedQuery,
    limit,
    page,
    available,
    mode,
    searchIntent,
  });

  const expansionQueries =
    mode === 'search' && page === 1
      ? getSearchExpansionQueries(resolvedQuery)
      : [];

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
      expansionQueries,
      aiEnabled: shouldUseAI,
      endpoint: endpoint.toString(),
      hasToken: Boolean(searchServiceToken),
    });

    const normalized = await fetchWorkerSearchResponse({
      endpoint,
      requestHeaders,
      fallbackQuery: resolvedQuery,
    });

    if (!normalized) {
      return json(createEmptySearchResponse(query), {headers});
    }

    const supplementalResponses = (
      await Promise.all(
        expansionQueries.map((expansionQuery) => {
          const expansionEndpoint = buildWorkerEndpoint(searchServiceUrl, mode);
          applyWorkerSearchParams({
            endpoint: expansionEndpoint,
            query: expansionQuery,
            limit: Math.min(limit, SEARCH_EXPANSION_LIMIT),
            page: 1,
            available,
            mode,
            searchIntent,
          });
          return fetchWorkerSearchResponse({
            endpoint: expansionEndpoint,
            requestHeaders,
            fallbackQuery: expansionQuery,
          });
        }),
      )
    ).filter((response): response is SearchResponse => Boolean(response));

    const merged = supplementalResponses.length
      ? mergeSupplementalSearchResponses(normalized, supplementalResponses)
      : normalized;
    const responsePayload = {
      ...merged,
      query: resolvedQuery,
      normalizedQuery: resolvedQuery.trim().toLowerCase(),
      debugCorrection: {
        originalQuery: query,
        resolvedQuery,
        correctionSource: searchCorrection
          ? deterministicCorrection
            ? 'deterministic'
            : 'llm'
          : aiEnabled
          ? 'none'
          : 'disabled',
        correctionConfidence: searchCorrection?.correctionConfidence || '',
        correctedQuery: searchCorrection?.correctedQuery || '',
        shouldReplace: Boolean(searchCorrection?.shouldReplace),
        changedTerms: searchCorrection?.changedTerms || [],
        reason: searchCorrection?.reason || '',
      },
      debugExpansion: {
        queries: expansionQueries,
        addedProducts: merged.products.length - normalized.products.length,
      },
    };
    setCachedSearchResponse(responseCacheKey, responsePayload);
    console.log('[api.custom-search] proxy success', {
      query,
      resolvedQuery,
      mode,
      expansionQueries,
      addedExpansionProducts:
        merged.products.length - normalized.products.length,
      total: merged.total,
      products: merged.products.length,
      suggestions: merged.suggestions.length,
      tookMs: merged.tookMs,
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
