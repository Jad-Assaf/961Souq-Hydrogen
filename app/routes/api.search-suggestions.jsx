// app/routes/api.search-suggestions.jsx
import {json} from '@shopify/remix-oxygen';
import {generateSearchSuggestions} from '~/lib/search-suggestions.server';

/**
 * API endpoint to generate search query suggestions using GPT-5-nano
 * when a user query returns 0 results from Typesense.
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const originalQuery = url.searchParams.get('q')?.trim() || '';

  const suggestions = await generateSearchSuggestions(originalQuery, context);
  return json({suggestions});
}


