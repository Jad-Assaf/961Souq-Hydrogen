// AI product chat endpoint
import {json} from '@shopify/remix-oxygen';

const DEFAULT_MAX_OUTPUT = 80; // Reduced from 150 to save tokens

// Server-side token tracking using IP + User-Agent fingerprint
// Uses Cloudflare KV for persistent storage, falls back to in-memory Map if KV not available
const tokenTrackingMap = new Map(); // Fallback for local dev
const DAILY_TOKEN_LIMIT = 200; // Server-side limit
const TOKEN_RESET_HOURS = 24;
const KV_NAMESPACE_NAME = 'AI_TOKEN_TRACKING'; // KV namespace name (configure in wrangler.toml)

function getClientFingerprint(request) {
  // Get IP address (check multiple headers for accuracy)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  let ip = cfConnectingIP || (forwarded?.split(',')[0]?.trim()) || realIP || 'unknown';
  
  // Normalize localhost IPs for consistency
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip === '::ffff:127.0.0.1') {
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

async function getTokenUsageFromKV(kv, fingerprint) {
  if (!kv) return null;
  
  try {
    const data = await kv.get(fingerprint);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error('[Token Tracking] Error reading from KV:', err);
    return null;
  }
}

async function setTokenUsageInKV(kv, fingerprint, data) {
  if (!kv) return false;
  
  try {
    // Store with expiration (24 hours)
    const ttl = TOKEN_RESET_HOURS * 60 * 60; // seconds
    await kv.put(fingerprint, JSON.stringify(data), { expirationTtl: ttl });
    return true;
  } catch (err) {
    console.error('[Token Tracking] Error writing to KV:', err);
    return false;
  }
}

async function checkTokenLimit(fingerprint, requestedTokens, kv = null) {
  const now = Date.now();
  let record = null;
  
  // Try KV first (persistent storage)
  if (kv) {
    record = await getTokenUsageFromKV(kv, fingerprint);
  } else {
    // Fallback to in-memory Map
    record = tokenTrackingMap.get(fingerprint);
  }
  
  // Reset if it's been more than 24 hours
  if (!record || now > record.resetTime) {
    const resetTime = now + (TOKEN_RESET_HOURS * 60 * 60 * 1000);
    const newRecord = { 
      tokens: requestedTokens, 
      resetTime: resetTime
    };
    
    if (kv) {
      await setTokenUsageInKV(kv, fingerprint, newRecord);
    } else {
      tokenTrackingMap.set(fingerprint, newRecord);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Token Tracking] New/Reset entry for ${fingerprint.substring(0, 50)}: ${requestedTokens}/${DAILY_TOKEN_LIMIT} tokens (${kv ? 'KV' : 'Memory'})`);
    }
    
    return { allowed: true, remaining: DAILY_TOKEN_LIMIT - requestedTokens };
  }
  
  const newTotal = record.tokens + requestedTokens;
  if (newTotal > DAILY_TOKEN_LIMIT) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Token Tracking] Limit exceeded for ${fingerprint.substring(0, 50)}: ${newTotal}/${DAILY_TOKEN_LIMIT} tokens`);
    }
    return { allowed: false, remaining: 0 };
  }
  
  record.tokens = newTotal;
  
  // Update storage
  if (kv) {
    await setTokenUsageInKV(kv, fingerprint, record);
  } else {
    tokenTrackingMap.set(fingerprint, record);
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Token Tracking] Updated ${fingerprint.substring(0, 50)}: ${newTotal}/${DAILY_TOKEN_LIMIT} tokens (remaining: ${DAILY_TOKEN_LIMIT - newTotal}) (${kv ? 'KV' : 'Memory'})`);
  }
  
  return { allowed: true, remaining: DAILY_TOKEN_LIMIT - newTotal };
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
  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  const openaiKey = context.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return json({error: 'Missing OPENAI_API_KEY'}, {status: 500});
  }

  // Cleanup old token tracking entries periodically (only for in-memory fallback)
  cleanupTokenTracking();

  const body = await request.json().catch(() => ({}));
  const {productId, messages = [], context: ctxPayload, maxOutputTokens, messageTooLong, productUrl, inputTokens} = body;
  
  // Get KV namespace from environment (Cloudflare Workers)
  // KV namespace can be accessed via context.env.KV_NAMESPACE_NAME or context.env.AI_TOKEN_TRACKING
  const kv = context.env?.AI_TOKEN_TRACKING || context.env?.[KV_NAMESPACE_NAME] || null;
  
  // Server-side token limit check using IP + User-Agent fingerprint
  const fingerprint = getClientFingerprint(request);
  const estimatedTokens = typeof inputTokens === 'number' ? inputTokens : 50; // Default estimate
  const tokenCheck = await checkTokenLimit(fingerprint, estimatedTokens, kv);
  
  if (!tokenCheck.allowed) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Token Tracking] Request blocked for ${fingerprint.substring(0, 50)}`);
    }
    return json({
      error: 'Daily token limit reached. Please try again tomorrow.',
      limitReached: true,
    }, {status: 429});
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

  const userLang = /[\u0600-\u06FF]/.test(messages[messages.length - 1]?.content || '')
    ? 'Arabic'
    : 'English';

  // If message is too long, respond accordingly
  // Note: We still track tokens for "message too long" responses (they use minimal tokens)
  if (messageTooLong) {
    // Still check token limit (messageTooLong responses use ~10 tokens)
    const messageTooLongTokenCheck = await checkTokenLimit(fingerprint, 10, kv);
    
    if (!messageTooLongTokenCheck.allowed) {
      return json({
        error: 'Daily token limit reached. Please try again tomorrow.',
        limitReached: true,
      }, {status: 429});
    }
    const systemPrompt = [
      'You are an AI product assistant.',
      `The user just sent a message that exceeds the 100 token limit.`,
      `Politely inform them that their message is too long and ask them to shorten it.`,
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
        const msg = aiData?.error?.message || `OpenAI API error (${aiRes.status})`;
        return json({error: msg}, {status: 502});
      }

      let answer = extractOutputText(aiData);
      if (!answer) {
        // Fallback message
        answer = userLang === 'Arabic' 
          ? 'رسالتك طويلة جداً. يرجى تقصيرها إلى أقل من 100 رمز.'
          : 'Your message is too long. Please shorten it to under 100 tokens.';
      }

      // Remove any WhatsApp links that the LLM might have added
      const cleanedAnswer = answer
        .replace(/\[?واتساب\]?\([^)]+\)/gi, '')
        .replace(/\[?WhatsApp\]?\([^)]+\)/gi, '')
        .replace(/https?:\/\/wa\.me\/[^\s\)]+/gi, '')
        .trim();

      // Add WhatsApp link
      const whatsappNumber = '+96171888036';
      const productPageUrl = productUrl || 'https://961souq.com';
      const whatsappMessage = encodeURIComponent(`Hi, I have a question about: ${productContext?.title || 'this product'}\n${productPageUrl}`);
      const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;
      
      const contactInfo = userLang === 'Arabic' 
        ? `\n\nللتواصل مع فريق الدعم: [واتساب](${whatsappLink})`
        : `\n\nContact support: [WhatsApp](${whatsappLink})`;
      
      return json({success: true, answer: cleanedAnswer + contactInfo});
    } catch (err) {
      const fallbackMsg = userLang === 'Arabic' 
        ? 'رسالتك طويلة جداً. يرجى تقصيرها إلى أقل من 100 رمز.'
        : 'Your message is too long. Please shorten it to under 100 tokens.';
      
      // Add WhatsApp link
      const whatsappNumber = '+96171888036';
      const productPageUrl = productUrl || 'https://961souq.com';
      const whatsappMessage = encodeURIComponent(`Hi, I have a question about: ${productContext?.title || 'this product'}\n${productPageUrl}`);
      const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;
      
      const contactInfo = userLang === 'Arabic' 
        ? `\n\nللتواصل مع فريق الدعم: [واتساب](${whatsappLink})`
        : `\n\nContact support: [WhatsApp](${whatsappLink})`;
      
      return json({success: true, answer: fallbackMsg + contactInfo});
    }
  }

  const systemPrompt = [
    'You are an AI product assistant for 961 Souq.',
    'CRITICAL RULES:',
    '1. ONLY answer questions about: this specific product, shipping, warranty, or contact information. NOTHING ELSE.',
    '2. If asked about anything else (other products, general questions, unrelated topics), politely decline and redirect to product/shipping/warranty/contact topics only.',
    '3. Keep responses SHORT (1-2 sentences maximum). Be direct and concise. Do NOT add phrases like "please verify with customer support" or "contact support for details" - the system will add contact info automatically.',
    '4. DO NOT include any WhatsApp links, contact links, URLs, or contact instructions in your response. The system will add contact information automatically.',
    '5. Never write unfinished sentences. Use complete sentences only.',
    `6. Respond in ${userLang}.`,
    '7. Answer the question directly without adding disclaimers or verification reminders.',
  ].join(' ');

  // Aggressively trim description to reduce tokens (keep first 800 chars)
  const description = productContext.description || '';
  const trimmedDescription = description.length > 800 
    ? description.slice(0, 800) + '...' 
    : description;

  // Minimize context - only include essential info
  const contextSummary = [
    `Title: ${productContext.title || ''}`,
    productContext.vendor ? `Vendor: ${productContext.vendor}` : '',
    productContext.price ? `Price: ${productContext.price}` : '',
    `Description: ${trimmedDescription}`,
  ]
    .filter(Boolean)
    .join('\n');
  
  // Add shipping/warranty only if explicitly asked about
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const needsShipping = lastMessage.includes('shipping') || lastMessage.includes('delivery');
  const needsWarranty = lastMessage.includes('warranty') || lastMessage.includes('guarantee');
  
  if (needsShipping && productContext.shipping) {
    contextSummary += `\nShipping: ${productContext.shipping.substring(0, 200)}`;
  }
  if (needsWarranty && productContext.warranty) {
    contextSummary += `\nWarranty: ${productContext.warranty.substring(0, 200)}`;
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
      typeof maxOutputTokens === 'number' ? maxOutputTokens : DEFAULT_MAX_OUTPUT,
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
        console.warn('[AI FAQ] OpenAI incomplete but returning partial answer', {
          incomplete_details: aiData?.incomplete_details,
          usage: aiData?.usage,
          answerLength: answer.length,
        });
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

    // Generate WhatsApp link with product URL
    const whatsappNumber = '+96171888036';
    const productPageUrl = productUrl || (productContext?.handle ? `https://961souq.com/products/${productContext.handle}` : 'https://961souq.com');
    const whatsappMessage = encodeURIComponent(`Hi, I have a question about: ${productContext?.title || 'this product'}\n${productPageUrl}`);
    const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;
    
    // Remove any WhatsApp links that the LLM might have added
    const cleanedAnswer = answer
      .replace(/\[?واتساب\]?\([^)]+\)/gi, '') // Remove Arabic WhatsApp links
      .replace(/\[?WhatsApp\]?\([^)]+\)/gi, '') // Remove English WhatsApp links
      .replace(/https?:\/\/wa\.me\/[^\s\)]+/gi, '') // Remove plain WhatsApp URLs
      .trim();
    
    // Add contact info and WhatsApp link to the answer (only if not already present)
    const hasWhatsAppLink = cleanedAnswer.toLowerCase().includes('whatsapp') || 
                           cleanedAnswer.includes('واتساب') ||
                           cleanedAnswer.includes('wa.me');
    
    if (!hasWhatsAppLink) {
      const contactInfo = userLang === 'Arabic' 
        ? `\n\nللتواصل مع فريق الدعم: [واتساب](${whatsappLink})`
        : `\n\nContact support: [WhatsApp](${whatsappLink})`;
      const finalAnswer = cleanedAnswer + contactInfo;
      return json({success: true, answer: finalAnswer});
    }
    
    // If LLM already mentioned WhatsApp, just add our link
    const contactInfo = userLang === 'Arabic' 
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
