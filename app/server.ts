/*********************************************************************
 * server.ts – Oxygen worker entry
 * Blocks traffic from Germany before Remix runs.
 *********************************************************************/

import {createRequestHandler} from '@shopify/remix-oxygen';
import * as remixBuild from 'virtual:remix/server-build';

/* ------------------------------------------------------------------
 * Utility: read Oxygen geolocation headers
 * ----------------------------------------------------------------- */
type OxygenEnv = {
  buyer: {
    ip?: string;
    country?: string;
    continent?: string;
    city?: string;
    isEuCountry: boolean;
    latitude?: string;
    longitude?: string;
    region?: string;
    regionCode?: string;
    timezone?: string;
  };
  shopId?: string;
  storefrontId?: string;
  deploymentId?: string;
};

function getOxygenEnv(request: Request): OxygenEnv {
  const h = request.headers;
  return Object.freeze({
    buyer: {
      ip: h.get('oxygen-buyer-ip') ?? undefined,
      country: h.get('oxygen-buyer-country') ?? undefined,
      continent: h.get('oxygen-buyer-continent') ?? undefined,
      city: h.get('oxygen-buyer-city') ?? undefined,
      isEuCountry: Boolean(h.get('oxygen-buyer-is-eu-country')),
      latitude: h.get('oxygen-buyer-latitude') ?? undefined,
      longitude: h.get('oxygen-buyer-longitude') ?? undefined,
      region: h.get('oxygen-buyer-region') ?? undefined,
      regionCode: h.get('oxygen-buyer-region-code') ?? undefined,
      timezone: h.get('oxygen-buyer-timezone') ?? undefined,
    },
    shopId: h.get('oxygen-buyer-shop-id') ?? undefined,
    storefrontId: h.get('oxygen-buyer-storefront-id') ?? undefined,
    deploymentId: h.get('oxygen-buyer-deployment-id') ?? undefined,
  });
}

/* ------------------------------------------------------------------
 * ISO-3166-1 alpha-2 codes to block (Germany only for now)
 * ----------------------------------------------------------------- */
const BLOCKED_COUNTRIES = new Set<string>(['DE']);

/* ------------------------------------------------------------------
 * Worker fetch handler
 * ----------------------------------------------------------------- */
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const oxygen = getOxygenEnv(request);

    // Early geoblock
    const country = (oxygen.buyer.country || '').toUpperCase();
    if (BLOCKED_COUNTRIES.has(country)) {
      const url = new URL('/blocked', request.url);
      return Response.redirect(url.toString(), 307);
      // Or return new Response('Store not available in your region.', {status: 403});
    }

    const handleRequest = createRequestHandler({
      build: remixBuild,
      mode: process.env.NODE_ENV,
      getLoadContext: () => ({
        env,
        oxygen,
      }),
    });

    return handleRequest(request);
  },
};
