import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';

function normalizeSecret(raw) {
  if (raw == null) return '';
  if (typeof raw === 'object' && 'value' in raw) {
    return normalizeSecret(raw.value);
  }
  const trimmed = String(raw).trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/**
 * The context implementation is separate from server.ts
 * so that type can be extracted for AppLoadContext
 * @param {Request} request
 * @param {Env} env
 * @param {ExecutionContext} executionContext
 */
export async function createHydrogenRouterContext(
  request,
  env,
  executionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const normalizedEnv = {
    ...env,
    PUBLIC_STOREFRONT_API_TOKEN: normalizeSecret(
      env.PUBLIC_STOREFRONT_API_TOKEN || env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN,
    ),
    PRIVATE_STOREFRONT_API_TOKEN: normalizeSecret(
      env.PRIVATE_STOREFRONT_API_TOKEN || env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN,
    ),
  };

  const hydrogenContext = createHydrogenContext({
    env: normalizedEnv,
    request,
    cache,
    waitUntil,
    session,
    i18n: {language: 'EN', country: 'US'},
    cart: {
      queryFragment: CART_QUERY_FRAGMENT,
    },
  });

  return hydrogenContext;
}

export const createAppLoadContext = createHydrogenRouterContext;
