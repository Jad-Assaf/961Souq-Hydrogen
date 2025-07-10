// app/routes/api.create-faq.js
/**
 * Creates an FAQ metaobject and attaches its reference to the product’s
 * `custom.faqs` metafield (type: list.metaobject_reference).
 *
 * Environment variables are injected on context.env at runtime:
 *   - ADMIN_API_TOKEN         (private)
 *   - PUBLIC_STORE_DOMAIN     (public)
 */
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
    const { productId, question } = await request.json();

    if (!productId || !question) {
      return new Response(
        JSON.stringify({ error: 'Missing productId or question' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    /* ---------------------------------------------------------------
     *  1. Create FAQ metaobject
     * --------------------------------------------------------------- */
    const createFaqRes = await fetch(
      `https://${SHOP}/admin/api/2023-10/graphql.json`,
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
            fields: [
              { key: 'faq_question', value: question },
              { key: 'faq_answer', value: '' },
            ],
          },
        }),
      },
    );

    const createFaqData = await createFaqRes.json();
    const faqId = createFaqData?.data?.metaobjectCreate?.metaobject?.id;

    if (!faqId) {
      const errMsg =
        createFaqData?.data?.metaobjectCreate?.userErrors?.[0]?.message ??
        'Failed to create FAQ metaobject';
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    /* ---------------------------------------------------------------
     *  2. Fetch existing FAQ references
     * --------------------------------------------------------------- */
    const getRefsRes = await fetch(
      `https://${SHOP}/admin/api/2023-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `query GetFaqRefs($id: ID!) {
            product(id: $id) {
              metafield(namespace: "custom", key: "faqs") {
                id
                references(first: 50) { nodes { id } }
              }
            }
          }`,
          variables: { id: productId },
        }),
      },
    );

    const refsData = await getRefsRes.json();
    const metafield = refsData?.data?.product?.metafield;
    let refs = metafield?.references?.nodes
      ? metafield.references.nodes.map((n) => n.id)
      : [];
    let metafieldId = metafield?.id;

    refs.push(faqId);

    /* ---------------------------------------------------------------
     *  3. Update metafield with new reference list
     * --------------------------------------------------------------- */
    const updateRes = await fetch(
      `https://${SHOP}/admin/api/2023-10/graphql.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': ADMIN_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `mutation UpdateFaqRefs($input: MetafieldsSetInput!) {
            metafieldsSet(metafields: [$input]) {
              metafields { id }
              userErrors { field message }
            }
          }`,
          variables: {
            input: {
              ownerId: productId,
              namespace: 'custom',
              key: 'faqs',
              type: 'list.metaobject_reference',
              value: JSON.stringify(refs),
              ...(metafieldId ? { id: metafieldId } : {}),
            },
          },
        }),
      },
    );

    const updateData = await updateRes.json();
    if (updateData?.data?.metafieldsSet?.userErrors?.length) {
      return new Response(
        JSON.stringify({
          error: updateData.data.metafieldsSet.userErrors[0].message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    /* ---------------------------------------------------------------
     *  Success 🎉
     * --------------------------------------------------------------- */
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
