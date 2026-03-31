import {createHydrogenContext} from '@shopify/hydrogen';
import type {HydrogenEnv} from '@shopify/hydrogen';
import {WeaverseClient} from '@weaverse/hydrogen';
import {CART_QUERY_FRAGMENT} from '~/data/fragments';
import {AppSession} from '~/lib/session';
import {getLocaleFromRequest} from '~/lib/utils';
import {components} from '~/weaverse/components';
import {themeSchema} from '~/weaverse/schema.server';

type HydrogenAppEnv = HydrogenEnv & {
  PUBLIC_STOREFRONT_API_TOKEN?: string;
  PRIVATE_STOREFRONT_API_TOKEN?: string;
  SHOPIFY_STOREFRONT_PUBLIC_TOKEN?: string;
  SHOPIFY_STOREFRONT_PRIVATE_TOKEN?: string;
};

type HydrogenExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

function normalizeSecret(raw: unknown) {
  if (raw == null) return '';
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    return normalizeSecret((raw as {value?: unknown}).value);
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
 * */
export async function createHydrogenRouterContext(
  request: Request,
  env: HydrogenAppEnv,
  executionContext: HydrogenExecutionContext,
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
      (env as Record<string, string | undefined>).PUBLIC_STOREFRONT_API_TOKEN ||
        (env as Record<string, string | undefined>)
          .SHOPIFY_STOREFRONT_PUBLIC_TOKEN,
    ),
    PRIVATE_STOREFRONT_API_TOKEN: normalizeSecret(
      (env as Record<string, string | undefined>)
        .PRIVATE_STOREFRONT_API_TOKEN ||
        (env as Record<string, string | undefined>)
          .SHOPIFY_STOREFRONT_PRIVATE_TOKEN,
    ),
  } as HydrogenAppEnv;

  const hydrogenContext = createHydrogenContext({
    env: normalizedEnv,
    request,
    cache,
    waitUntil,
    session,
    i18n: getLocaleFromRequest(request),
    cart: {
      queryFragment: CART_QUERY_FRAGMENT,
    },
  });

  return Object.assign(hydrogenContext, {
    weaverse: new WeaverseClient({
      ...hydrogenContext,
      request,
      cache,
      themeSchema,
      components,
    }),
  });
}

export const createAppLoadContext = createHydrogenRouterContext;
