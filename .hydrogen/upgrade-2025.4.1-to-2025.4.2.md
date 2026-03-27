# Hydrogen upgrade guide: 2025.4.1 to 2025.4.2

----

## Features

### Migrate to Shopify's new cookie system [#3332](https://github.com/Shopify/hydrogen/pull/3332)

#### Step: 1. Understand the new cookie model and compatibility story [#3332](https://github.com/Shopify/hydrogen/pull/3332)

> Shopify is deprecating `_shopify_y` and `_shopify_s` in favor of `_shopify_analytics` and `_shopify_marketing`, which are http-only cookies set via the Storefront API on your storefront domain. Hydrogen now reads and writes these cookies through a Storefront API proxy while still honoring the legacy cookies when present. You don't need to migrate values manually, but you must ensure that requests flow through the proxy so cookies are set before analytics run.
[#3332](https://github.com/Shopify/hydrogen/pull/3332)

#### Step: 2. Set up a Storefront API proxy for your deployment [#3332](https://github.com/Shopify/hydrogen/pull/3332)

> Depending on how you host your app, you must ensure Storefront API calls go through a proxy on your storefront domain.
[#3332](https://github.com/Shopify/hydrogen/pull/3332)
### Remix + Hydrogen on Oxygen

If you scaffolded from the default Hydrogen skeleton and deploy to Oxygen, the `createRequestHandler` utility from `@shopify/remix-oxygen` already sets up a Storefront API proxy on the same domain as your storefront.

**In most cases, no changes are required**; just confirm your server entry still uses it:

```ts
// server.ts (Oxygen)
import {createRequestHandler} from '@shopify/remix-oxygen';
import {createHydrogenContext} from '@shopify/hydrogen';

export default {
  async fetch(request, env) {
    const hydrogenContext = createHydrogenContext({
      env,
      request,
      /* ... */
    });

    const handleRequest = createRequestHandler({
      /* ... */
      getLoadContext: () => hydrogenContext,
    });

    return handleRequest(request);
  },
};
```

Keep using `<Analytics.Provider>` component or `useCustomerPrivacy` hook to get cookies in the browser automatically.

For a full example, refer to your skeleton template's server.ts.

### Remix + Hydrogen on other hosts

#### Hosts that support Web Fetch API (Request/Response)

On hosts that support the standard Web Fetch API (Workers-style environments), import `createRequestHandler` from `@shopify/hydrogen` and route requests through it:

```ts
import {createRequestHandler, createHydrogenContext} from '@shopify/hydrogen';

const hydrogenContext = createHydrogenContext({
  /* ... */
});

const handleRequest = createRequestHandler({
  /* ... */
  getLoadContext: () => hydrogenContext,
});
```

#### Node.js and other hosts

For Node-like environments, adapt Node requests to Fetch with [`@remix-run/node-fetch-server`](https://www.npmjs.com/package/@remix-run/node-fetch-server), then delegate to Hydrogen's handler:

```ts
import {createRequestHandler, createHydrogenContext} from '@shopify/hydrogen';
import {createRequestListener} from '@remix-run/node-fetch-server';
import http from 'http';

const handleNodeRequest = createRequestListener((request) => {
  const hydrogenContext = createHydrogenContext({
    /* ... */
  });

  const handleWebRequest = createRequestHandler({
    /* ... */
    getLoadContext: () => hydrogenContext,
  });

  return handleWebRequest(request);
});

http.createServer(handleNodeRequest);
```

Alternatively, if you can't delegate to Hydrogen's `createRequestHandler`, you can provide a custom Storefront API proxy in your server. See [Hydrogen's implementation](https://github.com/Shopify/hydrogen/blob/27066a28577484f406222116a959eb463d255685/packages/hydrogen/src/storefront.ts#L546-L611) as a reference. In this case, ensure you manually pass `sameDomainForStorefrontApi: true` in the `consent` object for `<Analytics.Provider>` or as a prop to the `useCustomerPrivacy` hook.


----
