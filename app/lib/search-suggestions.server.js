// app/lib/search-suggestions.server.js
import {
  getTypesenseSearchClientFromEnv,
  TYPESENSE_PRODUCTS_COLLECTION,
} from '~/lib/typesense.server';

// Simple in-memory cache to prevent duplicate OpenAI requests
// Key: query (lowercase), Value: { suggestions: [], timestamp: number }
const suggestionsCache = new Map();
const CACHE_TTL = 30000; // 30 seconds
const CACHE_MAX_SIZE = 100; // Max cached queries

// Clean up old cache entries periodically
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of suggestionsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      suggestionsCache.delete(key);
    }
  }
  // If cache is too large, remove oldest entries
  if (suggestionsCache.size > CACHE_MAX_SIZE) {
    const entries = Array.from(suggestionsCache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp,
    );
    const toRemove = entries.slice(0, suggestionsCache.size - CACHE_MAX_SIZE);
    toRemove.forEach(([key]) => suggestionsCache.delete(key));
  }
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

function cleanSuggestionText(text) {
  if (!text) return '';
  return text
    .replace(/\s*\((?:[^)]*(corrected|original|same)\b[^)]*)\)/gi, '')
    .replace(/\s+corrected\s+as\s+.+$/i, '')
    .trim();
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'been',
  'be',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'can',
  'this',
  'that',
  'these',
  'those',
  'i',
  'you',
  'he',
  'she',
  'it',
  'we',
  'they',
  'what',
  'which',
  'who',
  'when',
  'where',
  'why',
  'how',
  'all',
  'each',
  'every',
  'some',
  'any',
  'no',
  'not',
  'only',
  'just',
  'more',
  'most',
  'many',
  'much',
  'few',
  'little',
  'other',
  'another',
  'same',
  'different',
  'new',
  'old',
  'good',
  'bad',
  'best',
  'better',
  'big',
  'small',
  'large',
  'long',
  'short',
  'high',
  'low',
  'great',
  'very',
  'too',
  'so',
  'such',
  'here',
  'there',
  'up',
  'down',
  'out',
  'off',
  'over',
  'under',
  'again',
  'further',
  'then',
  'once',
  'about',
  'into',
  'through',
  'during',
  'before',
  'after',
  'above',
  'below',
  'between',
  'among',
  'within',
  'without',
  'throughout',
  'beside',
  'besides',
  'beyond',
  'across',
  'around',
  'near',
  'far',
  'inside',
  'outside',
  'behind',
  'beyond',
  'toward',
  'towards',
  'upon',
  'against',
  'along',
  'amid',
  'amongst',
  'amidst',
  'via',
  'per',
  'plus',
  'minus',
  'except',
  'including',
  'excluding',
  'concerning',
  'regarding',
  'considering',
  'following',
  'including',
  'excluding',
  'according',
  'depending',
]);

// Common color names to filter out
const COLORS = new Set([
  'red',
  'blue',
  'green',
  'yellow',
  'orange',
  'purple',
  'pink',
  'brown',
  'black',
  'white',
  'gray',
  'grey',
  'silver',
  'gold',
  'beige',
  'tan',
  'navy',
  'maroon',
  'olive',
  'lime',
  'aqua',
  'cyan',
  'teal',
  'turquoise',
  'violet',
  'indigo',
  'magenta',
  'coral',
  'salmon',
  'khaki',
  'ivory',
  'cream',
  'peach',
  'lavender',
  'plum',
  'mint',
  'amber',
  'bronze',
  'copper',
  'charcoal',
  'slate',
  'burgundy',
  'crimson',
  'emerald',
  'jade',
  'ruby',
  'sapphire',
  'topaz',
  'amethyst',
  'coral',
  'pearl',
  'ivory',
  'ebony',
]);

