export const SEARCH_API_PATH = '/api/custom-search';
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_DEFAULT_LIMIT = 24;
export const SEARCH_DEFAULT_SUGGEST_LIMIT = 8;
export const SEARCH_RESULTS_LIMIT = 30;
export const SEARCH_MAX_LIMIT = 50;

export type SearchPrice = {
  min?: number | null;
  max?: number | null;
  currencyCode?: string | null;
};

export type SearchImage = {
  url?: string | null;
  altText?: string | null;
};

export type SearchProduct = {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  productType?: string | null;
  availableForSale?: boolean | null;
  price?: SearchPrice | null;
  image?: SearchImage | null;
  url?: string | null;
  score?: number | null;
  matchedFields?: string[] | null;
};

export type SearchResponse = {
  query: string;
  normalizedQuery: string;
  total: number;
  products: SearchProduct[];
  suggestions: string[];
  tookMs: number;
};

type DebouncedFunction<T extends (...args: any[]) => void> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
};

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePrice(input: any): SearchPrice | null {
  if (!input || typeof input !== 'object') return null;

  const min =
    toNumber(input.min) ??
    toNumber(input.minPrice) ??
    toNumber(input.amount) ??
    null;
  const max =
    toNumber(input.max) ??
    toNumber(input.maxPrice) ??
    toNumber(input.amount) ??
    min;

  if (min == null && max == null) return null;

  return {
    min,
    max,
    currencyCode:
      typeof input.currencyCode === 'string' && input.currencyCode.trim()
        ? input.currencyCode
        : 'USD',
  };
}

function normalizeImage(input: any): SearchImage | null {
  if (!input || typeof input !== 'object') return null;

  const url =
    typeof input.url === 'string' && input.url.trim()
      ? input.url
      : typeof input.src === 'string' && input.src.trim()
      ? input.src
      : null;

  if (!url) return null;

  return {
    url,
    altText:
      typeof input.altText === 'string' && input.altText.trim()
        ? input.altText
        : typeof input.alt === 'string' && input.alt.trim()
        ? input.alt
        : null,
  };
}

function normalizeProduct(input: any): SearchProduct | null {
  if (!input || typeof input !== 'object') return null;

  const id = typeof input.id === 'string' ? input.id.trim() : '';
  const handle = typeof input.handle === 'string' ? input.handle.trim() : '';
  const title = typeof input.title === 'string' ? input.title.trim() : '';

  if (!id || !handle || !title) return null;

  return {
    id,
    handle,
    title,
    vendor:
      typeof input.vendor === 'string' && input.vendor.trim()
        ? input.vendor
        : null,
    productType:
      typeof input.productType === 'string' && input.productType.trim()
        ? input.productType
        : null,
    availableForSale:
      typeof input.availableForSale === 'boolean'
        ? input.availableForSale
        : typeof input.available === 'boolean'
        ? input.available
        : null,
    price: normalizePrice(input.price),
    image: normalizeImage(input.image),
    url:
      typeof input.url === 'string' && input.url.trim()
        ? input.url
        : `/products/${handle}`,
    score: toNumber(input.score),
    matchedFields: Array.isArray(input.matchedFields)
      ? input.matchedFields.filter(
          (value: unknown): value is string =>
            typeof value === 'string' && value.trim().length > 0,
        )
      : null,
  };
}

