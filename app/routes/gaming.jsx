// app/routes/gaming.jsx
import React, {useState, useEffect, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import gamingStyles from '~/styles/gaming.css?url';
import {useMenuHierarchy} from '~/lib/useMenuHierarchy';

const GAMING_MENU_HANDLE = 'gaming';

const GAMING_MENU_QUERY = `#graphql
  query GamingMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: gamingStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(GAMING_MENU_QUERY, {
    variables: {handle: GAMING_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Gaming menu not found', {status: 404});
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

export default function GamingCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  // RGB pill state
  const [rgbActive, setRgbActive] = useState(false);

  const handleLogoClick = () => {
    setRgbActive((prev) => !prev);
  };

  // Dynamic hierarchy (shared hook)
  const {
    levels,
    activeCollection,
    activeProducts,
    selectLevel,
    productsSectionRef,
  } = useMenuHierarchy(collections, {submenuPath: '/api/menu-submenu'});

  // Auto-select first top-level gaming collection on load (no scroll)
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
  const sectionRefs = useRef([]);
  const lastClickRef = useRef(null);

  useEffect(() => {
    const lastClick = lastClickRef.current;
    if (!lastClick) return;

    const targetDepth = lastClick.depth + 1;

    // If there is no deeper level yet, we’re still waiting for the submenu
    // query to resolve. Do nothing and wait for the next levels update.
    if (targetDepth >= levels.length) {
      return;
    }

    const targetLevel = levels[targetDepth];

    // If the next level exists but has no collections, either:
    // - it’s still loading, or
    // - there is no submenu and this was a leaf click.
    // In the leaf case, the hook scrolls to products; we only handle
    // real submenu sections here.
    if (!targetLevel || !targetLevel.collections?.length) {
      return;
    }

    const el = sectionRefs.current[targetDepth];
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      lastClickRef.current = null;
    }
  }, [levels]);

  return (
    <div className="gaming-page">
      {/* HERO */}
      <section className="gaming-hero" id="gaming-hero-section">
        <div className="gaming-hero-inner">
          <div className="gaming-hero-copy">
            <p className="gaming-eyebrow">Category hub</p>
            <h1 className="gaming-title">{menuTitle || 'Gaming'}</h1>
            <p className="gaming-subtitle">
              Build your setup with gaming laptops, desktops, monitors,
              peripherals and more – tuned for performance at 961Souq.
            </p>
          </div>

          <div
            className={`gaming-hero-orbit ${
              rgbActive ? 'gaming-hero-orbit--rgb' : ''
            }`}
          >
            <div className="gaming-orbit-circle gaming-orbit-circle--outer" />
            <div className="gaming-orbit-circle gaming-orbit-circle--inner" />

            <div
              className={`gaming-logo-pill ${
                rgbActive ? 'gaming-logo-pill--rgb' : ''
              }`}
              onClick={handleLogoClick}
              role="button"
              aria-label="Toggle gaming RGB ring"
            >
              <span className="gaming-logo-pill-icon">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7.5 9.5h-1a.5.5 0 0 0-.5.5v1H5a.5.5 0 0 0-.5.5v1c0 .276.224.5.5.5h1v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1v-1a.5.5 0 0 0-.5-.5z"
                    fill="#e5e7eb"
                  />
                  <circle cx="15.5" cy="11" r="0.9" fill="#22c55e" />
                  <circle cx="17.5" cy="13" r="0.9" fill="#3b82f6" />
                  <circle cx="17.5" cy="9" r="0.9" fill="#f97316" />
                  <circle cx="19.2" cy="11" r="0.9" fill="#ef4444" />
                  <path
                    d="M8.25 6.5h7.5c1.95 0 2.9.0 3.61.52.7.5 1.12 1.28 1.29 2.39l.53 3.42c.22 1.41-.63 2.74-1.98 3.13a2.75 2.75 0 0 1-2.8-.76l-.86-.93H9.46l-.86.93a2.75 2.75 0 0 1-2.8.76c-1.35-.39-2.2-1.72-1.98-3.13l.53-3.42c.17-1.11.6-1.89 1.29-2.39.71-.52 1.66-.52 3.61-.52z"
                    fill="#020617"
                    stroke="#4b5563"
                    strokeWidth="1"
                  />
                </svg>
              </span>
              <span className="gaming-logo-pill-label">
                {rgbActive ? 'Gaming mode: ON' : 'Gaming mode: OFF'}
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

        let heading = 'Shop gaming collections';
        let subheading =
          'Explore curated groups of gaming gear – from high-refresh monitors to RGB-ready accessories.';

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

        const sectionId = `gaming-collections-level${depth + 1}`;

        return (
          <section
            key={sectionId}
            className="gaming-collections"
            id={sectionId}
            ref={(el) => {
              sectionRefs.current[depth] = el;
            }}
          >
            <header className="gaming-collections-header">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </header>

            <div className="gaming-collections-grid">
              {collectionsAtLevel.map((collection, index) => {
                const isActive = level.selectedIndex === index;

                return (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className={`gaming-collection-card ${
                      isActive ? 'gaming-collection-card--active' : ''
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
                    <div className="gaming-collection-media">
                      {collection.image ? (
                        <img
                          src={`${collection.image.url}&width=300`}
                          alt={collection.image.altText || collection.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="gaming-collection-placeholder">
                          <span>{collection.title?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>

                    <div className="gaming-collection-body">
                      <h3>{collection.title}</h3>
                      {collection.description && (
                        <p className="gaming-collection-description">
                          {collection.description}
                        </p>
                      )}
                      <span className="gaming-collection-cta">Enter</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isRoot && collectionsAtLevel.length === 0 && (
              <p className="gaming-empty-state">
                No Gaming collections are linked to the “gaming” menu yet.
              </p>
            )}
          </section>
        );
      })}

      {/* PRODUCTS: leaf collection (no submenu) */}
      {activeCollection && (
        <section
          className="gaming-products"
          id="gaming-products"
          ref={productsSectionRef}
        >
          <header className="gaming-products-header">
            <div className="gaming-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="gaming-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="gaming-products-grid">
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
                      className="gaming-product-card"
                      prefetch="intent"
                      target="_blank"
                    >
                      <div className="gaming-product-media">
                        {product.featuredImage ? (
                          <img
                            src={`${product.featuredImage.url}&width=300`}
                            alt={product.featuredImage.altText || product.title}
                            loading="lazy"
                          />
                        ) : (
                          <div className="gaming-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="gaming-product-body">
                        <h3 className="gaming-product-title">
                          {product.title}
                        </h3>
                        <div className="gaming-product-meta">
                          <span className="gaming-product-price">
                            {displayPrice}
                          </span>
                          <span
                            className={`gaming-product-badge ${
                              isAvailable
                                ? 'gaming-product-badge--in'
                                : 'gaming-product-badge--out'
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

              <div className="gaming-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="gaming-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="gaming-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
