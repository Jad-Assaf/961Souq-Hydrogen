// @ts-ignore
// Virtual entry point for the app
import * as remixBuild from 'virtual:remix/server-build';
import {storefrontRedirect} from '@shopify/hydrogen';
import {createRequestHandler} from '@shopify/remix-oxygen';
import {createAppLoadContext} from '~/lib/context';

/**
 * Export a fetch handler in module format.
 */
export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} executionContext
   * @return {Promise<Response>}
   */
  async fetch(request, env, executionContext) {
    try {
      // Quick geo-block: deny requests we can identify as coming from blocked countries.
      const blockedCountries = new Set(['CN', 'IL']);
      const countryCode =
        request.cf?.country ||
        request.headers.get('cf-ipcountry') ||
        request.headers.get('x-country-code');

      if (countryCode && blockedCountries.has(countryCode.toUpperCase())) {
        const blockedPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Access Restricted</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body {font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0b1724; color: #f5f7fa; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 24px;}
    .card {max-width: 520px; background: #111e2f; border: 1px solid #23344a; border-radius: 16px; padding: 24px 28px; box-shadow: 0 14px 40px rgba(0,0,0,0.35);}
    h1 {margin: 0 0 12px; font-size: 24px; letter-spacing: 0.4px;}
    p {margin: 0 0 10px; line-height: 1.5;}
    .muted {color: #95a3b8;}
  </style>
</head>
<body>
  <div class="card">
    <h1>Access Restricted</h1>
    <p>Our store is not available in your region right now.</p>
    <p class="muted">If you believe this is an error, please contact support and include your country code: ${countryCode.toUpperCase()}.</p>
  </div>
</body>
</html>`;
        return new Response(blockedPage, {
          status: 403,
          headers: {'Content-Type': 'text/html; charset=utf-8'},
        });
      }

      const appLoadContext = await createAppLoadContext(
        request,
        env,
        executionContext,
      );

      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client to the loader context.
       */
      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => appLoadContext,
      });

      const response = await handleRequest(request);

      if (appLoadContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await appLoadContext.session.commit(),
        );
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({
          request,
          response,
          storefront: appLoadContext.storefront,
        });
      }

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
