import {flattenConnection} from '@shopify/hydrogen';

const MAX_URLS_PER_PAGE = 250; // Shopify API limit per query
const GOOGLE_SITEMAP_LIMIT = 50000; // Absolute Google limit
const MAX_URLS_PER_SITEMAP = 2500; // Your requested split size

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader({request, context: {storefront}}) {
  const baseUrl = new URL(request.url).origin;
  const pathname = new URL(request.url).pathname;

  /* ---------- Fetch all resources (once) ---------- */
  const [products, collections, pages] = await Promise.all([
    fetchAllResources({storefront, query: PRODUCTS_QUERY, field: 'products'}),
    fetchAllResources({
      storefront,
      query: COLLECTIONS_QUERY,
      field: 'collections',
    }),
    fetchAllResources({storefront, query: PAGES_QUERY, field: 'pages'}),
  ]);

  /* ---------- Helpers ---------- */
  const chunk = (arr, size) =>
    Array.from({length: Math.ceil(arr.length / size)}, (_, i) =>
      arr.slice(i * size, i * size + size),
    );

  const productsChunks = chunk(products, MAX_URLS_PER_SITEMAP);
  const pagesChunks = chunk(pages, MAX_URLS_PER_SITEMAP);

  /* ---------- Route matching ---------- */
  const headers = {
    'Content-Type': 'application/xml',
    'Cache-Control': `max-age=${60 * 60 * 24}`, // 24 h
  };

  // 1 ) Root sitemap index ----------------------------------------------------
  if (pathname === '/sitemap.xml' || pathname === '/sitemap') {
    const indexEntries = [
      ...productsChunks.map(
        (_, i) => `${baseUrl}/sitemap-products-${i + 1}.xml`,
      ),
      ...pagesChunks.map((_, i) => `${baseUrl}/sitemap-pages-${i + 1}.xml`),
      `${baseUrl}/sitemap-collections.xml`,
    ];

    const body = `
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${indexEntries
          .map((loc) => `<sitemap><loc>${loc}</loc></sitemap>`)
          .join('\n')}
      </sitemapindex>
    `.trim();

    return new Response(body, {headers});
  }

  // 2 ) Product sitemap parts -------------------------------------------------
  const prodMatch = pathname.match(/\/sitemap-products-(\d+)\.xml$/);
  if (prodMatch) {
    const idx = Number(prodMatch[1]) - 1;
    const chunkData = productsChunks[idx];
    if (!chunkData) return new Response('Not found', {status: 404});

    const body = generateUrlset(
      chunkData.map((p) => ({
        url: `${baseUrl}/products/${xmlEncode(p.handle)}`,
        lastMod: p.updatedAt,
        changeFreq: 'daily',
        image: p.featuredImage
          ? {
              url: xmlEncode(p.featuredImage.url),
              title: xmlEncode(p.title),
              caption: xmlEncode(p.featuredImage.altText || ''),
            }
          : null,
      })),
    );

    return new Response(body, {headers});
  }

  // 3 ) Pages sitemap parts ---------------------------------------------------
  const pageMatch = pathname.match(/\/sitemap-pages-(\d+)\.xml$/);
  if (pageMatch) {
    const idx = Number(pageMatch[1]) - 1;
    const chunkData = pagesChunks[idx];
    if (!chunkData) return new Response('Not found', {status: 404});

    const body = generateUrlset(
      chunkData.map((pg) => ({
        url: `${baseUrl}/pages/${xmlEncode(pg.handle)}`,
        lastMod: pg.updatedAt,
        changeFreq: 'weekly',
      })),
    );

    return new Response(body, {headers});
  }

  // 4 ) Collections sitemap ---------------------------------------------------
  if (pathname === '/sitemap-collections.xml') {
    const body = generateUrlset(
      collections.map((col) => ({
        url: `${baseUrl}/collections/${xmlEncode(col.handle)}`,
        lastMod: col.updatedAt,
        changeFreq: 'daily',
      })),
    );

    return new Response(body, {headers});
  }

  // 5 ) Anything else ---------------------------------------------------------
  return new Response('Not found', {status: 404});
}

/* -------------------------------------------------------------------------- */
/*                               Helper functions                             */
/* -------------------------------------------------------------------------- */

/**
 * Fetch all paginated resources using flattenConnection.
 */
async function fetchAllResources({storefront, query, field}) {
  let allNodes = [];
  let cursor = null;

  do {
    const res = await storefront.query(query, {
      variables: {first: MAX_URLS_PER_PAGE, after: cursor},
    });

    const conn = res?.[field];
    if (!conn) break;

    allNodes = allNodes.concat(flattenConnection(conn));
    cursor = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (cursor && allNodes.length < GOOGLE_SITEMAP_LIMIT);

  return allNodes.slice(0, GOOGLE_SITEMAP_LIMIT);
}

/**
 * Turn an array of URL meta objects into a complete <urlset>.
 */
function generateUrlset(items) {
  return `
    <urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    >
      ${items.map(renderUrlTag).join('\n')}
    </urlset>
  `.trim();
}

/**
 * Render a single <url> element.
 */
function renderUrlTag({url, lastMod, changeFreq, image}) {
  const imageTag = image
    ? `
      <image:image>
        <image:loc>${image.url}</image:loc>
        <image:title>${image.title}</image:title>
        <image:caption>${image.caption}</image:caption>
      </image:image>
    `.trim()
    : '';

  return `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastMod}</lastmod>
      <changefreq>${changeFreq}</changefreq>
      ${imageTag}
    </url>
  `.trim();
}

/**
 * XML-safe encoding.
 */
function xmlEncode(str) {
  return str.replace(/[&<>'"]/g, (ch) => `&#${ch.charCodeAt(0)};`);
}

/* -------------------------------------------------------------------------- */
/*                                GraphQL queries                             */
/* -------------------------------------------------------------------------- */

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $after: String) {
    products(
      first: $first
      after: $after
      query: "published_status:'online_store:visible'"
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        updatedAt
        title
        featuredImage {
          url
          altText
        }
      }
    }
  }
`;

const COLLECTIONS_QUERY = /* GraphQL */ `
  query Collections($first: Int!, $after: String) {
    collections(
      first: $first
      after: $after
      query: "published_status:'online_store:visible'"
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        updatedAt
      }
    }
  }
`;

const PAGES_QUERY = /* GraphQL */ `
  query Pages($first: Int!, $after: String) {
    pages(first: $first, after: $after, query: "published_status:'published'") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        updatedAt
      }
    }
  }
`;
