import {flattenConnection} from '@shopify/hydrogen';

const MAX_URLS_PER_PAGE = 250;
const MAX_RESOURCE_LIMIT = 50000;
const DEFAULT_MAX_URLS_PER_SITEMAP = 10000;
const PRODUCTS_MAX_URLS_PER_SITEMAP = 2500;

const SITEMAP_SECTIONS = {
  STATIC: 'static',
  PRODUCTS: 'products',
  COLLECTIONS: 'collections',
  PAGES: 'pages',
};

const DYNAMIC_SITEMAP_SECTIONS = new Set([
  SITEMAP_SECTIONS.PRODUCTS,
  SITEMAP_SECTIONS.COLLECTIONS,
  SITEMAP_SECTIONS.PAGES,
]);

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader({request, context: {storefront}}) {
  const requestUrl = new URL(request.url);
  const baseUrl = getCanonicalOrigin(requestUrl.origin);

  const section = requestUrl.searchParams.get('section');
  const part = parsePositiveInt(requestUrl.searchParams.get('part')) || 1;

  if (section) {
    if (section === SITEMAP_SECTIONS.STATIC) {
      const staticChunks = getSectionChunks({
        section: SITEMAP_SECTIONS.STATIC,
        urls: getStaticUrls(baseUrl),
      });
      const urls = staticChunks[part - 1];

      if (!urls) {
        return new Response('Sitemap segment not found', {status: 404});
      }

      return createXmlResponse(renderUrlSet(urls), 60 * 60 * 24);
    }

    if (!DYNAMIC_SITEMAP_SECTIONS.has(section)) {
      return new Response('Invalid sitemap section', {status: 400});
    }

    const resources = await fetchSectionResources({section, storefront});
    const urls = buildSectionUrls({section, resources, baseUrl});
    const chunks = getSectionChunks({section, urls});
    const currentChunk = chunks[part - 1];

    if (!currentChunk) {
      return new Response('Sitemap segment not found', {status: 404});
    }

    return createXmlResponse(renderUrlSet(currentChunk), 60 * 60 * 24);
  }

  const [products, collections, pages] = await Promise.all([
    fetchSectionResources({section: SITEMAP_SECTIONS.PRODUCTS, storefront}),
    fetchSectionResources({section: SITEMAP_SECTIONS.COLLECTIONS, storefront}),
    fetchSectionResources({section: SITEMAP_SECTIONS.PAGES, storefront}),
  ]);

  const sectionChunks = {
    [SITEMAP_SECTIONS.STATIC]: getSectionChunks({
      section: SITEMAP_SECTIONS.STATIC,
      urls: getStaticUrls(baseUrl),
    }),
    [SITEMAP_SECTIONS.PRODUCTS]: getSectionChunks({
      section: SITEMAP_SECTIONS.PRODUCTS,
      urls: buildSectionUrls({
        section: SITEMAP_SECTIONS.PRODUCTS,
        resources: products,
        baseUrl,
      }),
    }),
    [SITEMAP_SECTIONS.COLLECTIONS]: getSectionChunks({
      section: SITEMAP_SECTIONS.COLLECTIONS,
      urls: buildSectionUrls({
        section: SITEMAP_SECTIONS.COLLECTIONS,
        resources: collections,
        baseUrl,
      }),
    }),
    [SITEMAP_SECTIONS.PAGES]: getSectionChunks({
      section: SITEMAP_SECTIONS.PAGES,
      urls: buildSectionUrls({
        section: SITEMAP_SECTIONS.PAGES,
        resources: pages,
        baseUrl,
      }),
    }),
  };

  const sitemapIndex = renderSitemapIndex({baseUrl, sectionChunks});

  return createXmlResponse(sitemapIndex, 60 * 60);
}

function getCanonicalOrigin(origin) {
  return origin.replace(/\/\/www\./, '//');
}

