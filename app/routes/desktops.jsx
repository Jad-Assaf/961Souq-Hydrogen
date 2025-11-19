// app/routes/desktops.jsx
import React, {useEffect, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import desktopsStyles from '~/styles/desktops.css?url';
import {useMenuHierarchy} from '~/lib/useMenuHierarchy';

const DESKTOPS_MENU_HANDLE = 'desktops'; // adjust if your menu handle is different

const DESKTOPS_MENU_QUERY = `#graphql
  query DesktopsMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: desktopsStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(DESKTOPS_MENU_QUERY, {
    variables: {handle: DESKTOPS_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Desktops menu not found', {status: 404});
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

export default function DesktopsCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  // Dynamic hierarchy (shared hook)
  const {
    levels,
    activeCollection,
    activeProducts,
    selectLevel,
    productsSectionRef,
  } = useMenuHierarchy(collections, {submenuPath: '/api/menu-submenu'});

  // Auto-select first top-level desktops collection on load (no scroll)
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

  // Filter products to only those with a valid positive price (keeps your priced-only logic)
  const pricedProducts = (activeProducts || []).filter((product) => {
    const amountStr = product.priceRange?.minVariantPrice?.amount;
    const amountNum = parseFloat(amountStr ?? '0');
    return !Number.isNaN(amountNum) && amountNum > 0;
  });

  return (
    <div className="d-page">
      {/* HERO */}
      <section className="d-hero">
        <div className="d-hero-inner">
          <div className="d-hero-copy">
            <p className="d-eyebrow">Category hub</p>
            <h1 className="d-title">{menuTitle || 'Desktops'}</h1>
            <p className="d-subtitle">
              Tower rigs for everything from spreadsheets to esports. Browse
              both business workstations and RGB-ready gaming builds in one
              place.
            </p>

            <div className="d-pill-row">
              <span className="d-pill d-pill--business">Business desktops</span>
              <span className="d-pill d-pill--gaming">Gaming towers</span>
              <span className="d-pill">All-in-one PCs</span>
            </div>

            <div className="d-meta-row">
              <div className="d-meta-item">
                <span className="d-meta-label">Use cases</span>
                <span className="d-meta-value">Office • Creative • Gaming</span>
              </div>
              <div className="d-meta-item">
                <span className="d-meta-label">Form factors</span>
                <span className="d-meta-value">Mini • Mid • Full tower</span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – hybrid business + gaming desktop stack */}
          <div className="d-hero-visual">
            <div className="d-rig">
              {/* business tower */}
              <div className="d-rig-case d-rig-case--business">
                <div className="d-rig-case-top" />
                <div className="d-rig-case-inner">
                  <div className="d-rig-led-strip d-rig-led-strip--business" />
                  <div className="d-rig-ports" />
                </div>
                <div className="d-rig-foot d-rig-foot--left" />
                <div className="d-rig-foot d-rig-foot--right" />
              </div>

              {/* gaming tower */}
              <div className="d-rig-case d-rig-case--gaming">
                <div className="d-rig-case-top d-rig-case-top--gaming" />
                <div className="d-rig-case-inner d-rig-case-inner--gaming">
                  <div className="d-rig-fan-ring d-rig-fan-ring--top" />
                  <div className="d-rig-fan-ring d-rig-fan-ring--mid" />
                  <div className="d-rig-fan-ring d-rig-fan-ring--bottom" />
                </div>
                <div className="d-rig-foot d-rig-foot--left" />
                <div className="d-rig-foot d-rig-foot--right" />
              </div>

              <div className="d-rig-shadow" />

              {/* vertical performance bars */}
              <div className="d-rig-bars">
                <span className="d-rig-bar d-rig-bar--short" />
                <span className="d-rig-bar d-rig-bar--mid" />
                <span className="d-rig-bar d-rig-bar--tall" />
              </div>
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

        let heading = 'Shop desktop collections';
        let subheading =
          'Pick from curated groups of gaming towers, business workstations, and creator builds.';

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

        const sectionId = `d-collections-level${depth + 1}`;

        return (
          <section
            key={sectionId}
            className="d-collections"
            id={sectionId}
            ref={(el) => {
              sectionRefs.current[depth] = el;
            }}
          >
            <header className="d-collections-header">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </header>

            <div className="d-collections-grid">
              {collectionsAtLevel.map((collection, index) => {
                const isActive = level.selectedIndex === index;

                return (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className={`d-collection-card ${
                      isActive ? 'd-collection-card--active' : ''
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
                    <div className="d-collection-media">
                      {collection.image ? (
                        <img
                          src={`${collection.image.url}&width=300`}
                          alt={collection.image.altText || collection.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="d-collection-placeholder">
                          <span>{collection.title?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>

                    <div className="d-collection-body">
                      <h3>{collection.title}</h3>
                      <span className="d-collection-cta">Browse</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isRoot && collectionsAtLevel.length === 0 && (
              <p className="d-empty-state">
                No Desktop collections are linked to the “desktops” menu yet.
              </p>
            )}
          </section>
        );
      })}

      {/* PRODUCTS SECTION (leaf collection, priced only) */}
      {activeCollection && (
        <section
          className="d-products"
          id="d-products"
          ref={productsSectionRef}
        >
          <header className="d-products-header">
            <div className="d-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="d-products-pill">
                Showing up to 50 products (priced)
              </span>
            </div>
          </header>

          {pricedProducts.length > 0 ? (
            <>
              <div className="d-products-grid">
                {pricedProducts.slice(0, 50).map((product) => {
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
                      className="d-product-card"
                      prefetch="intent"
                    >
                      <div className="d-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="d-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="d-product-body">
                        <h3 className="d-product-title">{product.title}</h3>
                        <div className="d-product-meta">
                          {minPrice && (
                            <span className="d-product-price">
                              {currency
                                ? `$${minPrice}`
                                : `$${minPrice}`}
                            </span>
                          )}
                          <span
                            className={`d-product-badge ${
                              isAvailable
                                ? 'd-product-badge--in'
                                : 'd-product-badge--out'
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

              <div className="d-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="d-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="d-products-empty">
              No priced products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
