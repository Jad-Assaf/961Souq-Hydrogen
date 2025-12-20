// app/lib/search-suggestions.server.js
import {
  getTypesenseSearchClientFromEnv,
  TYPESENSE_PRODUCTS_COLLECTION,
} from '~/lib/typesense.server';

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

  const openaiKey = context.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return [];
  }

  const client = getTypesenseSearchClientFromEnv(context.env);

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
      const lower = term.toLowerCase();
      if (term && term.length >= 2 && term.length < 45 && !seenSpellings.has(lower)) {
        seenSpellings.add(lower);
        const similarity = calculateSimilarity(originalQuery, term);
        correctSpellings.push({term, similarity, source});
      }
    };

    // Extract product terms from matched products
    similarProducts.hits?.forEach(({document}) => {
      if (document.title) {
        const title = document.title.trim();
        const words = title.split(/\s+/).filter(w => w.length > 0);
        
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
          if (cleanWord.length >= 4 && cleanWord.length < 25 && /^[a-zA-Z]/.test(cleanWord)) {
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
    const highQualityMatches = correctSpellings.filter(s => s.similarity > 40);
    if (highQualityMatches.length >= 2) {
      return highQualityMatches.slice(0, 6).map(s => s.term);
    }

    // 2) Use GPT for typo correction with best product terms as context
    const topTerms = correctSpellings
      .slice(0, 6)
      .map(s => s.term)
      .filter(t => t.length >= 3);
    
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
      return correctSpellings.slice(0, 6).map(s => s.term);
    }

    // Call GPT with focused typo correction prompt
    const payload = {
      model: 'gpt-5-nano',
      reasoning: {effort: 'minimal'},
      instructions: `Correct spelling errors in the query to match product names. Return 6 corrected queries, one per line.`,
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
      return correctSpellings.slice(0, 6).map(s => s.term);
    }

    const suggestionsText = extractOutputText(openaiJson);
    
    // Parse GPT suggestions
    let gptSuggestions = [];
    if (suggestionsText) {
      gptSuggestions = suggestionsText
        .split('\n')
        .map((line) => line.trim())
        .map((line) => line.replace(/^[\d\-•*.\s"']+/, '').replace(/["']+$/, '').trim())
        .filter((s) => s && s.length >= 2 && s.length < 50)
        .slice(0, 6);
    }

    // Score GPT suggestions and combine with direct matches
    const allSuggestions = [
      ...gptSuggestions.map(term => ({term, similarity: calculateSimilarity(originalQuery, term), source: 'gpt'})),
      ...correctSpellings
    ];
    
    // Sort by similarity and deduplicate
    allSuggestions.sort((a, b) => b.similarity - a.similarity);
    const unique = [];
    const seen = new Set();
    for (const s of allSuggestions) {
      if (!s.term) continue;
      const lower = s.term.toLowerCase();
      if (!seen.has(lower) && unique.length < 6) {
        seen.add(lower);
        unique.push(s.term);
      }
    }

    return unique.length > 0 ? unique : correctSpellings.slice(0, 6).map(s => s.term);
  } catch (error) {
    return [];
  }
}

