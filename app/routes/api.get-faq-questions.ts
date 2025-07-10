import type { LoaderFunctionArgs } from '@shopify/remix-oxygen';

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get('productId');
  if (!productId) {
    return new Response(JSON.stringify({ error: 'Missing productId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch the product's custom.faqs metafield (list of references)
  const GET_FAQS = `#graphql
    query GetFaqRefs($id: ID!) {
      product(id: $id) {
        metafield(namespace: "custom", key: "faqs") {
          references(first: 50) {
            nodes {
              ... on Metaobject {
                id
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  `;
  const { product } = await (context.storefront as any).query(GET_FAQS, {
    variables: { id: productId },
  });

  const faqs: { question: string; answer: string | object }[] = [];
  if (product?.metafield?.references?.nodes) {
    for (const node of product.metafield.references.nodes) {
      if (!node?.fields) continue;
      let question = '';
      let answer: string | object = '';
      for (const field of node.fields) {
        if (field.key === 'faq_question') question = field.value;
        if (field.key === 'faq_answer') {
          // Try to parse as JSON if it looks like a JSON string
          try {
            const parsed = JSON.parse(field.value);
            answer = parsed;
          } catch {
            answer = field.value;
          }
        }
      }
      faqs.push({ question, answer });
    }
  }

  return new Response(JSON.stringify({ faqs }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}; 