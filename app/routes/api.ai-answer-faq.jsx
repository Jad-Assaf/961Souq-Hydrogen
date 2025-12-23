// AI product chat endpoint
import {json} from '@shopify/remix-oxygen';

const DEFAULT_MAX_OUTPUT = 150;

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

  const body = await request.json().catch(() => ({}));
  const {productId, messages = [], context: ctxPayload, maxOutputTokens, messageTooLong, productUrl} = body;

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
  if (messageTooLong) {
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

      // Add WhatsApp link
      const whatsappNumber = '+96171888036';
      const productPageUrl = productUrl || 'https://961souq.com';
      const whatsappMessage = encodeURIComponent(`Hi, I have a question about: ${productContext?.title || 'this product'}\n${productPageUrl}`);
      const whatsappLink = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;
      
      const contactInfo = userLang === 'Arabic' 
        ? `\n\nللتواصل مع فريق الدعم: [واتساب](${whatsappLink})`
        : `\n\nContact support: [WhatsApp](${whatsappLink})`;
      
      return json({success: true, answer: answer + contactInfo});
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
    '3. NEVER give definitive answers. Always state that the user should verify with customer support for accurate information.',
    '4. Keep responses SHORT (2-3 sentences maximum). Use complete sentences only. Never write unfinished sentences.',
    '5. Always end with: "For accurate information, please contact our customer support team."',
    `6. Respond in ${userLang}.`,
    '7. Be helpful but cautious - you are providing general guidance, not definitive answers.',
  ].join(' ');

  // Trim description to avoid token limits (keep first 2000 chars)
  const description = productContext.description || '';
  const trimmedDescription = description.length > 2000 
    ? description.slice(0, 2000) + '...' 
    : description;

  const contextSummary = [
    `Title: ${productContext.title || ''}`,
    productContext.vendor ? `Vendor: ${productContext.vendor}` : '',
    productContext.type ? `Type: ${productContext.type}` : '',
    productContext.price ? `Price: ${productContext.price}` : '',
    productContext.warranty ? `Warranty: ${productContext.warranty}` : '',
    productContext.shipping ? `Shipping: ${productContext.shipping}` : '',
    `Description: ${trimmedDescription}`,
  ]
    .filter(Boolean)
    .join('\n');

  // Convert chat messages to conversation format for /v1/responses endpoint
  const conversationHistory = messages
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
    
    // Add contact info and WhatsApp link to the answer
    const contactInfo = userLang === 'Arabic' 
      ? `\n\nللتواصل مع فريق الدعم: [واتساب](${whatsappLink})`
      : `\n\nContact support: [WhatsApp](${whatsappLink})`;
    
    const finalAnswer = answer + contactInfo;

    return json({success: true, answer: finalAnswer});
  } catch (err) {
    console.error('[AI FAQ] Exception while calling OpenAI', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return json({error: 'Failed to contact AI'}, {status: 500});
  }
}
