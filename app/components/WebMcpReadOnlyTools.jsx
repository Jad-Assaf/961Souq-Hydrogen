import {useEffect} from 'react';

const TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const SEARCH_PRODUCTS_TOOL = {
  name: 'search_products',
  description:
    'Search the 961Souq product catalog and return matching products with titles, handles, prices, images, and product URLs.',
  ...TOOL_ANNOTATIONS,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        minLength: 1,
        maxLength: 120,
        description: 'Product search query, such as a brand, model, or category.',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 10,
        default: 5,
        description: 'Maximum number of products to return.',
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
  annotations: TOOL_ANNOTATIONS,
};

const GET_PRODUCT_TOOL = {
  name: 'get_product_summary',
  description:
    'Get read-only product details from 961Souq by product handle, including title, vendor, type, description, price range, availability, variants, and canonical URL.',
  ...TOOL_ANNOTATIONS,
  inputSchema: {
    type: 'object',
    properties: {
      handle: {
        type: 'string',
        minLength: 1,
        maxLength: 160,
        pattern: '^[a-zA-Z0-9][a-zA-Z0-9_-]*$',
        description: 'Product handle from a 961Souq product URL.',
      },
    },
    required: ['handle'],
    additionalProperties: false,
  },
  annotations: TOOL_ANNOTATIONS,
};

const GET_STORE_NAVIGATION_TOOL = {
  name: 'get_store_navigation',
  description:
    'Return key 961Souq store pages, category URLs, sitemap URL, and contact/policy URLs for navigation.',
  ...TOOL_ANNOTATIONS,
  inputSchema: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  annotations: TOOL_ANNOTATIONS,
};

const STORE_CATEGORIES = [
  ['Mobiles', '/collections/mobiles'],
  ['Tablets', '/collections/tablets'],
  ['Apple', '/collections/apple'],
  ['Gaming', '/collections/gaming'],
  ['Gaming Laptops', '/collections/gaming-laptops'],
  ['Business Laptops', '/collections/business-laptops'],
  ['PC Parts', '/collections/pc-parts'],
  ['Monitors', '/collections/monitors'],
  ['Networking', '/collections/networking'],
  ['Audio', '/collections/audio'],
  ['Photography', '/collections/photography'],
  ['Home Appliances', '/collections/home-appliances'],
  ['Cosmetics', '/cosmetics'],
  ['Body Care', '/collections/body-care'],
  ['Fitness', '/collections/fitness'],
  ['Accessories', '/collections/accessories'],
];

export default function WebMcpReadOnlyTools() {
  useEffect(() => {
    if (window.__961souqWebMcpRegistered) return;

    const registry = findWebMcpRegistry();
    if (!registry) return;

    const tools = [
      {
        ...SEARCH_PRODUCTS_TOOL,
        execute: searchProducts,
      },
      {
        ...GET_PRODUCT_TOOL,
        execute: getProductSummary,
      },
      {
        ...GET_STORE_NAVIGATION_TOOL,
        execute: getStoreNavigation,
      },
    ];

    const registered = registerTools(registry, tools);
    if (registered) {
      window.__961souqWebMcpRegistered = true;
    }
  }, []);

  return null;
}

function findWebMcpRegistry() {
  const nav = window.navigator || {};
  const candidates = [
    window.webMCP,
    window.webMcp,
    window.WebMCP,
    nav.webMCP,
    nav.webMcp,
    nav.mcp,
  ];

  return candidates.find((candidate) => candidate && typeof candidate === 'object');
}

function registerTools(registry, tools) {
  if (
    typeof registry.registerTools === 'function' &&
    tryRegister(() => registry.registerTools(tools))
  ) {
    return true;
  }

  const target =
    registry.tools && typeof registry.tools.register === 'function'
      ? registry.tools
      : registry;

  if (typeof target.registerTool === 'function') {
    return tools.every((tool) =>
      tryRegister(() => target.registerTool(tool, tool.execute)) ||
      tryRegister(() =>
        target.registerTool(
          tool.name,
          getToolMetadata(tool),
          tool.execute,
        ),
      ) ||
      tryRegister(() => target.registerTool(tool.name, tool.execute)),
    );
  }

  if (typeof target.register === 'function') {
    return tools.every((tool) =>
      tryRegister(() => target.register(tool, tool.execute)) ||
      tryRegister(() =>
        target.register(tool.name, getToolMetadata(tool), tool.execute),
      ) ||
      tryRegister(() => target.register(tool.name, tool.execute)),
    );
  }

  return false;
}

function tryRegister(register) {
  try {
    register();
    return true;
  } catch (_error) {
    return false;
  }
}

function getToolMetadata(tool) {
  const {execute, ...metadata} = tool;
  return metadata;
}

async function searchProducts(input = {}) {
  const query = String(input.query || '').trim();
  const limit = clampInteger(input.limit, 5, 1, 10);

  if (!query) {
    return createToolResult({error: 'Missing query', products: []});
  }

  const params = new URLSearchParams({
    q: query,
    perPage: String(limit),
    page: '1',
  });
  const response = await fetch(`/api/typesensesearch?${params.toString()}`, {
    headers: {'Accept': 'application/json'},
  });
  const data = await response.json();

  if (!response.ok) {
    return createToolResult({
      error: data?.error || 'Search failed',
      products: [],
    });
  }

  const products = (data.hits || []).slice(0, limit).map((product) => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    vendor: product.vendor,
    price: product.price,
    available: product.available,
    image: absolutizeUrl(product.image),
    url: absolutizeUrl(product.url || `/products/${product.handle}`),
  }));

  return createToolResult({
    query,
    found: data.found || products.length,
    products,
  });
}

async function getProductSummary(input = {}) {
  const handle = String(input.handle || '').trim();

  if (!handle) {
    return createToolResult({error: 'Missing handle'});
  }

  const params = new URLSearchParams({handle});
  const response = await fetch(`/api/mcp-product?${params.toString()}`, {
    headers: {'Accept': 'application/json'},
  });
  const data = await response.json();

  if (!response.ok) {
    return createToolResult({error: data?.error || 'Product lookup failed'});
  }

  return createToolResult(data);
}

async function getStoreNavigation() {
  const origin = window.location.origin;

  return createToolResult({
    name: '961Souq',
    home: `${origin}/`,
    collections: `${origin}/collections`,
    contact: `${origin}/contact`,
    policies: `${origin}/policies`,
    sitemap: `${origin}/sitemap.xml`,
    llms: `${origin}/llms.txt`,
    categories: STORE_CATEGORIES.map(([name, path]) => ({
      name,
      url: `${origin}${path}`,
    })),
  });
}

function createToolResult(data) {
  const text = JSON.stringify(data, null, 2);

  return {
    structuredContent: data,
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

function clampInteger(value, fallback, min, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function absolutizeUrl(value) {
  if (!value) return null;

  try {
    return new URL(value, window.location.origin).toString();
  } catch (_error) {
    return null;
  }
}
