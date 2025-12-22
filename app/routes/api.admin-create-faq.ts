// app/routes/api.create-faq.js
/**
 * Creates an FAQ metaobject and attaches its reference to the product's
 * `custom.faqs` metafield (type: list.metaobject_reference).
 *
 * Environment variables are injected on context.env at runtime:
 *   - ADMIN_API_TOKEN         (private)
 *   - PUBLIC_STORE_DOMAIN     (public)
 */

// Simple in-memory rate limiting (IP-based)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per IP
const RATE_LIMIT_COOLDOWN = 60 * 60 * 1000; // 1 hour in milliseconds

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || realIP || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000 / 60); // minutes until reset
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW * 2);

function normalizeQuestion(question: string): string {
  return question.toLowerCase().trim().replace(/[^\w\s\u0600-\u06FF]/g, '');
}

function questionsAreSimilar(q1: string, q2: string, threshold = 0.7): boolean {
  const n1 = normalizeQuestion(q1);
  const n2 = normalizeQuestion(q2);
  
  // Exact match
  if (n1 === n2) return true;
  
  // Check if one contains the other (for short questions)
  if (n1.length < 20 || n2.length < 20) {
    if (n1.includes(n2) || n2.includes(n1)) return true;
  }
  
  // Simple word overlap check
  const words1 = new Set(n1.split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(n2.split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return false;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  const similarity = intersection.size / union.size;
  return similarity >= threshold;
}

async function publishMetaobject(faqId: string, shop: string, adminToken: string, apiVersion: string): Promise<void> {
  try {
    console.log('[FAQ CREATE] Attempting to publish metaobject:', faqId);
    const publishRes = await fetch(
      `https://${shop}/admin/api/${apiVersion}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': adminToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `mutation PublishMetaobject($id: ID!) {
            metaobjectPublish(id: $id) {
              metaobject { id status }
              userErrors { field message }
            }
          }`,
          variables: {
            id: faqId,
          },
        }),
      },
    );

    const publishData = await publishRes.json();
    console.log('[FAQ CREATE] Publish response:', {
      hasData: !!publishData?.data,
      hasMetaobject: !!publishData?.data?.metaobjectPublish?.metaobject,
      status: publishData?.data?.metaobjectPublish?.metaobject?.status,
      hasErrors: !!publishData?.data?.metaobjectPublish?.userErrors?.length,
      errors: publishData?.data?.metaobjectPublish?.userErrors,
    });
    
    if (publishData?.data?.metaobjectPublish?.userErrors?.length) {
      console.warn('[FAQ CREATE] Failed to publish metaobject (but it was created):', JSON.stringify(publishData.data.metaobjectPublish.userErrors, null, 2));
      // Don't fail the whole request if publish fails - the FAQ is still created
    } else if (publishData?.data?.metaobjectPublish?.metaobject) {
      const publishedStatus = publishData.data.metaobjectPublish.metaobject.status;
      console.log('[FAQ CREATE] FAQ published successfully! Status:', publishedStatus);
    } else {
      console.warn('[FAQ CREATE] Unexpected publish response:', JSON.stringify(publishData, null, 2));
    }
  } catch (publishError) {
    console.warn('[FAQ CREATE] Error publishing metaobject (but it was created):', publishError);
    // Don't fail the whole request if publish fails
  }
}

export const action = async ({ request, context }) => {
  /* -----------------------------------------------------------------
   *  Accept POST only
   * ----------------------------------------------------------------- */
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /* -----------------------------------------------------------------
   *  Rate limiting
   * ----------------------------------------------------------------- */
  const clientIP = getClientIP(request);
  const rateLimitCheck = checkRateLimit(clientIP);
  if (!rateLimitCheck.allowed) {
    console.warn('[FAQ CREATE] Rate limit exceeded for IP:', clientIP);
    const retryAfterMinutes = rateLimitCheck.retryAfter || 60;
    return new Response(
      JSON.stringify({ 
        error: `Too many requests. Please try again after 1 hour.`,
        rateLimited: true,
        retryAfter: retryAfterMinutes
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  /* -----------------------------------------------------------------
   *  Read secrets from context.env (not process.env)
   * ----------------------------------------------------------------- */
  const { ADMIN_API_TOKEN, PUBLIC_STORE_DOMAIN: SHOP } = context.env;

  if (!ADMIN_API_TOKEN || !SHOP) {
    return new Response(
      JSON.stringify({ error: 'Admin API credentials not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    /* ---------------------------------------------------------------
     *  Parse and validate body
     * --------------------------------------------------------------- */
    console.log('[FAQ CREATE] Starting FAQ creation...');
    const body = await request.json();
    
    const { productId, question, answer = '', name = 'Anonymous', email = null } = body;

    // Validate question length
    if (!productId || !question) {
      console.error('[FAQ CREATE] Validation failed - missing productId or question');
      return new Response(
        JSON.stringify({ error: 'Missing productId or question' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length < 5) {
      return new Response(
        JSON.stringify({ error: 'Question is too short. Please provide more details.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    console.log('[FAQ CREATE] Request validated:', {
      productId,
      questionLength: trimmedQuestion.length,
      answerLength: (answer || '').length,
    });

    /* ---------------------------------------------------------------
     *  Check for duplicate questions
     * --------------------------------------------------------------- */
    const SHOPIFY_ADMIN_API_VERSION = '2025-01';
    
    // Fetch all FAQ metaobjects and filter by product to check for duplicates
    const getExistingFaqsRes = await fetch(
      `https://${SHOP}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `query GetExistingFaqs($type: String!, $first: Int!) {
            metaobjects(type: $type, first: $first) {
              nodes {
                id
                fields {
                  key
                  value
                }
              }
            }
          }`,
          variables: {
            type: 'faq',
            first: 250,
          },
        }),
      },
    );

    const existingFaqsData = await getExistingFaqsRes.json();
    const allFaqs = existingFaqsData?.data?.metaobjects?.nodes || [];
    
    // Filter FAQs that belong to this product
    const productFaqs = allFaqs.filter((faq: any) => {
      const productField = faq.fields?.find((f: any) => f.key === 'faq_product');
      return productField?.value === productId;
    });
    
    // Check for similar questions
    for (const node of productFaqs) {
      if (!node?.fields) continue;
      
      for (const field of node.fields) {
        if (field.key === 'faq_question') {
          if (questionsAreSimilar(trimmedQuestion, field.value)) {
            console.log('[FAQ CREATE] Duplicate question detected:', {
              existing: field.value,
              new: trimmedQuestion,
            });
            return new Response(
              JSON.stringify({ 
                error: 'A similar question already exists. Please check the FAQ section above.',
                duplicate: true,
                existingQuestion: field.value,
              }),
              { status: 409, headers: { 'Content-Type': 'application/json' } },
            );
          }
        }
      }
    }

    /* ---------------------------------------------------------------
     *  Prepare fields for metaobject
     *  The faq_answer field is JSON type - it needs to be a valid JSON string
     *  For JSON fields in Shopify metaobjects, we need to pass a JSON-encoded string
     * --------------------------------------------------------------- */
    // For JSON type fields, Shopify expects the value to be a JSON-encoded string
    // So if the answer is "Hello", we need to pass '"Hello"' (JSON string)
    let answerValue: string;
    if (typeof answer === 'string') {
      // Encode as a JSON string (double-encode)
      answerValue = JSON.stringify(answer);
    } else {
      answerValue = JSON.stringify(answer);
    }

    const fields: Array<{ key: string; value: string }> = [
      { key: 'faq_question', value: trimmedQuestion },
      { key: 'faq_answer', value: answerValue },
      { key: 'faq_product', value: productId }, // Store product reference in FAQ itself
    ];

    // Add name and email if provided
    // Note: These fields need to exist in your metaobject definition
    // If they don't exist, they'll be ignored (but won't cause errors)
    if (name && name.trim() && name !== 'Anonymous') {
      fields.push({ key: 'faq_name', value: name.trim() });
      console.log('[FAQ CREATE] Adding name field:', name.trim());
    }
    if (email && email.trim()) {
      fields.push({ key: 'faq_email', value: email.trim() });
      console.log('[FAQ CREATE] Adding email field');
    }

    console.log('[FAQ CREATE] Fields prepared:', {
      questionLength: trimmedQuestion.length,
      answerLength: answerValue.length,
      answerIsJson: true,
    });

    /* ---------------------------------------------------------------
     *  1. Create FAQ metaobject
     * --------------------------------------------------------------- */
    const createFaqRes = await fetch(
      `https://${SHOP}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `mutation CreateMetaobject($fields: [MetaobjectFieldInput!]!) {
            metaobjectCreate(metaobject: { type: "faq", fields: $fields }) {
              metaobject { id }
              userErrors { field message }
            }
          }`,
          variables: {
            fields,
          },
        }),
      },
    );

    const createFaqData = await createFaqRes.json();
    console.log('[FAQ CREATE] Metaobject creation response:', {
      hasData: !!createFaqData?.data,
      hasMetaobject: !!createFaqData?.data?.metaobjectCreate?.metaobject,
      faqId: createFaqData?.data?.metaobjectCreate?.metaobject?.id,
      hasErrors: !!createFaqData?.data?.metaobjectCreate?.userErrors?.length,
    });
    
    // Check for user errors and try different formats
    if (createFaqData?.data?.metaobjectCreate?.userErrors?.length) {
      const errors = createFaqData.data.metaobjectCreate.userErrors;
      const errMsg = errors[0].message;
      
      // Check if it's a format error for faq_answer
      const hasAnswerFormatError = errors.some((e: any) => 
        (e.field?.includes('faq_answer') || e.message?.toLowerCase().includes('format') || 
         e.message?.toLowerCase().includes('schema') || e.message?.toLowerCase().includes('invalid json'))
      );
      
      // Check if status field error
      const hasStatusError = errors.some((e: any) => 
        e.field?.includes('status') || e.message?.toLowerCase().includes('status')
      );
      
      // Try retrying with different formats
      if (hasAnswerFormatError || hasStatusError) {
        console.log('[FAQ CREATE] Format error detected, trying alternative formats...');
        
        // Try 1: Remove status, use JSON-encoded string (double-encoded)
        // Include name and email in retry attempts
        const retryFields1 = [
          { key: 'faq_question', value: trimmedQuestion },
          { key: 'faq_answer', value: JSON.stringify(answer || '') }, // JSON-encoded string
          { key: 'faq_product', value: productId }, // Always include product reference
        ];
        // Add name and email if provided
        if (name && name.trim() && name !== 'Anonymous') {
          retryFields1.push({ key: 'faq_name', value: name.trim() });
        }
        if (email && email.trim()) {
          retryFields1.push({ key: 'faq_email', value: email.trim() });
        }
        
        console.log('[FAQ CREATE] Attempt 1: JSON-encoded string format');
        const retryRes1 = await fetch(
          `https://${SHOP}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
          {
            method: 'POST',
            headers: {
              'X-Shopify-Access-Token': ADMIN_API_TOKEN,
              'Content-Type': 'application/json',
            },
                body: JSON.stringify({
                  query: `mutation CreateMetaobject($fields: [MetaobjectFieldInput!]!) {
                    metaobjectCreate(metaobject: { type: "faq", fields: $fields }) {
                      metaobject { id }
                      userErrors { field message }
                    }
                  }`,
                  variables: {
                    fields: retryFields1,
                  },
                }),
          },
        );
        
        const retryData1 = await retryRes1.json();
        if (!retryData1?.data?.metaobjectCreate?.userErrors?.length) {
          console.log('[FAQ CREATE] Success with JSON-encoded string format!');
          createFaqData.data = retryData1.data;
          const retryFaqId = retryData1.data.metaobjectCreate.metaobject.id;
          if (retryFaqId) {
            await publishMetaobject(retryFaqId, SHOP, ADMIN_API_TOKEN, SHOPIFY_ADMIN_API_VERSION);
          }
        } else {
          console.error('[FAQ CREATE] Attempt 1 failed:', JSON.stringify(retryData1.data.metaobjectCreate.userErrors, null, 2));
          
          // Try 2: Plain text (maybe it's actually a text field, not JSON)
          console.log('[FAQ CREATE] Attempt 2: Plain text format');
          const retryFields2 = [
            { key: 'faq_question', value: trimmedQuestion },
            { key: 'faq_answer', value: answer || '' }, // Plain text
            { key: 'faq_product', value: productId }, // Always include product reference
          ];
          // Add name and email if provided
          if (name && name.trim() && name !== 'Anonymous') {
            retryFields2.push({ key: 'faq_name', value: name.trim() });
          }
          if (email && email.trim()) {
            retryFields2.push({ key: 'faq_email', value: email.trim() });
          }
          
          const retryRes2 = await fetch(
            `https://${SHOP}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
            {
              method: 'POST',
              headers: {
                'X-Shopify-Access-Token': ADMIN_API_TOKEN,
                'Content-Type': 'application/json',
              },
                body: JSON.stringify({
                  query: `mutation CreateMetaobject($fields: [MetaobjectFieldInput!]!) {
                    metaobjectCreate(metaobject: { type: "faq", fields: $fields }) {
                      metaobject { id }
                      userErrors { field message }
                    }
                  }`,
                  variables: {
                    fields: retryFields2,
                  },
                }),
            },
          );
          
          const retryData2 = await retryRes2.json();
          if (!retryData2?.data?.metaobjectCreate?.userErrors?.length) {
            console.log('[FAQ CREATE] Success with plain text format!');
            createFaqData.data = retryData2.data;
            const retryFaqId2 = retryData2.data.metaobjectCreate.metaobject.id;
            if (retryFaqId2) {
              await publishMetaobject(retryFaqId2, SHOP, ADMIN_API_TOKEN, SHOPIFY_ADMIN_API_VERSION);
            }
          } else {
            console.error('[FAQ CREATE] Attempt 2 failed:', JSON.stringify(retryData2.data.metaobjectCreate.userErrors, null, 2));
            
            // Try 3: Shopify Rich Text format (correct structure)
            console.log('[FAQ CREATE] Attempt 3: Shopify Rich Text format');
            const richTextAnswer = JSON.stringify({
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: answer || '',
                    },
                  ],
                },
              ],
            });
            
            const retryFields3 = [
              { key: 'faq_question', value: trimmedQuestion },
              { key: 'faq_answer', value: richTextAnswer },
              { key: 'faq_product', value: productId }, // Always include product reference
            ];
            // Add name and email if provided
            if (name && name.trim() && name !== 'Anonymous') {
              retryFields3.push({ key: 'faq_name', value: name.trim() });
            }
            if (email && email.trim()) {
              retryFields3.push({ key: 'faq_email', value: email.trim() });
            }
            
            const retryRes3 = await fetch(
              `https://${SHOP}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
              {
                method: 'POST',
                headers: {
                  'X-Shopify-Access-Token': ADMIN_API_TOKEN,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  query: `mutation CreateMetaobject($fields: [MetaobjectFieldInput!]!) {
                    metaobjectCreate(metaobject: { type: "faq", fields: $fields }) {
                      metaobject { id }
                      userErrors { field message }
                    }
                  }`,
                  variables: {
                    fields: retryFields3,
                  },
                }),
              },
            );
            
            const retryData3 = await retryRes3.json();
            if (!retryData3?.data?.metaobjectCreate?.userErrors?.length) {
              console.log('[FAQ CREATE] Success with Rich Text format!');
              createFaqData.data = retryData3.data;
              const retryFaqId3 = retryData3.data.metaobjectCreate.metaobject.id;
              if (retryFaqId3) {
                await publishMetaobject(retryFaqId3, SHOP, ADMIN_API_TOKEN, SHOPIFY_ADMIN_API_VERSION);
              }
            } else {
              console.error('[FAQ CREATE] All format attempts failed:', JSON.stringify(retryData3.data.metaobjectCreate.userErrors, null, 2));
              return new Response(
                JSON.stringify({ 
                  error: retryData3.data.metaobjectCreate.userErrors[0].message || 'Failed to create FAQ - all format attempts failed',
                  userErrors: retryData3.data.metaobjectCreate.userErrors,
                  hint: 'Please check your metaobject definition. The faq_answer field type might need to be changed in Shopify Admin.'
                }), 
                {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            }
          }
        }
      } else {
        console.error('[FAQ CREATE] Metaobject creation user errors:', JSON.stringify(errors, null, 2));
        return new Response(
          JSON.stringify({ 
            error: errMsg || 'Failed to create FAQ metaobject',
            userErrors: errors
          }), 
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
    
    const faqId = createFaqData?.data?.metaobjectCreate?.metaobject?.id;

    if (!faqId) {
      console.error('[FAQ CREATE] No FAQ ID returned. Full response:', JSON.stringify(createFaqData, null, 2));
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create FAQ metaobject - no ID returned',
          response: createFaqData
        }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    console.log('[FAQ CREATE] FAQ created successfully with ID:', faqId);
    
    // Always try to publish the metaobject to make it active
    console.log('[FAQ CREATE] Attempting to publish FAQ...');
    await publishMetaobject(faqId, SHOP, ADMIN_API_TOKEN, SHOPIFY_ADMIN_API_VERSION);

    /* ---------------------------------------------------------------
     *  2. NO LONGER NEEDED: Product metafield update
     * --------------------------------------------------------------- */
    // OLD APPROACH (REMOVED): We used to maintain a list of FAQ references in the product metafield.
    // This caused race conditions when multiple FAQs were created simultaneously.
    // 
    // NEW APPROACH: Each FAQ stores its own product reference in the `faq_product` field.
    // We query FAQs by filtering metaobjects where faq_product = productId.
    // This eliminates race conditions entirely since each FAQ creation is independent.
    
    console.log('[FAQ CREATE] FAQ created with product reference stored in faq_product field.');
    console.log('[FAQ CREATE] No need to update product metafield - FAQs are queried by product reference field.');

    /* ---------------------------------------------------------------
     *  Success 🎉
     * --------------------------------------------------------------- */
    console.log('[FAQ CREATE] FAQ creation completed successfully!');
    return new Response(JSON.stringify({ success: true, faqId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[FAQ CREATE] Exception caught:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
    });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
