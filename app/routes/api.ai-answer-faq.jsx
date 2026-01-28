// AI product chat endpoint
import {json} from '@shopify/remix-oxygen';

const DEFAULT_MAX_OUTPUT = 200; // Allow fuller answers to avoid truncation

// Server-side token tracking using IP + User-Agent fingerprint
// Uses Cloudflare Cache API for persistent storage (available in all Workers)
const tokenTrackingMap = new Map(); // Fallback for local dev
const DAILY_TOKEN_LIMIT = 200; // Server-side limit
const TOKEN_RESET_HOURS = 24;
const CACHE_NAME = 'ai-token-tracking'; // Cache name for token storage

function getClientFingerprint(request) {
  // Get IP address (check multiple headers for accuracy)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  let ip =
    cfConnectingIP || forwarded?.split(',')[0]?.trim() || realIP || 'unknown';

  // Normalize localhost IPs for consistency
  if (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip === '::ffff:127.0.0.1'
  ) {
    ip = 'localhost';
  }

  // Get User-Agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Normalize User-Agent to first 50 chars (more stable, less variation)
  // Remove version numbers that might change
  const normalizedUA = userAgent
    .substring(0, 50)
    .replace(/\d+\.\d+/g, 'X.X') // Replace version numbers
    .replace(/\s+/g, '-'); // Normalize whitespace

  // Create a stable fingerprint: IP + normalized User-Agent
  const fingerprint = `${ip}-${normalizedUA}`;

  // Debug logging (remove in production if needed)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Token Tracking] Fingerprint:', fingerprint.substring(0, 80));
  }

  return fingerprint;
}

function getCacheKey(fingerprint) {
  // Cache API requires fully-qualified URLs as keys
  // Use a custom scheme or convert to a valid URL
  return `https://token-tracking.local/${encodeURIComponent(fingerprint)}`;
}

async function getTokenUsageFromCache(cache, fingerprint) {
  if (!cache) {
    console.log('[Token Tracking] Cache not available, skipping cache read');
    return null;
  }

  try {
    console.log(
      '[Token Tracking] Reading from Cache for fingerprint:',
      fingerprint.substring(0, 50),
    );
    const cacheKey = getCacheKey(fingerprint);
    const cached = await cache.match(cacheKey);
    if (!cached) {
      console.log('[Token Tracking] Cache read result: No data');
      return null;
    }
    const data = await cached.json();
    console.log('[Token Tracking] Cache read result: Found data');
    return data;
  } catch (err) {
    console.error('[Token Tracking] Error reading from Cache:', err);
    return null;
  }
}

