/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  try {
    const response = await context.customerAccount.authorize();
    return withNoStore(response);
  } catch (error) {
    if (error instanceof Response) return withNoStore(error);
    throw error;
  }
}

function withNoStore(response) {
  if (!(response instanceof Response)) return response;

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('Pragma', 'no-cache');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
