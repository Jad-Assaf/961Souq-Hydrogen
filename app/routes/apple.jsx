// app/routes/apple.jsx
import React, {useEffect, useRef, useState} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import appleStyles from '~/styles/apple.css?url';
import {useMenuHierarchy} from '~/lib/useMenuHierarchy';

const APPLE_MENU_HANDLE = 'apple';

const APPLE_MENU_QUERY = `#graphql
  query AppleMenuCollections($handle: String!) {
    menu(handle: $handle) {
      id
      title
      items {
        id
        title
        url
        resource {
          __typename
          ... on Collection {
            id
            handle
            title
            description
            image {
              url
              altText
            }
            products(first: 50) {
              nodes {
                id
                handle
                title
                availableForSale
                featuredImage {
                  id
                  url
                  altText
                  width
                  height
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const links = () => [{rel: 'stylesheet', href: appleStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(APPLE_MENU_QUERY, {
    variables: {handle: APPLE_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Apple menu not found', {status: 404});
  }

  const collections =
    menu.items
      ?.map((item) => item?.resource)
      ?.filter(
        (resource) => resource && resource.__typename === 'Collection',
      ) || [];

  return json({
    menuTitle: menu.title,
    collections,
  });
}

export default function AppleCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  // Hero ripple state
  const [isRippling, setIsRippling] = useState(false);

  const handleLogoClick = () => {
    setIsRippling(false);
    requestAnimationFrame(() => {
      setIsRippling(true);
    });
  };

  useEffect(() => {
    if (!isRippling) return;
    const timeout = setTimeout(() => setIsRippling(false), 1600);
    return () => clearTimeout(timeout);
  }, [isRippling]);

  // Dynamic hierarchy
  const {
    levels,
    activeCollection,
    activeProducts,
    selectLevel,
    productsSectionRef,
  } = useMenuHierarchy(collections, {submenuPath: '/api/menu-submenu'});

  // Auto-select first top-level collection on load (no scroll)
  useEffect(() => {
    if (!collections || collections.length === 0) return;
    if (!levels || levels.length === 0) return;

    const root = levels[0];
    if (!root || root.collections.length === 0) return;

    if (root.selectedIndex == null) {
      selectLevel(0, 0, {scrollToProducts: false});
    }
  }, [collections, levels, selectLevel]);

  // Smooth scroll between levels
  // Smooth scroll between levels
  const sectionRefs = useRef([]);
  const lastClickRef = useRef(null);

  useEffect(() => {
    const lastClick = lastClickRef.current;
    if (!lastClick) return;

    const targetDepth = lastClick.depth + 1;

    // ⛔ Do NOT clear lastClickRef just because the next level
    // doesn't exist yet. That just means we're still waiting
    // for the submenu query to finish.
    if (targetDepth >= levels.length) {
      // No deeper level yet → wait for the next levels update.
      return;
    }

    const targetLevel = levels[targetDepth];

    // If the next level exists but has no collections, it means either:
    // - It’s still loading, or
    // - There is no submenu and this click was a leaf.
    // In both cases, the hook handles scrolling to products if needed,
    // so we just watch for real collections here.
    if (!targetLevel || !targetLevel.collections?.length) {
      return;
    }

    const el = sectionRefs.current[targetDepth];
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      // ✅ We’ve scrolled to the new level; clear the click marker.
      lastClickRef.current = null;
    }
  }, [levels]);

  return (
    <div className="apple-page">
      {/* HERO */}
      <section className="apple-hero" id="apple-hero-section">
        <div className="apple-hero-inner">
          <div className="apple-hero-copy">
            <p className="apple-eyebrow">Category hub</p>
            <h1 className="apple-title">{menuTitle || 'Apple'}</h1>
            <p className="apple-subtitle">
              All your Apple gear in one place – Mac, iPhone, iPad, Watch and
              accessories, curated from 961Souq.
            </p>
          </div>

          <div
            className={`apple-hero-orbit ${
              isRippling ? 'apple-hero-orbit--rippling' : ''
            }`}
          >
            <div className="orbit-circle orbit-circle--outer" />
            <div className="orbit-circle orbit-circle--inner" />

            <div
              className={`apple-logo-pill ${
                isRippling ? 'apple-logo-pill--rippling' : ''
              }`}
              onClick={handleLogoClick}
              role="button"
              aria-label="Trigger Apple ripple animation"
            >
              <span className="apple-logo-pill-icon">
                <svg
                  width="24px"
                  height="24px"
                  viewBox="-1.5 0 20 20"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <title>apple [#173]</title>
                    <desc>Created with Sketch.</desc>
                    <defs></defs>
                    <g
                      id="Page-1"
                      stroke="none"
                      strokeWidth="1"
                      fill="none"
                      fillRule="evenodd"
                    >
                      <g
                        id="Dribbble-Light-Preview"
                        transform="translate(-102.000000, -7439.000000)"
                        fill="#000000"
                      >
                        <g
                          id="icons"
                          transform="translate(56.000000, 160.000000)"
                        >
                          <path
                            d="M57.5708873,7282.19296 C58.2999598,7281.34797 58.7914012,7280.17098 58.6569121,7279 C57.6062792,7279.04 56.3352055,7279.67099 55.5818643,7280.51498 C54.905374,7281.26397 54.3148354,7282.46095 54.4735932,7283.60894 C55.6455696,7283.69593 56.8418148,7283.03894 57.5708873,7282.19296 M60.1989864,7289.62485 C60.2283111,7292.65181 62.9696641,7293.65879 63,7293.67179 C62.9777537,7293.74279 62.562152,7295.10677 61.5560117,7296.51675 C60.6853718,7297.73474 59.7823735,7298.94772 58.3596204,7298.97372 C56.9621472,7298.99872 56.5121648,7298.17973 54.9134635,7298.17973 C53.3157735,7298.17973 52.8162425,7298.94772 51.4935978,7298.99872 C50.1203933,7299.04772 49.0738052,7297.68074 48.197098,7296.46676 C46.4032359,7293.98379 45.0330649,7289.44985 46.8734421,7286.3899 C47.7875635,7284.87092 49.4206455,7283.90793 51.1942837,7283.88393 C52.5422083,7283.85893 53.8153044,7284.75292 54.6394294,7284.75292 C55.4635543,7284.75292 57.0106846,7283.67793 58.6366882,7283.83593 C59.3172232,7283.86293 61.2283842,7284.09893 62.4549652,7285.8199 C62.355868,7285.8789 60.1747177,7287.09489 60.1989864,7289.62485"
                            id="apple-[#173]"
                          ></path>
                        </g>
                      </g>
                    </g>
                  </g>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION LEVELS (0, 1, 2, ... unlimited) */}
      {levels.map((level, depth) => {
        const collectionsAtLevel = level.collections || [];
        if (!collectionsAtLevel.length) {
          // Don’t render empty levels
          return null;
        }

        const isRoot = depth === 0;

        // Parent collection for this level (for headings)
        let parentTitle = null;
        if (!isRoot && levels[depth - 1]) {
          const parentLevel = levels[depth - 1];
          if (
            parentLevel.selectedIndex != null &&
            parentLevel.selectedIndex < parentLevel.collections.length
          ) {
            parentTitle =
              parentLevel.collections[parentLevel.selectedIndex]?.title || null;
          }
        }

        let heading = 'Shop by collection';
        let subheading =
          'Pick a collection to see its sub-collections or products.';

        if (!isRoot) {
          heading = parentTitle
            ? `${parentTitle} sub-collections`
            : 'Sub-collections';
          if (depth === 1) {
            subheading = 'Select a sub-collection to refine further.';
          } else {
            subheading = 'Choose a sub-collection to go deeper.';
          }
        }

        const sectionId = `apple-collections-level${depth + 1}`;

        return (
          <section
            key={sectionId}
            className="apple-collections"
            id={sectionId}
            ref={(el) => {
              sectionRefs.current[depth] = el;
            }}
          >
            <header className="apple-collections-header">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </header>

            <div className="apple-collections-grid">
              {collectionsAtLevel.map((collection, index) => {
                const isActive = level.selectedIndex === index;

                return (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className={`apple-collection-card ${
                      isActive ? 'apple-collection-card--active' : ''
                    }`}
                    prefetch="intent"
                    onClick={(e) => {
                      e.preventDefault();
                      // Remember which depth was clicked; when the submenu for this
                      // depth loads, the effect above will scroll to that section.
                      lastClickRef.current = {depth};
                      selectLevel(depth, index, {scrollToProducts: true});
                    }}
                  >
                    <div className="apple-collection-media">
                      {collection.image ? (
                        <img
                          src={`${collection.image.url}&width=300`}
                          alt={collection.image.altText || collection.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="apple-collection-placeholder">
                          <span>{collection.title?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>

                    <div className="apple-collection-body">
                      <h3>{collection.title}</h3>
                      {collection.description && (
                        <p className="apple-collection-description">
                          {collection.description}
                        </p>
                      )}
                      <span className="apple-collection-cta">Browse</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isRoot && collectionsAtLevel.length === 0 && (
              <p className="apple-empty-state">
                No Apple collections are linked to the “apple” menu yet.
              </p>
            )}
          </section>
        );
      })}

      {/* PRODUCTS: leaf collection (no submenu) */}
      {activeCollection && (
        <section
          className="apple-products"
          id="apple-products"
          ref={productsSectionRef}
        >
          <header className="apple-products-header">
            <div className="apple-products-header-top">
              <h2>{activeCollection.title}</h2>
              <span className="apple-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="apple-products-grid">
                {activeProducts.slice(0, 50).map((product) => {
                  const minPrice =
                    product.priceRange?.minVariantPrice?.amount ?? null;
                  const currency =
                    product.priceRange?.minVariantPrice?.currencyCode ?? '';
                  const isAvailable = product.availableForSale;
                  const minPriceAmount = Number(
                    product.priceRange?.minVariantPrice?.amount ?? 0,
                  );
                  const displayPrice =
                    !Number.isFinite(minPriceAmount) || minPriceAmount <= 0
                      ? 'Call for price'
                      : `$${minPriceAmount}`;

                  return (
                    <Link
                      key={product.id}
                      to={`/products/${product.handle}`}
                      className="apple-product-card"
                      prefetch="intent"
                      target="_blank"
                    >
                      <div className="apple-product-media">
                        {product.featuredImage ? (
                          <img
                            src={`${product.featuredImage.url}&width=300`}
                            alt={product.featuredImage.altText || product.title}
                            loading="lazy"
                          />
                        ) : (
                          <div className="apple-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="apple-product-body">
                        <h3 className="apple-product-title">{product.title}</h3>
                        <div className="apple-product-meta">
                          <span className="apple-product-price">
                            {displayPrice}
                          </span>
                          <span
                            className={`apple-product-badge ${
                              isAvailable
                                ? 'apple-product-badge--in'
                                : 'apple-product-badge--out'
                            }`}
                          >
                            {isAvailable ? 'In stock' : 'Sold out'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="apple-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="apple-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="apple-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