// Filter out stop words and colors from suggestions
function filterSuggestion(suggestion) {
  if (!suggestion) return false;

  const lower = suggestion.toLowerCase().trim();

  // Reject if it's just a stop word
  if (STOP_WORDS.has(lower)) return false;

  // Reject if it's just a color
  if (COLORS.has(lower)) return false;

  // Reject if it's only stop words (split and check all words)
  const words = lower.split(/\s+/);
  const allStopWords = words.every((word) => STOP_WORDS.has(word));
  if (allStopWords && words.length > 0) return false;

  // Reject if it's only colors
  const allColors = words.every((word) => COLORS.has(word));
  if (allColors && words.length > 0) return false;

  // Reject if it's a combination of only stop words and colors
  const allStopWordsOrColors = words.every(
    (word) => STOP_WORDS.has(word) || COLORS.has(word),
  );
  if (allStopWordsOrColors && words.length > 0) return false;

  return true;
}

// Calculate similarity between two strings (Levenshtein-inspired)
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // Exact match
  if (s1 === s2) return 100;

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 80;

  // Calculate character-based similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 100;

  // Count matching characters in order
  let matches = 0;
  let s1Index = 0;
  for (let i = 0; i < shorter.length; i++) {
    const char = shorter[i];
    const foundIndex = longer.indexOf(char, s1Index);
    if (foundIndex !== -1) {
      matches++;
      s1Index = foundIndex + 1;
    }
  }

  // Base similarity from character matches
  let similarity = (matches / longer.length) * 60;

  // Length similarity bonus
  const lengthDiff = Math.abs(longer.length - shorter.length);
  if (lengthDiff <= 1) similarity += 20;
  else if (lengthDiff <= 2) similarity += 10;
  else if (lengthDiff <= 3) similarity += 5;

  // Starting character bonus
  if (s1[0] === s2[0]) similarity += 10;

  // Common substring bonus
  let maxCommon = 0;
  for (let i = 0; i < shorter.length; i++) {
    for (let j = i + 2; j <= shorter.length; j++) {
      const substr = shorter.substring(i, j);
      if (longer.includes(substr) && substr.length > maxCommon) {
        maxCommon = substr.length;
      }
    }
  }
  similarity += maxCommon * 2;

  return Math.min(100, similarity);
}

/**
 * Shared function to generate search query suggestions using GPT-5-nano
 * @param {string} originalQuery - The user's search query
 * @param {object} context - Remix context with env and other resources
 * @returns {Promise<string[]>} Array of suggested search queries
 */
