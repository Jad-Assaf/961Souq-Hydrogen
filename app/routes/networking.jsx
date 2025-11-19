// app/routes/networking.jsx
import React, {useEffect, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import networkingStyles from '~/styles/networking.css?url';
import {useMenuHierarchy} from '~/lib/useMenuHierarchy';

const NETWORKING_MENU_HANDLE = 'networking'; // adjust if your menu handle is different

const NETWORKING_MENU_QUERY = `#graphql
  query NetworkingMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: networkingStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(NETWORKING_MENU_QUERY, {
    variables: {handle: NETWORKING_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Networking menu not found', {status: 404});
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

export default function NetworkingCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  // Dynamic hierarchy (shared hook)
  const {
    levels,
    activeCollection,
    activeProducts,
    selectLevel,
    productsSectionRef,
  } = useMenuHierarchy(collections, {submenuPath: '/api/menu-submenu'});

  // Auto-select first top-level networking collection on load (no scroll)
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
    <div className="nw-page">
      {/* HERO */}
      <section className="nw-hero">
        <div className="nw-hero-inner">
          <div className="nw-hero-copy">
            <p className="nw-eyebrow">Category hub</p>
            <h1 className="nw-title">{menuTitle || 'Networking'}</h1>
            <p className="nw-subtitle">
              Routers, mesh Wi-Fi, access points, and switches to keep every
              room, floor, and device online with stable, fast coverage.
            </p>

            <div className="nw-pill-row">
              <span className="nw-pill">Wi-Fi 7</span>
              <span className="nw-pill">Mesh systems</span>
              <span className="nw-pill">Gigabit wired</span>
            </div>

            <div className="nw-meta-row">
              <div className="nw-meta-item">
                <span className="nw-meta-label">Ideal for</span>
                <span className="nw-meta-value">Home • Office • Gaming</span>
              </div>
              <div className="nw-meta-item">
                <span className="nw-meta-label">Coverage</span>
                <span className="nw-meta-value">1–6 rooms • multi-floor</span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – coverage rings + hotspots */}
          <div className="nw-hero-visual">
            <div className="nw-map">
              <div className="nw-map-grid" />

              {/* coverage rings */}
              <div className="nw-ring nw-ring--outer" />
              <div className="nw-ring nw-ring--middle" />
              <div className="nw-ring nw-ring--inner" />

              {/* central router */}
              <div className="nw-router-pill">
                <div className="nw-router-icon">
                  <span className="nw-router-bar" />
                  <span className="nw-router-wave nw-router-wave--two" />
                </div>
                <span className="nw-router-label">Main router</span>
              </div>

              {/* small hotspot chips */}
              <div className="nw-chip nw-chip--mesh">
                <span className="nw-chip-label">Mesh node</span>
              </div>
              <div className="nw-chip nw-chip--office">
                <span className="nw-chip-label">Office</span>
              </div>
              <div className="nw-chip nw-chip--living">
                <span className="nw-chip-label">Living room</span>
              </div>

              {/* blue signal dots */}
              <span className="nw-node nw-node--one" />
              <span className="nw-node nw-node--two" />
              <span className="nw-node nw-node--three" />
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

        let heading = 'Shop networking collections';
        let subheading =
          'Grouped by use case and spec – from compact home routers to full mesh kits and pro switches.';

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

        const sectionId = `nw-collections-level${depth + 1}`;

        return (
          <section
            key={sectionId}
            className="nw-collections"
            id={sectionId}
            ref={(el) => {
              sectionRefs.current[depth] = el;
            }}
          >
            <header className="nw-collections-header">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </header>

            <div className="nw-collections-grid">
              {collectionsAtLevel.map((collection, index) => {
                const isActive = level.selectedIndex === index;

                return (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className={`nw-collection-card ${
                      isActive ? 'nw-collection-card--active' : ''
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
                    <div className="nw-collection-media">
                      {collection.image ? (
                        <img
                          src={`${collection.image.url}&width=300`}
                          alt={collection.image.altText || collection.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="nw-collection-placeholder">
                          <span>{collection.title?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>

                    <div className="nw-collection-body">
                      <h3>{collection.title}</h3>
                      {collection.description && (
                        <p className="nw-collection-description">
                          {collection.description}
                        </p>
                      )}
                      <span className="nw-collection-cta">Browse</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isRoot && collectionsAtLevel.length === 0 && (
              <p className="nw-empty-state">
                No Networking collections are linked to the “networking” menu
                yet.
              </p>
            )}
          </section>
        );
      })}

      {/* PRODUCTS SECTION */}
      {activeCollection && (
        <section
          className="nw-products"
          id="nw-products"
          ref={productsSectionRef}
        >
          <header className="nw-products-header">
            <div className="nw-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="nw-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="nw-products-grid">
                {activeProducts.slice(0, 50).map((product) => {
                  const amountStr = product.priceRange?.minVariantPrice?.amount;
                  const amountNum = parseFloat(amountStr ?? '0');
                  const currency =
                    product.priceRange?.minVariantPrice?.currencyCode ?? '';
                  const hasPrice = !Number.isNaN(amountNum) && amountNum > 0;
                  const isAvailable = product.availableForSale;
                  const imageUrl = product.featuredImage?.url
                    ? `${product.featuredImage.url}&width=300`
                    : null;

                  return (
                    <Link
                      key={product.id}
                      to={`/products/${product.handle}`}
                      className="nw-product-card"
                      prefetch="intent"
                    >
                      <div className="nw-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="nw-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="nw-product-body">
                        <h3 className="nw-product-title">{product.title}</h3>
                        <div className="nw-product-meta">
                          <span className="nw-product-price">
                            {hasPrice
                              ? currency
                                ? `$${amountStr}`
                                : `$${amountStr}`
                              : 'Call for Price'}
                          </span>
                          <span
                            className={`nw-product-badge ${
                              isAvailable
                                ? 'nw-product-badge--in'
                                : 'nw-product-badge--out'
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

              <div className="nw-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="nw-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="nw-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
