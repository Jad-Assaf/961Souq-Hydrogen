// app/routes/gaming-laptops.jsx
import React, {useState, useEffect, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import gamingLaptopsStyles from '~/styles/gaming-laptops.css?url';
import {useMenuHierarchy} from '~/lib/useMenuHierarchy';

const GAMING_LAPTOPS_MENU_HANDLE = 'gaming-laptops'; // adjust if your menu handle is different

const GAMING_LAPTOPS_MENU_QUERY = `#graphql
  query GamingLaptopsMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: gamingLaptopsStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(GAMING_LAPTOPS_MENU_QUERY, {
    variables: {handle: GAMING_LAPTOPS_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Gaming Laptops menu not found', {status: 404});
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

export default function GamingLaptopsCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  // Dynamic hierarchy (shared hook)
  const {
    levels,
    activeCollection,
    activeProducts,
    selectLevel,
    productsSectionRef,
  } = useMenuHierarchy(collections, {submenuPath: '/api/menu-submenu'});

  // Auto-select first top-level gaming-laptops collection on load (no scroll)
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
    <div className="gl-page">
      {/* HERO */}
      <section className="gl-hero">
        <div className="gl-hero-inner">
          <div className="gl-hero-copy">
            <p className="gl-eyebrow">Rig hub</p>
            <h1 className="gl-title">{menuTitle || 'Gaming Laptops'}</h1>
            <p className="gl-subtitle">
              High-refresh, RTX-packed gaming laptops tuned for performance.
              Pick a collection to match your FPS, thermals, and budget.
            </p>

            <div className="gl-spec-chips">
              <span className="gl-chip">144Hz+</span>
              <span className="gl-chip">RTX / Radeon</span>
              <span className="gl-chip">RGB keyboard</span>
            </div>
          </div>

          <div className="gl-hero-laptop">
            <div className="gl-hero-laptop-screen">
              <div className="gl-hero-laptop-video-slot">
                <iframe
                  className="gl-hero-laptop-video"
                  src="https://www.youtube.com/embed/kB4X3kHNaSo?si=fTMphzrzNBCNkBli&autoplay=1&mute=1&loop=1&controls=0&playsinline=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&playlist=kB4X3kHNaSo&vq=small"
                  title="Gaming Laptops showcase"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen={false}
                />
              </div>
            </div>
            <div className="gl-hero-laptop-base" />
            <div className="gl-hero-laptop-glow" />
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

        let heading = 'Shop gaming laptop collections';
        let subheading =
          'Explore curated gaming laptop groups by brand, GPU tier, and more.';

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

        const sectionId = `gl-collections-level${depth + 1}`;

        return (
          <section
            key={sectionId}
            className="gl-collections"
            id={sectionId}
            ref={(el) => {
              sectionRefs.current[depth] = el;
            }}
          >
            <header className="gl-section-header gl-section-header--compact">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </header>

            <div className="gl-collections-grid">
              {collectionsAtLevel.map((collection, index) => {
                const isActive = level.selectedIndex === index;

                return (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className={`gl-collection-card ${
                      isActive ? 'gl-collection-card--active' : ''
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
                    <div className="gl-collection-media">
                      {collection.image ? (
                        <img
                          src={`${collection.image.url}&width=300`}
                          alt={collection.image.altText || collection.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="gl-collection-placeholder">
                          <span>{collection.title?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>
                    <div className="gl-collection-body">
                      <h3>{collection.title}</h3>
                      {collection.description && (
                        <p className="gl-collection-description">
                          {collection.description}
                        </p>
                      )}
                      <span className="gl-collection-cta">Browse</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isRoot && collectionsAtLevel.length === 0 && (
              <p className="gl-empty-state">
                No Gaming Laptop collections are linked to the “gaming-laptops”
                menu yet.
              </p>
            )}
          </section>
        );
      })}

      {/* PRODUCTS SECTION (leaf collection) */}
      {activeCollection && (
        <section
          className="gl-products"
          id="gl-products"
          ref={productsSectionRef}
        >
          <header className="gl-products-header">
            <div className="gl-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="gl-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="gl-products-grid">
                {activeProducts.slice(0, 50).map((product) => {
                  const minPrice =
                    product.priceRange?.minVariantPrice?.amount ?? null;
                  const currency =
                    product.priceRange?.minVariantPrice?.currencyCode ?? '';
                  const isAvailable = product.availableForSale;
                  const imageUrl = product.featuredImage?.url
                    ? `${product.featuredImage.url}&width=300`
                    : null;

                  return (
                    <Link
                      key={product.id}
                      to={`/products/${product.handle}`}
                      className="gl-product-card"
                      prefetch="intent"
                    >
                      <div className="gl-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="gl-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="gl-product-body">
                        <h3 className="gl-product-title">{product.title}</h3>
                        <div className="gl-product-meta">
                          {minPrice && (
                            <span className="gl-product-price">
                              {currency
                                ? `$${minPrice}`
                                : `$${minPrice}`}
                            </span>
                          )}
                          <span
                            className={`gl-product-badge ${
                              isAvailable
                                ? 'gl-product-badge--in'
                                : 'gl-product-badge--out'
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

              <div className="gl-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="gl-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="gl-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