function createXmlResponse(body, maxAgeSeconds) {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${maxAgeSeconds}`,
    },
  });
}

function getStaticUrls(baseUrl) {
  return [
    {
      loc: `${baseUrl}/`,
      changeFreq: 'daily',
    },
    {
      loc: `${baseUrl}/collections`,
      changeFreq: 'weekly',
    },
    {
      loc: `${baseUrl}/contact`,
      changeFreq: 'weekly',
    },
    {
      loc: `${baseUrl}/policies`,
      changeFreq: 'weekly',
    },
  ];
}

function buildSectionUrls({section, resources, baseUrl}) {
  if (section === SITEMAP_SECTIONS.PRODUCTS) {
    return resources
      .filter((resource) => resource?.handle)
      .map((product) => ({
        loc: `${baseUrl}/products/${encodeURIComponent(product.handle)}`,
        lastMod: product.updatedAt || product.createdAt,
        changeFreq: 'daily',
        image: product.featuredImage?.url || null,
      }));
  }

  if (section === SITEMAP_SECTIONS.COLLECTIONS) {
    return resources
      .filter((resource) => resource?.handle)
      .map((collection) => ({
        loc: `${baseUrl}/collections/${encodeURIComponent(collection.handle)}`,
        lastMod: collection.updatedAt || collection.createdAt,
        changeFreq: 'weekly',
      }));
  }

  if (section === SITEMAP_SECTIONS.PAGES) {
    return resources
      .filter((resource) => resource?.handle)
      .map((page) => ({
        loc: `${baseUrl}/pages/${encodeURIComponent(page.handle)}`,
        lastMod: page.updatedAt || page.createdAt,
        changeFreq: 'weekly',
      }));
  }

  return [];
}

async function fetchSectionResources({section, storefront}) {
  const configBySection = {
    [SITEMAP_SECTIONS.PRODUCTS]: {
      query: PRODUCTS_QUERY,
      field: 'products',
    },
    [SITEMAP_SECTIONS.COLLECTIONS]: {
      query: COLLECTIONS_QUERY,
      field: 'collections',
    },
    [SITEMAP_SECTIONS.PAGES]: {
      query: PAGES_QUERY,
      field: 'pages',
    },
  };

  const config = configBySection[section];
  if (!config) return [];

  const resources = await fetchAllResources({
    storefront,
    query: config.query,
    field: config.field,
  });

  return sortResourcesStable(resources);
}

/**
 * Fetch all paginated resources up to MAX_RESOURCE_LIMIT.
 * @param {{storefront: any; query: string; field: string}} options
 */
async function fetchAllResources({storefront, query, field}) {
  let allNodes = [];
  let nextPageCursor = null;

  do {
    const response = await storefront.query(query, {
      variables: {
        first: MAX_URLS_PER_PAGE,
        after: nextPageCursor,
      },
    });

    const connection = response?.[field];
    if (!connection) break;

    const nodes = flattenConnection(connection);
    allNodes = allNodes.concat(nodes);

    nextPageCursor = connection.pageInfo.hasNextPage
      ? connection.pageInfo.endCursor
      : null;
  } while (nextPageCursor && allNodes.length < MAX_RESOURCE_LIMIT);

  return allNodes.slice(0, MAX_RESOURCE_LIMIT);
}

/**
 * Keep stable ordering so newly created entities end up in the final segment.
 */
function sortResourcesStable(resources) {
  return [...resources].sort((a, b) => {
    const aTimestamp = toTimestamp(a?.createdAt || a?.updatedAt);
    const bTimestamp = toTimestamp(b?.createdAt || b?.updatedAt);

    if (aTimestamp !== bTimestamp) {
      return aTimestamp - bTimestamp;
    }

    const aKey = `${a?.handle || ''}:${a?.id || ''}`;
    const bKey = `${b?.handle || ''}:${b?.id || ''}`;

    return aKey.localeCompare(bKey);
  });
}

function toTimestamp(value) {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function chunkArray(items, size) {
  if (!items.length) return [];

  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getSectionChunkSize(section) {
  if (section === SITEMAP_SECTIONS.PRODUCTS) {
    return PRODUCTS_MAX_URLS_PER_SITEMAP;
  }

  return DEFAULT_MAX_URLS_PER_SITEMAP;
}

function getSectionChunks({section, urls}) {
  const chunks = chunkArray(urls, getSectionChunkSize(section));
  return chunks.length ? chunks : [[]];
}

function renderSitemapIndex({baseUrl, sectionChunks}) {
  const entries = Object.entries(sectionChunks).flatMap(([section, chunks]) => {
    if (!chunks.length) return [];

    return chunks.map((chunk, index) => ({
      loc: `${baseUrl}/sitemap.xml?section=${encodeURIComponent(
        section,
      )}&part=${index + 1}`,
      lastMod: getChunkLastMod(chunk),
    }));
  });

  return `
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${entries.map(renderSitemapIndexEntry).join('\n')}
    </sitemapindex>
  `.trim();
}

function renderSitemapIndexEntry({loc, lastMod}) {
  return `
    <sitemap>
      <loc>${xmlEncode(loc)}</loc>
      ${lastMod ? `<lastmod>${xmlEncode(lastMod)}</lastmod>` : ''}
    </sitemap>
  `.trim();
}

function getChunkLastMod(chunk) {
  const timestamps = chunk
    .map((item) => item?.lastMod)
    .filter(Boolean)
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value));

  if (!timestamps.length) return null;

  return new Date(Math.max(...timestamps)).toISOString();
}

function renderUrlSet(urls) {
  return `
    <urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    >
      ${urls.map(renderUrlTag).join('\n')}
    </urlset>
  `.trim();
}

function renderUrlTag({loc, lastMod, changeFreq, image}) {
  return `
    <url>
      <loc>${xmlEncode(loc)}</loc>
      ${lastMod ? `<lastmod>${xmlEncode(lastMod)}</lastmod>` : ''}
      ${changeFreq ? `<changefreq>${xmlEncode(changeFreq)}</changefreq>` : ''}
      ${
        image
          ? `<image:image><image:loc>${xmlEncode(
              image,
            )}</image:loc></image:image>`
          : ''
      }
    </url>
  `.trim();
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function xmlEncode(value) {
  return String(value || '').replace(/[&<>'"]/g, (char) => {
    return `&#${char.charCodeAt(0)};`;
  });
}

const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "status:active AND published_status:'online_store:visible'") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        createdAt
        updatedAt
        featuredImage {
          url
          altText
        }
      }
    }
  }
`;

const COLLECTIONS_QUERY = `#graphql
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after, query: "published_status:'online_store:visible'") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        updatedAt
      }
    }
  }
`;

const PAGES_QUERY = `#graphql
  query Pages($first: Int!, $after: String) {
    pages(first: $first, after: $after, query: "published_status:'published'") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        updatedAt
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
