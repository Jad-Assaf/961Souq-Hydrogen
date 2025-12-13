// app/routes/api.typesensesearch.jsx
import {json} from '@shopify/remix-oxygen';
import {
  getTypesenseSearchClientFromEnv,
  TYPESENSE_PRODUCTS_COLLECTION,
} from '~/lib/typesense.server';

export async function loader({request, context}) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';
  const perPage = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get('perPage') ?? '10', 10)),
  );
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));

  if (!q) return json({hits: [], found: 0, page, perPage});

  const client = getTypesenseSearchClientFromEnv(context.env);

  const searchParams = {
    q,
    query_by: 'title,tags',
    query_by_weights: '8,2',
    per_page: perPage,
    page,
    prefix: true,
    infix: 'always,always',
    num_typos: '1,0',
    min_len_1typo: 4,
    min_len_2typo: 7,
    typo_tokens_threshold: 1,
    enable_typos_for_numerical_tokens: false,
    enable_typos_for_alpha_numerical_tokens: false,
    drop_tokens_threshold: 0,
    exhaustive_search: true,
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
      })) ?? [];

    return json({hits, found: result.found ?? 0, page, perPage});
  } catch (error) {
    console.error('Typesense search error', error);
    return json({error: 'Search failed'}, {status: 500});
  }
}
