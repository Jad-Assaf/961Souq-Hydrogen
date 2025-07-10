import type { ActionFunctionArgs } from '@shopify/remix-oxygen';

export const action = async ({ request, context }: ActionFunctionArgs) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { productId, question } = await request.json();
    if (!productId || !question) {
      return new Response(JSON.stringify({ error: 'Missing productId or question' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch the current metafield value
    const GET_METAFIELD_QUERY = `#graphql
      query ProductQuestions($id: ID!) {
        product(id: $id) {
          metafield(namespace: "custom", key: "questions") {
            id
            value
          }
        }
      }
    `;
    const { product } = await (context.storefront as any).query(GET_METAFIELD_QUERY, {
      variables: { id: productId },
    });

    let questions: string[] = [];
    let metafieldId: string | undefined = undefined;
    if (product?.metafield?.value) {
      try {
        questions = JSON.parse(product.metafield.value);
        if (!Array.isArray(questions)) questions = [];
      } catch {
        questions = [];
      }
      metafieldId = product.metafield.id;
    }

    // 2. Append the new question
    questions.push(question);

    // 3. Update the metafield
    const UPDATE_METAFIELD_MUTATION = `#graphql
      mutation UpdateProductQuestions($input: MetafieldsSetInput!) {
        metafieldsSet(metafields: [$input]) {
          metafields {
            id
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    const input = {
      ownerId: productId,
      namespace: 'custom',
      key: 'questions',
      type: 'json',
      value: JSON.stringify(questions),
    };
    if (metafieldId) input['id'] = metafieldId;

    const result = await (context.storefront as any).mutate(UPDATE_METAFIELD_MUTATION, {
      variables: { input },
    });

    if (result?.metafieldsSet?.userErrors?.length) {
      return new Response(
        JSON.stringify({ error: result.metafieldsSet.userErrors[0].message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}; 