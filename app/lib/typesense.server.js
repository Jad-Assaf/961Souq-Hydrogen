// app/lib/typesense.server.js
import Typesense from 'typesense';

export const TYPESENSE_PRODUCTS_COLLECTION = 'products';

function getSharedConfig(env) {
  const host = env.TYPESENSE_HOST;
  const port = Number(env.TYPESENSE_PORT || '443');
  const protocol = env.TYPESENSE_PROTOCOL || 'https';

  if (!host) {
    throw new Error('TYPESENSE_HOST is not set');
  }

  return {
    nodes: [
      {
        host,
        port,
        protocol,
      },
    ],
    connectionTimeoutSeconds: 5,
  };
}

export function getTypesenseAdminClientFromEnv(env) {
  const apiKey = env.TYPESENSE_ADMIN_API_KEY;
  if (!apiKey) {
    throw new Error('TYPESENSE_ADMIN_API_KEY is not set');
  }

  return new Typesense.Client({
    ...getSharedConfig(env),
    apiKey,
  });
}

export function getTypesenseSearchClientFromEnv(env) {
  const apiKey =
    env.TYPESENSE_SEARCH_ONLY_API_KEY || env.TYPESENSE_ADMIN_API_KEY;

  if (!apiKey) {
    throw new Error(
      'TYPESENSE_SEARCH_ONLY_API_KEY (or TYPESENSE_ADMIN_API_KEY) is not set',
    );
  }

  return new Typesense.Client({
    ...getSharedConfig(env),
    apiKey,
  });
}