export function clampSearchLimit(limit: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(limit ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(SEARCH_MAX_LIMIT, Math.max(1, parsed));
}

export function createEmptySearchResponse(query = ''): SearchResponse {
  return {
    query,
    normalizedQuery: query.trim().toLowerCase(),
    total: 0,
    products: [],
    suggestions: [],
    tookMs: 0,
  };
}

export function normalizeSearchResponse(
  payload: unknown,
  fallbackQuery = '',
): SearchResponse {
  if (!payload || typeof payload !== 'object') {
    return createEmptySearchResponse(fallbackQuery);
  }

  const data = payload as any;
  const productsSource = Array.isArray(data.products) ? data.products : [];
  const suggestionsSource = Array.isArray(data.suggestions)
    ? data.suggestions
    : [];

  return {
    query:
      typeof data.query === 'string' ? data.query : String(fallbackQuery ?? ''),
    normalizedQuery:
      typeof data.normalizedQuery === 'string'
        ? data.normalizedQuery
        : String(fallbackQuery ?? '')
            .trim()
            .toLowerCase(),
    total: toNumber(data.total) ?? productsSource.length,
    products: productsSource
      .map((product) => normalizeProduct(product))
      .filter(Boolean) as SearchProduct[],
    suggestions: suggestionsSource.filter(
      (value: unknown): value is string =>
        typeof value === 'string' && value.trim().length > 0,
    ),
    tookMs: toNumber(data.tookMs) ?? 0,
  };
}

export function buildCustomSearchPath(
  query: string,
  options: {
    limit?: number;
    available?: boolean;
    mode?: 'search' | 'suggest' | 'correct';
    page?: number;
    useAI?: boolean;
  } = {},
): string {
  const params = new URLSearchParams();
  params.set('q', query);

  if (options.mode === 'correct') {
    params.set('mode', 'correct');
  } else if (options.mode === 'suggest') {
    params.set('mode', 'suggest');
    params.set(
      'limit',
      String(clampSearchLimit(options.limit, SEARCH_DEFAULT_SUGGEST_LIMIT)),
    );
  } else {
    params.set(
      'limit',
      String(clampSearchLimit(options.limit, SEARCH_DEFAULT_LIMIT)),
    );
    if (typeof options.page === 'number' && Number.isFinite(options.page)) {
      params.set('page', String(Math.max(1, Math.floor(options.page))));
    }
    if (typeof options.available === 'boolean') {
      params.set('available', String(options.available));
    }
    if (options.useAI === false) {
      params.set('ai', 'false');
    }
  }

  return `${SEARCH_API_PATH}?${params.toString()}`;
}

async function fetchSearchPath(
  path: string,
  query: string,
): Promise<SearchResponse> {
  try {
    const response = await fetch(path, {
      headers: {
        Accept: 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      console.error('[custom-search] fetch failed', {
        query,
        path,
        status: response.status,
        statusText: response.statusText,
      });
      return createEmptySearchResponse(query);
    }

    return normalizeSearchResponse(await response.json(), query);
  } catch (error) {
    console.error('[custom-search] fetch error', {query, path, error});
    return createEmptySearchResponse(query);
  }
}

export async function fetchCustomSearch(
  query: string,
  options: {
    limit?: number;
    available?: boolean;
    page?: number;
    useAI?: boolean;
  } = {},
): Promise<SearchResponse> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < SEARCH_MIN_QUERY_LENGTH) {
    return createEmptySearchResponse(trimmedQuery);
  }

  return fetchSearchPath(
    buildCustomSearchPath(trimmedQuery, {
      limit: options.limit,
      page: options.page,
      available: options.available,
      useAI: options.useAI,
    }),
    trimmedQuery,
  );
}

export async function fetchCustomSuggestions(
  query: string,
  limit = SEARCH_DEFAULT_SUGGEST_LIMIT,
): Promise<SearchResponse> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < SEARCH_MIN_QUERY_LENGTH) {
    return createEmptySearchResponse(trimmedQuery);
  }

  return fetchSearchPath(
    buildCustomSearchPath(trimmedQuery, {
      limit,
      mode: 'suggest',
    }),
    trimmedQuery,
  );
}

export function formatSearchPrice(price?: SearchPrice | null): string | null {
  if (!price) return null;

  const min = toNumber(price.min);
  const max = toNumber(price.max);
  const currencyCode = price.currencyCode || 'USD';

  if (min == null && max == null) return null;
  if ((min ?? max) === 0 && (max == null || max === 0)) {
    return 'Call For Price';
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
    minimumFractionDigits:
      (min != null && !Number.isInteger(min)) ||
      (max != null && !Number.isInteger(max))
        ? 2
        : 0,
  });

  if (min != null && max != null) {
    if (min === max) return formatter.format(min);
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }

  return formatter.format(min ?? max ?? 0);
}

export function withSearchImageWidth(
  imageUrl?: string | null,
  width?: number,
): string {
  const trimmedUrl = imageUrl?.trim();
  if (!trimmedUrl || !width || !Number.isFinite(width)) return trimmedUrl || '';

  const normalizedWidth = Math.max(1, Math.floor(width));

  try {
    const isAbsolute = /^https?:\/\//i.test(trimmedUrl);
    const parsedUrl = new URL(trimmedUrl, 'https://search-image.local');
    parsedUrl.searchParams.set('width', String(normalizedWidth));

    return isAbsolute
      ? parsedUrl.toString()
      : `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    const separator = trimmedUrl.includes('?') ? '&' : '?';
    return `${trimmedUrl}${separator}width=${normalizedWidth}`;
  }
}

export function debounce<T extends (...args: any[]) => void>(
  callback: T,
  wait = 180,
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, wait);
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debounced;
}