async function setTokenUsageInCache(cache, fingerprint, data) {
  if (!cache) {
    console.log('[Token Tracking] Cache not available, skipping cache write');
    return false;
  }

  try {
    // Store with expiration (24 hours)
    const ttl = TOKEN_RESET_HOURS * 60 * 60; // seconds
    const cacheKey = getCacheKey(fingerprint);
    console.log(
      '[Token Tracking] Writing to Cache for fingerprint:',
      fingerprint.substring(0, 50),
    );

    // Create a response with the data and cache headers
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${ttl}`,
      },
    });

    // Store in cache with expiration
    await cache.put(cacheKey, response);
    console.log('[Token Tracking] Cache write successful');
    return true;
  } catch (err) {
    console.error('[Token Tracking] Error writing to Cache:', err);
    console.error(
      '[Token Tracking] Cache error details:',
      err.message,
      err.stack,
    );
    return false;
  }
}

async function checkTokenLimit(fingerprint, requestedTokens, cache = null) {
  const now = Date.now();
  let record = null;

  // Try Cache API first (persistent storage)
  if (cache) {
    record = await getTokenUsageFromCache(cache, fingerprint);
  } else {
    // Fallback to in-memory Map
    record = tokenTrackingMap.get(fingerprint);
  }

  // Reset if it's been more than 24 hours
  if (!record || now > record.resetTime) {
    const resetTime = now + TOKEN_RESET_HOURS * 60 * 60 * 1000;
    const newRecord = {
      tokens: requestedTokens,
      resetTime,
    };

    if (cache) {
      await setTokenUsageInCache(cache, fingerprint, newRecord);
    } else {
      tokenTrackingMap.set(fingerprint, newRecord);
    }

    console.log(
      `[Token Tracking] New/Reset entry for ${fingerprint.substring(
        0,
        50,
      )}: ${requestedTokens}/${DAILY_TOKEN_LIMIT} tokens (${
        cache ? 'Cache' : 'Memory'
      })`,
    );

    return {allowed: true, remaining: DAILY_TOKEN_LIMIT - requestedTokens};
  }

  const newTotal = record.tokens + requestedTokens;
  if (newTotal > DAILY_TOKEN_LIMIT) {
    console.log(
      `[Token Tracking] Limit exceeded for ${fingerprint.substring(
        0,
        50,
      )}: ${newTotal}/${DAILY_TOKEN_LIMIT} tokens`,
    );
    return {allowed: false, remaining: 0};
  }

  record.tokens = newTotal;

  // Update storage
  if (cache) {
    await setTokenUsageInCache(cache, fingerprint, record);
  } else {
    tokenTrackingMap.set(fingerprint, record);
  }

  console.log(
    `[Token Tracking] Updated ${fingerprint.substring(
      0,
      50,
    )}: ${newTotal}/${DAILY_TOKEN_LIMIT} tokens (remaining: ${
      DAILY_TOKEN_LIMIT - newTotal
    }) (${cache ? 'Cache' : 'Memory'})`,
  );

  return {allowed: true, remaining: DAILY_TOKEN_LIMIT - newTotal};
}

// Cleanup old entries periodically (to prevent memory leaks)
function cleanupTokenTracking() {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, value] of tokenTrackingMap.entries()) {
    if (now > value.resetTime) {
      tokenTrackingMap.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[Token Tracking] Cleaned up ${cleaned} expired entries`);
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

async function fetchProductContext(productId, context) {
  if (context?.description) return context;
  return null;
}

export async function action({request, context}) {
  console.log(
    '[AI FAQ] Request received:',
    request.method,
    new Date().toISOString(),
  );

  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const openaiKey = context.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.error('[AI FAQ] Missing OPENAI_API_KEY');
    return json({error: 'Missing OPENAI_API_KEY'}, {status: 500});
  }

  // Cleanup old token tracking entries periodically (only for in-memory fallback)
  cleanupTokenTracking();

  const body = await request.json().catch(() => ({}));
  const {
    productId,
    messages = [],
    context: ctxPayload,
    maxOutputTokens,
    messageTooLong,
    productUrl,
    inputTokens,
  } = body;

  // Get Cache API (available in all Cloudflare Workers)
  // Cache is available via global caches API
  let cache = null;
  try {
    // Use global caches API available in Cloudflare Workers
    if (typeof caches !== 'undefined') {
      cache = await caches.open(CACHE_NAME);
      console.log('[Token Tracking] Cache API Available:', !!cache);
    } else {
      console.log(
        '[Token Tracking] Cache API not available (caches undefined)',
      );
    }
  } catch (err) {
    console.log(
      '[Token Tracking] Cache API error, using memory fallback:',
      err.message,
    );
  }

  // Server-side token limit check using IP + User-Agent fingerprint
  const fingerprint = getClientFingerprint(request);
  console.log('[Token Tracking] Fingerprint:', fingerprint.substring(0, 80));
  const estimatedTokens = typeof inputTokens === 'number' ? inputTokens : 50; // Default estimate
  console.log('[Token Tracking] Estimated tokens:', estimatedTokens);
  const tokenCheck = await checkTokenLimit(fingerprint, estimatedTokens, cache);
  console.log(
    '[Token Tracking] Token check result:',
    tokenCheck.allowed ? 'Allowed' : 'Blocked',
    'Remaining:',
    tokenCheck.remaining,
  );

  if (!tokenCheck.allowed) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[Token Tracking] Request blocked for ${fingerprint.substring(0, 50)}`,
      );
    }
    return json(
      {
        error: 'Daily token limit reached. Please try again tomorrow.',
        limitReached: true,
      },
      {status: 429},
    );
  }

  if (!productId) {
    return json({error: 'Missing productId'}, {status: 400});
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({error: 'No messages provided'}, {status: 400});
  }

  const productContext = await fetchProductContext(productId, ctxPayload);
  if (!productContext) {
    return json({error: 'Missing product context'}, {status: 400});
  }

  const userLang = /[\u0600-\u06FF]/.test(
    messages[messages.length - 1]?.content || '',
  )
    ? 'Arabic'
    : 'English';

  // If message is too long, respond accordingly
  // Note: We still track tokens for "message too long" responses (they use minimal tokens)
  if (messageTooLong) {
    // Still check token limit (messageTooLong responses use ~10 tokens)
    const messageTooLongTokenCheck = await checkTokenLimit(
      fingerprint,
      10,
      cache,
    );

    if (!messageTooLongTokenCheck.allowed) {
      return json(
        {
          error: 'Daily token limit reached. Please try again tomorrow.',
          limitReached: true,
        },
        {status: 429},
      );
    }
    const systemPrompt = [
      'You are an AI product assistant.',
      `The user just sent a message that exceeds the short-message limit (~80 words).`,
      `Politely inform them that their message is too long and ask them to shorten it to about 80 words or fewer.`,
      `Respond in ${userLang}.`,
      'Be brief and friendly.',
    ].join(' ');

    const chatPayload = {
      model: 'gpt-5-nano',
      reasoning: {effort: 'minimal'},
      instructions: systemPrompt,
      input: 'User: [Message too long]\n\nAssistant:',
      max_output_tokens: 50,
    };

    try {
      const aiRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify(chatPayload),
      });

      const aiData = await aiRes.json().catch(() => null);

      if (!aiRes.ok) {
        const msg =
          aiData?.error?.message || `OpenAI API error (${aiRes.status})`;
        return json({error: msg}, {status: 502});
      }

      let answer = extractOutputText(aiData);
      if (!answer) {
        // Fallback message
        answer =
          userLang === 'Arabic'
            ? 'رسالتك طويلة جداً. يرجى تقصيرها إلى حوالي ٨٠ كلمة أو أقل.'
            : 'Your message is too long. Please shorten it to about 80 words or fewer.';
      }

      // Remove any WhatsApp links that the LLM might have added
      const cleanedAnswer = answer
        .replace(/\[?واتساب\]?\([^)]+\)/gi, '')
        .replace(/\[?WhatsApp\]?\([^)]+\)/gi, '')
        .replace(/https?:\/\/wa\.me\/[^\s\)]+/gi, '')
        .trim();

      // Add WhatsApp link (simple, no prefilled text to avoid URL noise)
      const whatsappLink = 'https://wa.me/96181960961';

      const contactInfo =
        userLang === 'Arabic'
          ? `\n\nللتواصل مع فريق الدعم: [واتساب](${whatsappLink})`
          : `\n\nContact support: [WhatsApp](${whatsappLink})`;

      return json({success: true, answer: cleanedAnswer + contactInfo});
    } catch (err) {
      const fallbackMsg =
        userLang === 'Arabic'
          ? 'رسالتك طويلة جداً. يرجى تقصيرها إلى حوالي ٨٠ كلمة أو أقل.'
          : 'Your message is too long. Please shorten it to about 80 words or fewer.';

      // Add WhatsApp link (simple, no prefilled text to avoid URL noise)
      const whatsappLink = 'https://wa.me/96181960961';

      const contactInfo =
        userLang === 'Arabic'
          ? `\n\nللتواصل مع فريق الدعم: [واتساب](${whatsappLink})`
          : `\n\nContact support: [WhatsApp](${whatsappLink})`;

      return json({success: true, answer: fallbackMsg + contactInfo});
    }
  }

  const systemPrompt = [
    'You are an AI product assistant for 961 Souq.',
    'CRITICAL RULES:',
    '1. ONLY answer questions about this specific product (including specs/details/features), shipping, or warranty. NOTHING ELSE.',
    '2. If asked about anything else (other products, general questions, unrelated topics), politely decline and redirect to product/shipping/warranty only.',
    '3. Keep responses concise (one short paragraph or a few brief bullet points) while still providing the requested product specs/details when asked.',
    '4. DO NOT include any WhatsApp links, contact links, URLs, or contact instructions in your response. The system will add contact information automatically.',
    '5. Never write unfinished sentences. Use complete sentences only.',
    `6. Respond in ${userLang}.`,
    '7. If the user asks about price or cost and a positive price is available, treat the price as excluding VAT. Present BOTH: "Price (excl. VAT): <amount>" and "Price (incl. 11% VAT): <amount x 1.11>". Never describe an ex-VAT price as including VAT. Always remind them to confirm pricing with a support agent.',
    '8. If the price is missing or 0, clearly say "Call for price" and remind the user to confirm pricing with a support agent. Do NOT fabricate VAT numbers when price is missing/zero.',
    '9. If the user asks for specs/details/features, provide the available specifications from context; do not refuse. Keep it concise but include the key points.',
    '10. Answer the question directly without adding unrelated disclaimers.',
  ].join(' ');

  const description = productContext.description || '';
  // Use full description provided by product-context loader (already capped upstream)
  const trimmedDescription = description;

  // Derive VAT math if we can safely parse a single price
  const rawPrice = productContext.price || '';
  const priceRangeLike = rawPrice.includes('-');
  const numericPriceMatch = rawPrice.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  const basePrice =
    numericPriceMatch && !priceRangeLike ? Number(numericPriceMatch[1]) : null;
  const hasValidPrice = Number.isFinite(basePrice) && basePrice > 0;
  const vatPrice = hasValidPrice ? Number((basePrice * 1.11).toFixed(2)) : null;

  // Minimize context - only include essential info
  let contextSummary = [
    `Title: ${productContext.title || ''}`,
    productContext.vendor ? `Vendor: ${productContext.vendor}` : '',
    productContext.price ? `Price: ${productContext.price}` : '',
    `Description: ${trimmedDescription}`,
  ]
    .filter(Boolean)
    .join('\n');

  if (hasValidPrice) {
    contextSummary += `\nPrice shown (excl. VAT): ${basePrice}`;
    contextSummary += `\nPrice incl. 11% VAT: ${vatPrice}`;
    contextSummary += `\nPrice note: Website prices are displayed excluding VAT. Present excl. VAT first, then 11% VAT included.`;
  } else {
    contextSummary += `\nPrice note: Price unavailable/0. Respond with "Call for price" and remind to confirm pricing with a support agent. Do NOT calculate VAT when price is missing/zero.`;
  }

  // Add shipping/warranty only if explicitly asked about
  const lastMessage =
    messages[messages.length - 1]?.content?.toLowerCase() || '';
  const needsShipping =
    lastMessage.includes('shipping') || lastMessage.includes('delivery');
  const needsWarranty =
    lastMessage.includes('warranty') || lastMessage.includes('guarantee');

  if (needsShipping && productContext.shipping) {
    contextSummary += `\nShipping: ${productContext.shipping.substring(
      0,
      200,
    )}`;
  }
  if (needsWarranty && productContext.warranty) {
    contextSummary += `\nWarranty: ${productContext.warranty.substring(
      0,
      200,
    )}`;
  }

  // Convert chat messages to conversation format - only keep last 3 exchanges to reduce tokens
  const recentMessages = messages.slice(-6); // Last 3 user + 3 assistant messages
  const conversationHistory = recentMessages
    .map((m) => {
      const role = m.role === 'assistant' ? 'Assistant' : 'User';
      return `${role}: ${m.content}`;
    })
    .join('\n\n');

  const fullInput = `Product context:\n${contextSummary}\n\nConversation:\n${conversationHistory}\n\nAssistant:`;

  const chatPayload = {
    model: 'gpt-5-nano',
    reasoning: {effort: 'minimal'},
    instructions: systemPrompt,
    input: fullInput,
    max_output_tokens:
      typeof maxOutputTokens === 'number'
        ? maxOutputTokens
        : DEFAULT_MAX_OUTPUT,
  };

  try {
    const aiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(chatPayload),
    });

    const aiData = await aiRes.json().catch(() => null);

    if (!aiRes.ok) {
      const msg =
        aiData?.error?.message || `OpenAI API error (${aiRes.status})`;
      console.error('[AI FAQ] OpenAI error', {
        status: aiRes.status,
        message: aiData?.error?.message,
        type: aiData?.error?.type,
        code: aiData?.error?.code,
        raw: aiData,
      });
      return json(
        {
          error: msg,
          stage: 'openai',
          openaiStatus: aiRes.status,
          openaiCode: aiData?.error?.code || null,
        },
        {status: 502},
      );
    }

    // Extract answer from /v1/responses format (even if incomplete)
    let answer = extractOutputText(aiData);

    // Check for incomplete status (token budget issue)
    // But still try to return partial answer if available
    if (aiData?.status === 'incomplete') {
      if (answer) {
        // We have a partial answer, return it (it might be truncated)
        console.warn(
          '[AI FAQ] OpenAI incomplete but returning partial answer',
          {
            incomplete_details: aiData?.incomplete_details,
            usage: aiData?.usage,
            answerLength: answer.length,
          },
        );
        return json({success: true, answer, truncated: true});
      } else {
        // No answer extracted, return error
        console.error('[AI FAQ] OpenAI incomplete with no extractable answer', {
          incomplete_details: aiData?.incomplete_details,
          usage: aiData?.usage,
          raw: aiData,
        });
        return json(
          {
            error: 'OpenAI returned status=incomplete (token budget issue).',
            stage: 'openai_incomplete',
            incomplete_details: aiData?.incomplete_details || null,
            usage: aiData?.usage || null,
          },
          {status: 502},
        );
      }
    }

    if (!answer) {
      console.error('[AI FAQ] Empty answer from OpenAI', {
        httpStatus: aiRes.status,
        raw: aiData,
        responseStatus: aiData?.status,
        usage: aiData?.usage,
        output: aiData?.output,
      });
      return json({error: 'Empty response from AI'}, {status: 502});
    }

    // Generate WhatsApp link (simple, no prefilled text to avoid URL noise)
    const whatsappLink = 'https://wa.me/96181960961';

    // Remove any WhatsApp links that the LLM might have added
    let cleanedAnswer = answer
      .replace(/\[?واتساب\]?\([^)]+\)/gi, '') // Remove Arabic WhatsApp links
      .replace(/\[?WhatsApp\]?\([^)]+\)/gi, '') // Remove English WhatsApp links
      .replace(/https?:\/\/wa\.me\/[^\s\)]+/gi, '') // Remove plain WhatsApp URLs
      .trim();

    // Remove trailing empty bullet markers that can occur on truncation
    cleanedAnswer = cleanedAnswer.replace(/\n-\s*$/g, '').trim();

    // Add contact info and WhatsApp link to the answer (only if not already present)
    const hasWhatsAppLink =
      cleanedAnswer.toLowerCase().includes('whatsapp') ||
      cleanedAnswer.includes('واتساب') ||
      cleanedAnswer.includes('wa.me');

    if (!hasWhatsAppLink) {
      const contactInfo =
        userLang === 'Arabic'
          ? `\n\nللتواصل مع فريق الدعم: [واتساب](${whatsappLink})`
          : `\n\nContact support: [WhatsApp](${whatsappLink})`;
      const finalAnswer = cleanedAnswer + contactInfo;
      return json({success: true, answer: finalAnswer});
    }

    // If LLM already mentioned WhatsApp, just add our link
    const contactInfo =
      userLang === 'Arabic'
        ? `\n\n[واتساب](${whatsappLink})`
        : `\n\n[WhatsApp](${whatsappLink})`;
    const finalAnswer = cleanedAnswer + contactInfo;

    return json({success: true, answer: finalAnswer});
  } catch (err) {
    console.error('[AI FAQ] Exception while calling OpenAI', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return json({error: 'Failed to contact AI'}, {status: 500});
  }
}
