import {json} from '@shopify/remix-oxygen';
import {
  getTypesenseSearchClientFromEnv,
  TYPESENSE_PRODUCTS_COLLECTION,
} from '~/lib/typesense.server';
import {generateSearchSuggestions} from '~/lib/search-suggestions.server';

/**
 * Loader for `/api/typesensesearch`.
 *
 * Expands numeric tokens in the query (e.g., `16` → `16 16gb`) before searching.
 */
export async function loader({request, context}) {
  const url = new URL(request.url);

  // Original query from the URL
  const originalQ = url.searchParams.get('q')?.trim() || '';

  // Helper to expand numeric tokens (e.g., 16 → "16 16gb")
  function expandNumericTokens(original) {
    const terms = original.split(/\s+/);
    const expanded = [];
    for (const term of terms) {
      if (/^\d+$/.test(term)) {
        expanded.push(term);
        expanded.push(`${term}gb`);
      } else {
        expanded.push(term);
      }
    }
    return expanded.join(' ');
  }

  const q = expandNumericTokens(originalQ);

  const perPage = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get('perPage') || '10', 10)),
  );
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));

  if (!q) {
    return json({hits: [], found: 0, page, perPage});
  }

  const client = getTypesenseSearchClientFromEnv(context.env);

  const searchParams = {
    q,
    query_by: 'title,sku,handle,tags',
    query_by_weights: '10,10,5,2',
    per_page: perPage,
    page,
    prefix: true,
    infix: 'always,fallback,always,always',
    num_typos: '2,1,0,0',
    min_len_1typo: 4,
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
    highlight_full_fields: 'title',
  };

  try {
    const result = await client
      .collections(TYPESENSE_PRODUCTS_COLLECTION)
      .documents()
      .search(searchParams);

    const hits =
      result.hits?.map(({document}) => ({
        id: document.id,
        title: document.title,
        handle: document.handle,
        vendor: document.vendor,
        price: document.price,
        image: document.image,
        url: document.url,
        available: document.available,
      })) || [];

    const found = result.found ?? hits.length;

    // Fetch GPT-powered suggestions (always, not just when 0 results)
    let suggestions = [];
    if (originalQ) {
      try {
        suggestions = await generateSearchSuggestions(originalQ, context);
      } catch (suggestError) {
        // Don't fail the whole request if suggestions fail
      }
    }

    return json({
      hits,
      found,
      page,
      perPage,
      suggestions: Array.isArray(suggestions) ? suggestions : [],
    });
  } catch (error) {
    return json({error: 'Search failed'}, {status: 500});
  }
}
