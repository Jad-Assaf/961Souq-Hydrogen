const SITE_NAME = '961Souq';
const SITE_DESCRIPTION =
  'Lebanon-based ecommerce store for electronics, appliances, mobile devices, computer parts, gaming gear, cosmetics, fitness products, and accessories.';

/**
 * Serve llms.txt at the site root for AI agents and agentic browsing tools.
 * @param {import('@shopify/remix-oxygen').LoaderFunctionArgs} args
 */
export async function loader({request}) {
  const url = new URL(request.url);
  const baseUrl = url.origin.replace(/\/\/www\./, '//');
  const body = renderLlmsTxt(baseUrl);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

function renderLlmsTxt(baseUrl) {
  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

961Souq is an online retail storefront serving customers in Lebanon. Use the links below to discover product categories, product detail pages, policies, contact information, and machine-readable sitemap data.

## Main Pages

- [Home](${baseUrl}/): Storefront homepage with current featured products and category navigation.
- [Collections](${baseUrl}/collections): Browse all product collections.
- [Contact](${baseUrl}/contact): Customer support and store contact page.
- [Policies](${baseUrl}/policies): Store policies, including privacy, refund, shipping, and terms pages where available.

## Product Categories

- [Mobiles](${baseUrl}/collections/mobiles): Mobile phones and related products.
- [Tablets](${baseUrl}/collections/tablets): Tablets and related products.
- [Apple](${baseUrl}/collections/apple): Apple products and accessories.
- [Gaming](${baseUrl}/collections/gaming): Gaming products and peripherals.
- [Gaming Laptops](${baseUrl}/collections/gaming-laptops): Gaming laptop products.
- [Business Laptops](${baseUrl}/collections/business-laptops): Business laptop products.
- [PC Parts](${baseUrl}/collections/pc-parts): Computer components and PC parts.
- [Monitors](${baseUrl}/collections/monitors): Computer monitors.
- [Networking](${baseUrl}/collections/networking): Networking equipment.
- [Audio](${baseUrl}/collections/audio): Audio products.
- [Photography](${baseUrl}/collections/photography): Cameras and photography products.
- [Home Appliances](${baseUrl}/collections/home-appliances): Home appliance products.
- [Cosmetics](${baseUrl}/cosmetics): Cosmetics shopping page.
- [Body Care](${baseUrl}/collections/body-care): Body care products.
- [Fitness](${baseUrl}/collections/fitness): Fitness products.
- [Accessories](${baseUrl}/collections/accessories): General accessories.

## Data Sources

- [Sitemap](${baseUrl}/sitemap.xml): XML sitemap index for static pages, products, collections, and pages.
- [Merchant Center Feed](${baseUrl}/merchant_center_sitemap.xml): Product feed for Google Merchant Center.

## Notes For Agents

- Product pricing, inventory, variants, and availability can change frequently. Prefer the live product page as the source of truth before recommending or comparing purchasable items.
- Product pages are available under ${baseUrl}/products/{handle}.
- Collection pages are available under ${baseUrl}/collections/{handle}.
`;
}
