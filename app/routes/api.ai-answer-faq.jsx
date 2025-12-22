// app/routes/api.ai-answer-faq.jsx
import {json} from '@shopify/remix-oxygen';

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

// Hardcoded warranty and shipping policy content (matches product page tabs)
const WARRANTY_POLICY = `Operational Warranty Terms and Conditions

Warranty Coverage:
This warranty applies to All Products, purchased from 961 Souq. The warranty covers defects in materials and workmanship under normal use for the period specified at the time of purchase.

What is Covered:
During the warranty period, 961 Souq will repair or replace, at no charge, any parts that are found to be defective due to faulty materials or poor workmanship. This warranty is valid only for the original purchaser and is non-transferable.

What is Not Covered:
This warranty does not cover:
- Any Physical Damage, damage due to misuse, abuse, accidents, modifications, or unauthorized repairs.
- Wear and tear from regular usage, including cosmetic damage like scratches or dents.
- Damage caused by power surges, lightning strikes, or electrical malfunctions.
- Products with altered or removed serial numbers.
- Software-related issues

Warranty Claim Process:
To make a claim under this warranty:
1. Contact admin@961souq.com with proof of purchase and a detailed description of the issue.
2. 961 Souq will assess the product and, if deemed defective, repair or replace the item at no cost.

Limitations and Exclusions:
This warranty is limited to repair or replacement. 961 Souq will not be liable for any indirect, consequential, or incidental damages, including loss of data or loss of profits.`;

const SHIPPING_POLICY = `Shipping Policy:
We offer shipping across all Lebanon, facilitated by our dedicated delivery team servicing the Beirut district and through our partnership with Wakilni for orders beyond Beirut.

Upon placing an order, we provide estimated shipping and delivery dates tailored to your item's availability and selected product options. For precise shipping details, kindly reach out to us through the contact information listed in our Contact Us section.

Please be aware that shipping rates may vary depending on the destination.

Exchange Policy:
We operate a 3-day exchange policy, granting you 3 days from receipt of your item to initiate an exchange.

To qualify for an exchange, your item must remain in its original condition, unworn or unused, with tags intact, and in its original sealed packaging. Additionally, you will need to provide a receipt or proof of purchase.

To initiate an exchange, please contact us at admin@961souq.com. Upon approval of your exchange request, we will furnish you with an exchange shipping label along with comprehensive instructions for package return. Please note that exchanges initiated without prior authorization will not be accepted.

Should you encounter any damages or issues upon receiving your order, please inspect the item immediately and notify us promptly. We will swiftly address any defects, damages, or incorrect shipments to ensure your satisfaction.

Exceptions / Non-exchangeable Items:
Certain items are exempt from our exchange policy, including mobile phones, perishable goods (such as headsets, earphones, and network card or wifi routers), custom-made products (such as special orders or personalized items), and pre-ordered goods. For queries regarding specific items, please reach out to us.

Unfortunately, we are unable to accommodate exchanges for sale items or gift cards.`;

