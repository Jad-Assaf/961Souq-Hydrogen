// app/routes/webhooks.typesense-products.jsx

// Minimal debug route: no HMAC, no Typesense, just logs.

export async function loader() {
  console.log('[Webhooks DEBUG] GET /webhooks/typesense-products hit');
  return new Response(
    'DEBUG: webhooks.typesense-products is reachable (GET).',
    {status: 200},
  );
}

export async function action({request}) {
  const method = request.method;
  const topic = request.headers.get('X-Shopify-Topic') || '';
  const shopDomain = request.headers.get('X-Shopify-Shop-Domain') || '';
  const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256') || '';

  console.log(
    '[Webhooks DEBUG] Incoming request:',
    'method=',
    method,
    'topic=',
    topic || '(no topic)',
    'shop=',
    shopDomain || '(no shop)',
    'hmac header present=',
    !!hmacHeader,
  );

  let rawBody = '';
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error('[Webhooks DEBUG] Error reading body:', err);
    return new Response('Error reading body', {status: 500});
  }

  console.log('[Webhooks DEBUG] Raw body:', rawBody.slice(0, 500));

  // Try parse JSON, but do not fail if it is invalid
  try {
    const json = JSON.parse(rawBody);
    console.log('[Webhooks DEBUG] Parsed JSON keys:', Object.keys(json || {}));
  } catch (err) {
    console.warn('[Webhooks DEBUG] Body is not valid JSON:', err.message);
  }

  return new Response('DEBUG OK', {status: 200});
}
