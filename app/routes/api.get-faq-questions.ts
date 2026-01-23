import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';

export const loader = async ({request, context}: LoaderFunctionArgs) => {
  console.log('[FAQ GET] Starting FAQ retrieval...');
  const url = new URL(request.url);
  const productId = url.searchParams.get('productId');
  console.log('[FAQ GET] Product ID:', productId);

  if (!productId) {
    console.error('[FAQ GET] Missing productId');
    return new Response(JSON.stringify({error: 'Missing productId'}), {
      status: 400,
      headers: {'Content-Type': 'application/json'},
    });
  }

  // NEW APPROACH: Query FAQs by product reference field instead of using product metafield
  // This eliminates race conditions since each FAQ stores its own product reference
  // We use Admin API to query metaobjects by field value (Storefront API doesn't support this)

  const ADMIN_API_TOKEN = (context.env as any).ADMIN_API_TOKEN;
  const SHOP = (context.env as any).PUBLIC_STORE_DOMAIN;
  const SHOPIFY_ADMIN_API_VERSION = '2025-01';

  if (!ADMIN_API_TOKEN || !SHOP) {
    console.error('[FAQ GET] Missing ADMIN_API_TOKEN or PUBLIC_STORE_DOMAIN');
    return new Response(JSON.stringify({error: 'Server configuration error'}), {
      status: 500,
      headers: {'Content-Type': 'application/json'},
    });
  }

  // Query all FAQ metaobjects and filter by product reference
  // Note: Storefront API doesn't support filtering metaobjects by field value,
  // so we fetch all FAQs and filter client-side (or use Admin API)
  const GET_FAQS_BY_PRODUCT = `#graphql
    query GetFaqsByProduct($type: String!, $first: Int!) {
      metaobjects(type: $type, first: $first) {
        nodes {
          id
          fields {
            key
            value
          }
        }
      }
    }
  `;

  // Use Admin API to query metaobjects
  const adminRes = await fetch(
    `https://${SHOP}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_FAQS_BY_PRODUCT,
        variables: {
          type: 'faq',
          first: 250, // Fetch up to 250 FAQs (should be enough)
        },
      }),
    },
  );

  const adminData = await adminRes.json();
  const allFaqs = adminData?.data?.metaobjects?.nodes || [];

  // Filter FAQs that belong to this product
  const productFaqs = allFaqs.filter((faq: any) => {
    const productField = faq.fields?.find((f: any) => f.key === 'faq_product');
    return productField?.value === productId;
  });

  console.log(
    '[FAQ GET] Found',
    productFaqs.length,
    'FAQs for product',
    productId,
    'out of',
    allFaqs.length,
    'total FAQs',
  );

  const faqs: {
    question: string;
    answer: string | object;
    name?: string;
    email?: string;
  }[] = [];
  const nodesCount = productFaqs.length;

  if (nodesCount === 0) {
    console.log('[FAQ GET] No FAQs found for this product.');
  }

  for (const node of productFaqs) {
    if (!node?.fields) {
      console.warn('[FAQ GET] Node has no fields:', node);
      continue;
    }

    let question = '';
    let answer: string | object = '';
    let name = '';
    let email = '';

    console.log('[FAQ GET] Processing node with', node.fields.length, 'fields');

    for (const field of node.fields) {
      if (field.key === 'faq_question') {
        question = field.value;
        console.log(
          '[FAQ GET] Found question:',
          question.substring(0, 50) + '...',
        );
      }
      if (field.key === 'faq_answer') {
        console.log('[FAQ GET] Processing answer field:', {
          valueType: typeof field.value,
          valueLength: field.value?.length || 0,
          valuePreview: field.value?.substring(0, 100) || 'empty',
          looksLikeJson:
            field.value?.trim().startsWith('{') ||
            field.value?.trim().startsWith('['),
        });

        // Try to parse as JSON - the field is stored as JSON (Rich Text format)
        try {
          if (typeof field.value === 'string') {
            const parsed = JSON.parse(field.value);

            // Handle Shopify Rich Text format: {type: "root", children: [{type: "paragraph", children: [{type: "text", value: "..."}]}]}
            if (parsed && typeof parsed === 'object') {
              if (parsed.type === 'root' && Array.isArray(parsed.children)) {
                // Extract text from rich text structure
                const extractText = (node: any): string => {
                  if (node.type === 'text' && node.value) {
                    return node.value;
                  }
                  if (Array.isArray(node.children)) {
                    return node.children.map(extractText).join('');
                  }
                  return '';
                };
                answer = parsed.children.map(extractText).join(' ').trim();
                console.log('[FAQ GET] Extracted text from Rich Text format');
              } else if (parsed.text) {
                answer = parsed.text;
                console.log('[FAQ GET] Extracted text from JSON object');
              } else if (typeof parsed === 'string') {
                answer = parsed;
                console.log('[FAQ GET] JSON string parsed');
              } else {
                answer = field.value; // Fallback to raw value
                console.log('[FAQ GET] JSON object, using as-is');
              }
            } else if (typeof parsed === 'string') {
              answer = parsed;
              console.log('[FAQ GET] JSON string parsed');
            } else {
              answer = field.value;
            }
          } else {
            answer = field.value;
            console.log('[FAQ GET] Answer is not a string');
          }
        } catch (parseError) {
          // If parsing fails, treat as plain text
          console.log('[FAQ GET] Not JSON, using as plain text');
          answer = field.value;
        }
      }
      if (field.key === 'faq_name') {
        name = field.value || '';
        console.log('[FAQ GET] Found name field:', name || 'empty');
      }
      if (field.key === 'faq_email') {
        email = field.value || '';
        console.log(
          '[FAQ GET] Found email field:',
          email ? 'provided' : 'empty',
        );
      }
    }

    console.log('[FAQ GET] Final FAQ data:', {
      question: question.substring(0, 30) + '...',
      hasAnswer: !!answer,
      name: name || 'not set',
      email: email || 'not set',
    });

    // Only add FAQ if it has a question
    if (question && question.trim()) {
      faqs.push({
        question,
        answer,
        name: name || '', // Return empty string instead of 'Anonymous' if not set
        email: email || undefined,
      });

      console.log('[FAQ GET] Added FAQ:', {
        question: question.substring(0, 50),
        answerType: typeof answer,
        hasName: !!name,
        hasEmail: !!email,
      });
    } else {
      console.warn('[FAQ GET] Skipping FAQ node with no question:', {
        nodeId: node.id,
        fieldsCount: node.fields?.length || 0,
      });
    }
  }

  console.log('[FAQ GET] Returning', faqs.length, 'FAQs');
  if (faqs.length === 0 && nodesCount > 0) {
    console.error(
      '[FAQ GET] WARNING: Found',
      nodesCount,
      'nodes but processed 0 FAQs! This indicates a data structure issue.',
    );
  }

  return new Response(JSON.stringify({faqs}), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  });
};