export async function action({request, context}) {
  if (request.method !== 'POST') {
    return json({error: 'Method not allowed'}, {status: 405});
  }

  try {
    const body = await request.json().catch(() => ({}));
    const {productId, question, name, email} = body;

    if (!productId || !question) {
      return json(
        {error: 'Missing productId or question'},
        {status: 400},
      );
    }

    const openaiKey = context.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return json(
        {error: 'Missing OPENAI_API_KEY', stage: 'env'},
        {status: 500},
      );
    }

    // Fetch product data from Storefront API including price
    const PRODUCT_QUERY = `#graphql
      query ProductForFAQ($id: ID!) {
        product(id: $id) {
          id
          title
          vendor
          description
          descriptionHtml
          productType
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    `;

    const {product} = await context.storefront.query(PRODUCT_QUERY, {
      variables: {id: productId},
    });

    if (!product) {
      return json(
        {error: 'Product not found'},
        {status: 404},
      );
    }

    const title = product?.title || '';
    const vendor = product?.vendor || '';
    const description = (product?.description || '').trim();
    const descriptionHtml = (product?.descriptionHtml || '').trim();
    
    // Extract price information
    const minPrice = product?.priceRange?.minVariantPrice?.amount || null;
    const maxPrice = product?.priceRange?.maxVariantPrice?.amount || null;
    const currencyCode = product?.priceRange?.minVariantPrice?.currencyCode || 'USD';
    const priceInfo = minPrice && maxPrice
      ? (minPrice === maxPrice 
          ? `${minPrice} ${currencyCode}` 
          : `${minPrice} - ${maxPrice} ${currencyCode}`)
      : null;
    
    // Use hardcoded warranty and shipping policies (matching product page tabs)
    const warrantyInfo = WARRANTY_POLICY;
    const shippingInfo = SHIPPING_POLICY;

    if (!description && !descriptionHtml) {
      return json(
        {error: 'Product has no description to answer from'},
        {status: 400},
      );
    }

    // Use HTML description if available, otherwise plain text
    // Strip HTML tags for cleaner input, but keep the content
    const productDescription = descriptionHtml
      ? descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      : description;

    // Trim input to avoid token limits
    const trimmedDescription =
      productDescription.length > 8000
        ? productDescription.slice(0, 8000)
        : productDescription;
    
    // Build additional context for price, warranty, and shipping
    let additionalContext = '';
    if (priceInfo) {
      additionalContext += `\n\nPrice: ${priceInfo}`;
    }
    if (warrantyInfo) {
      additionalContext += `\n\nWarranty Information: ${warrantyInfo}`;
    }
    if (shippingInfo) {
      additionalContext += `\n\nShipping Information: ${shippingInfo}`;
    }

    // Detect question language
    const isArabic = /[\u0600-\u06FF]/.test(question);
    const questionLanguage = isArabic ? 'Arabic' : 'English';

    // Call GPT-5-nano to answer the question
    const whatsappLink = 'https://wa.me/96171888036';
    
    // Detect if question is about price, warranty, or shipping
    const questionLower = question.toLowerCase();
    const isPriceQuestion = /price|cost|how much|كم|السعر|الثمن/.test(questionLower);
    const isWarrantyQuestion = /warranty|guarantee|ضمان/.test(questionLower);
    const isShippingQuestion = /shipping|delivery|shipped|الشحن|التوصيل/.test(questionLower);
    
    // Build context-aware instructions
    let contextInstructions = `Answer the user's question about this product using information from:
- Product description (always available)
`;
    
    if (isPriceQuestion && priceInfo) {
      contextInstructions += `- Product price: ${priceInfo} (use this for price questions)\n`;
    }
    if (isWarrantyQuestion && warrantyInfo) {
      contextInstructions += `- Warranty information (use this for warranty questions)\n`;
    }
    if (isShippingQuestion && shippingInfo) {
      contextInstructions += `- Shipping information (use this for shipping questions)\n`;
    }
    
    contextInstructions += `\nAnswer in ${questionLanguage} (same language as the question). Be concise (2-4 sentences). If the specific information is not available in the provided sources, direct them to WhatsApp: ${whatsappLink} instead of offering generic help.`;
    
    const payload = {
      model: 'gpt-5-nano',
      reasoning: {effort: 'minimal'},
      instructions: contextInstructions,
      input: `Product: ${title} | Brand: ${vendor} | Type: ${product.productType || 'N/A'}

Description: ${trimmedDescription}${additionalContext}

Question (${questionLanguage}): ${question}

Answer in ${questionLanguage} based on the available information. If the specific information is missing, provide WhatsApp link: ${whatsappLink}`,
      max_output_tokens: 800,
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

    if (!openaiRes.ok) {
      const msg =
        openaiJson?.error?.message || `OpenAI API error (${openaiRes.status})`;
      return json(
        {
          error: msg,
          stage: 'openai',
          openaiStatus: openaiRes.status,
          openaiCode: openaiJson?.error?.code || null,
        },
        {status: 502},
      );
    }

    if (openaiJson?.status === 'incomplete') {
      return json(
        {
          error: 'OpenAI returned status=incomplete (token budget issue).',
          stage: 'openai_incomplete',
          incomplete_details: openaiJson?.incomplete_details || null,
          usage: openaiJson?.usage || null,
        },
        {status: 502},
      );
    }

    let answer = extractOutputText(openaiJson).replace(/\s+/g, ' ').trim();

    if (!answer) {
      return json(
        {error: 'Empty answer from model', stage: 'openai_parse'},
        {status: 502},
      );
    }

    return json({
      success: true,
      answer,
      question,
      name: name || 'Anonymous',
      email: email || null,
    });
  } catch (error) {
    return json(
      {error: 'Internal server error', details: error.message},
      {status: 500},
    );
  }
}