export async function generateSearchSuggestions(originalQuery, context) {
  if (!originalQuery?.trim()) {
    return [];
  }

  // Check cache first (debounce mechanism)
  const queryKey = originalQuery.toLowerCase().trim();
  cleanupCache();
  const cached = suggestionsCache.get(queryKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.suggestions;
  }

  const openaiKey = context.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return [];
  }

  const client = getTypesenseSearchClientFromEnv(context.env);
  const originalQueryLower = originalQuery.toLowerCase().trim();

  try {
    // 1) Find products similar to the query using Typesense's typo tolerance
    const similarProducts = await client
      .collections(TYPESENSE_PRODUCTS_COLLECTION)
      .documents()
      .search({
        q: originalQuery,
        query_by: 'title,sku,handle,tags',
        per_page: 12,
        num_typos: 4,
        prefix: true,
        infix: 'always',
        drop_tokens_threshold: 0,
      });

    // Extract and score correct spellings
    const correctSpellings = [];
    const seenSpellings = new Set();
    const queryLower = originalQuery.toLowerCase();

    const addSpelling = (term, source = 'title') => {
      if (!term) return;

      // Clean the term - remove "(duplicate)" and normalize
      const cleaned = term.replace(/\s*\(duplicate\)/gi, '').trim();
      if (!cleaned) return;

      const lower = cleaned.toLowerCase();
      if (
        cleaned.length >= 2 &&
        cleaned.length < 45 &&
        !seenSpellings.has(lower)
      ) {
        seenSpellings.add(lower);
        const similarity = calculateSimilarity(originalQuery, cleaned);
        correctSpellings.push({term: cleaned, similarity, source});
      }
    };

    // Extract product terms from matched products
    similarProducts.hits?.forEach(({document}) => {
      if (document.title) {
        const title = document.title.trim();
        const words = title.split(/\s+/).filter((w) => w.length > 0);

        // Add full title if it's short enough
        if (title.length < 45) {
          addSpelling(title, 'full_title');
        }

        // Add first 2-3 words (most important part)
        if (words.length >= 2) {
          addSpelling(words.slice(0, 2).join(' '), 'title_start');
        }
        if (words.length >= 3) {
          addSpelling(words.slice(0, 3).join(' '), 'title_start');
        }

        // Add significant single words (product names)
        words.forEach((word) => {
          const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
          if (
            cleanWord.length >= 4 &&
            cleanWord.length < 25 &&
            /^[a-zA-Z]/.test(cleanWord)
          ) {
            addSpelling(cleanWord, 'word');
          }
        });
      }

      if (document.vendor && document.vendor.length < 30) {
        addSpelling(document.vendor, 'vendor');
      }
    });

    // Sort by similarity score
    correctSpellings.sort((a, b) => b.similarity - a.similarity);

    // If we have high-quality matches (similarity > 40), use them directly
    const highQualityMatches = correctSpellings
      .filter((s) => s.similarity > 40)
      .map((s) => s.term)
      .filter(filterSuggestion) // Filter out stop words and colors
      .filter((term) => {
        // Don't return the original query
        const termLower = term.toLowerCase().trim();
        if (termLower === originalQueryLower) return false;
        // Don't return if too similar to original (>90% similarity)
        const sim = calculateSimilarity(originalQuery, term);
        return sim <= 90;
      });
    if (highQualityMatches.length >= 2) {
      return highQualityMatches.slice(0, 6);
    }

    // 2) Use GPT for typo correction with best product terms as context
    const topTerms = correctSpellings
      .slice(0, 6)
      .map((s) => s.term)
      .filter((t) => t.length >= 3);

    // If no good matches, get popular product terms starting with same letter
    let spellingTerms = topTerms.join(', ');
    if (!spellingTerms && originalQuery.length >= 2) {
      const firstChar = originalQuery[0].toLowerCase();
      const prefixProducts = await client
        .collections(TYPESENSE_PRODUCTS_COLLECTION)
        .documents()
        .search({
          q: firstChar,
          query_by: 'title',
          per_page: 4,
          prefix: true,
        });

      const prefixTerms = [];
      prefixProducts.hits?.forEach(({document}) => {
        if (document.title) {
          const words = document.title.split(/\s+/);
          if (words.length >= 2) {
            prefixTerms.push(words.slice(0, 2).join(' '));
          }
        }
      });
      spellingTerms = prefixTerms.slice(0, 4).join(', ');
    }

    if (!spellingTerms) {
      const filtered = correctSpellings
        .map((s) => s.term)
        .filter(filterSuggestion)
        .filter((term) => {
          const termLower = term.toLowerCase().trim();
          if (termLower === originalQueryLower) return false;
          const sim = calculateSimilarity(originalQuery, term);
          return sim <= 90;
        })
        .slice(0, 6);
      return filtered;
    }

    // Call GPT with focused typo correction prompt
    const payload = {
      model: 'gpt-5-nano',
      reasoning: {effort: 'minimal'},
      instructions: `Correct spelling errors in the query to match product names. Return 6 corrected queries, one per line. Do NOT return the original query. Return only the corrected query text with no extra words or explanations.`,
      input: `"${originalQuery}" Products: ${spellingTerms}`,
      max_output_tokens: 60,
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

    if (!openaiRes.ok || openaiJson?.status === 'incomplete') {
      const filtered = correctSpellings
        .map((s) => s.term)
        .filter(filterSuggestion)
        .filter((term) => {
          const termLower = term.toLowerCase().trim();
          if (termLower === originalQueryLower) return false;
          const sim = calculateSimilarity(originalQuery, term);
          return sim <= 90;
        })
        .slice(0, 6);
      return filtered;
    }

    const suggestionsText = extractOutputText(openaiJson);

    // Parse GPT suggestions
    let gptSuggestions = [];
    if (suggestionsText) {
      gptSuggestions = suggestionsText
        .split('\n')
        .map((line) => line.trim())
        .map((line) =>
          line
            .replace(/^[\d\-•*.\s"']+/, '')
            .replace(/["']+$/, '')
            .trim(),
        )
        // Remove "(duplicate)" or similar text
        .map((line) => line.replace(/\s*\(duplicate\)/gi, '').trim())
        .map((line) => line.replace(/\s*\(.*?duplicate.*?\)/gi, '').trim())
        .map((line) => cleanSuggestionText(line))
        .filter((s) => s && s.length >= 2 && s.length < 50)
        .filter(filterSuggestion) // Filter out stop words and colors
        .filter((s) => {
          // Don't include the original query
          const sLower = s.toLowerCase().trim();
          if (sLower === originalQueryLower) return false;
          // Don't include if too similar to original
          const sim = calculateSimilarity(originalQuery, s);
          return sim <= 90;
        })
        .slice(0, 6);
    }

    // Score GPT suggestions and combine with direct matches
    const allSuggestions = [
      ...gptSuggestions.map((term) => ({
        term,
        similarity: calculateSimilarity(originalQuery, term),
        source: 'gpt',
      })),
      ...correctSpellings,
    ];

    // Clean and normalize terms before deduplication
    const cleanedSuggestions = allSuggestions
      .map((s) => {
        if (!s.term) return null;
        // Remove "(duplicate)" text
        const cleaned = cleanSuggestionText(
          s.term.replace(/\s*\(duplicate\)/gi, '').trim(),
        );
        return cleaned
          ? {...s, term: cleaned, normalized: cleaned.toLowerCase().trim()}
          : null;
      })
      .filter(Boolean);

    // Sort by similarity and deduplicate with improved logic
    cleanedSuggestions.sort((a, b) => b.similarity - a.similarity);
    const unique = [];
    const seen = new Set();
    const seenNormalized = new Set();

    for (const s of cleanedSuggestions) {
      if (!s.term) continue;

      // Filter out stop words and colors
      if (!filterSuggestion(s.term)) continue;

      const normalized = s.normalized || s.term.toLowerCase().trim();

      // CRITICAL: Don't suggest the original query (it returned 0 results!)
      if (normalized === originalQueryLower) continue;

      // Also check if suggestion is very similar to original (likely same typo)
      const similarityToOriginal = calculateSimilarity(originalQuery, s.term);
      if (similarityToOriginal > 90) continue; // Too similar to original

      // Check for exact match
      if (seen.has(normalized)) continue;

      // Check for contained/containing matches (e.g., "Lenovo Legion" vs "Lenovo Legion (duplicate)")
      let isDuplicate = false;
      for (const existing of seenNormalized) {
        // If one contains the other (after removing special chars), it's a duplicate
        const cleanExisting = existing
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const cleanCurrent = normalized
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (
          cleanExisting === cleanCurrent ||
          (cleanExisting.includes(cleanCurrent) && cleanCurrent.length >= 5) ||
          (cleanCurrent.includes(cleanExisting) && cleanExisting.length >= 5)
        ) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate && unique.length < 6) {
        seen.add(normalized);
        seenNormalized.add(normalized);
        unique.push(s.term);
      }
    }

    // Also filter the fallback correctSpellings
    const filteredCorrectSpellings = correctSpellings
      .map((s) => s.term)
      .filter(filterSuggestion)
      .filter((term) => {
        // Don't return the original query
        const termLower = term.toLowerCase().trim();
        if (termLower === originalQueryLower) return false;
        // Don't return if too similar to original
        const sim = calculateSimilarity(originalQuery, term);
        return sim <= 90;
      })
      .slice(0, 6);

    const finalSuggestions =
      unique.length > 0 ? unique : filteredCorrectSpellings;

    // Cache the result
    suggestionsCache.set(queryKey, {
      suggestions: finalSuggestions,
      timestamp: Date.now(),
    });

    return finalSuggestions;
  } catch (error) {
    return [];
  }
}
