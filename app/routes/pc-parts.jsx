// app/routes/pc-parts.jsx
import React, {useEffect, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import pcPartsStyles from '~/styles/pc-parts.css?url';
import {useMenuHierarchy} from '~/lib/useMenuHierarchy';

const PC_PARTS_MENU_HANDLE = 'pc-parts'; // adjust if your menu handle is different

const PC_PARTS_MENU_QUERY = `#graphql
  query PcPartsMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: pcPartsStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(PC_PARTS_MENU_QUERY, {
    variables: {handle: PC_PARTS_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('PC Parts menu not found', {status: 404});
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

export default function PcPartsCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  // Dynamic hierarchy (shared hook)
  const {
    levels,
    activeCollection,
    activeProducts,
    selectLevel,
    productsSectionRef,
  } = useMenuHierarchy(collections, {submenuPath: '/api/menu-submenu'});

  // Auto-select first top-level pc-parts collection on load (no scroll)
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
    <div className="pp-page">
      {/* HERO */}
      <section className="pp-hero">
        <div className="pp-hero-inner">
          <div className="pp-hero-copy">
            <p className="pp-eyebrow">Category hub</p>
            <h1 className="pp-title">{menuTitle || 'PC Parts'}</h1>
            <p className="pp-subtitle">
              CPUs, GPUs, motherboards, storage and more. Build or upgrade your
              rig with compatible, curated parts.
            </p>

            <div className="pp-pill-row">
              <span className="pp-pill">CPUs</span>
              <span className="pp-pill">GPUs</span>
              <span className="pp-pill">Motherboards</span>
              <span className="pp-pill">RAM &amp; storage</span>
            </div>

            <div className="pp-meta-row">
              <div className="pp-meta-item">
                <span className="pp-meta-label">Builder level</span>
                <span className="pp-meta-value">Entry • Mid • Enthusiast</span>
              </div>
              <div className="pp-meta-item">
                <span className="pp-meta-label">Platforms</span>
                <span className="pp-meta-value">Intel • AMD</span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – light PCB-style board with floating part tiles */}
          <div className="pp-hero-visual">
            <div className="pp-board">
              <div className="pp-board-grid" />

              {/* center socket */}
              <div className="pp-chip pp-chip--cpu">
                <span className="pp-chip-label">CPU</span>
              </div>

              {/* tiles around */}
              <div className="pp-chip pp-chip--gpu">
                <span className="pp-chip-label">GPU</span>
              </div>

              <div className="pp-chip pp-chip--mb">
                <span className="pp-chip-label">Motherboard</span>
              </div>

              <div className="pp-chip pp-chip--ram">
                <span className="pp-chip-label">RAM</span>
              </div>

              <div className="pp-chip pp-chip--storage">
                <span className="pp-chip-label">Storage</span>
              </div>

              {/* traces */}
              <span className="pp-trace pp-trace--one" />
              <span className="pp-trace pp-trace--two" />
              <span className="pp-trace pp-trace--three" />

              {/* subtle pulse nodes */}
              <span className="pp-node pp-node--one" />
              <span className="pp-node pp-node--two" />
              <span className="pp-node pp-node--three" />
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

        let heading = 'Shop PC parts collections';
        let subheading =
          'Browse focused groups of components – by platform, tier, or part type – to match your build.';

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

        const sectionId = `pp-collections-level${depth + 1}`;

        return (
          <section
            key={sectionId}
            className="pp-collections"
            id={sectionId}
            ref={(el) => {
              sectionRefs.current[depth] = el;
            }}
          >
            <header className="pp-collections-header">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </header>

            <div className="pp-collections-grid">
              {collectionsAtLevel.map((collection, index) => {
                const isActive = level.selectedIndex === index;

                return (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className={`pp-collection-card ${
                      isActive ? 'pp-collection-card--active' : ''
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
                    <div className="pp-collection-media">
                      {collection.image ? (
                        <img
                          src={`${collection.image.url}&width=300`}
                          alt={collection.image.altText || collection.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="pp-collection-placeholder">
                          <span>{collection.title?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>

                    <div className="pp-collection-body">
                      <h3>{collection.title}</h3>
                      {collection.description && (
                        <p className="pp-collection-description">
                          {collection.description}
                        </p>
                      )}
                      <span className="pp-collection-cta">Browse</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isRoot && collectionsAtLevel.length === 0 && (
              <p className="pp-empty-state">
                No PC Parts collections are linked to the “pc-parts” menu yet.
              </p>
            )}
          </section>
        );
      })}

      {/* PRODUCTS SECTION */}
      {activeCollection && (
        <section
          className="pp-products"
          id="pp-products"
          ref={productsSectionRef}
        >
          <header className="pp-products-header">
            <div className="pp-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="pp-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="pp-products-grid">
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
                      className="pp-product-card"
                      prefetch="intent"
                    >
                      <div className="pp-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="pp-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="pp-product-body">
                        <h3 className="pp-product-title">{product.title}</h3>
                        <div className="pp-product-meta">
                          <span className="pp-product-price">
                            {hasPrice
                              ? currency
                                ? `${currency} ${amountStr}`
                                : `$${amountStr}`
                              : 'Call for Price'}
                          </span>
                          <span
                            className={`pp-product-badge ${
                              isAvailable
                                ? 'pp-product-badge--in'
                                : 'pp-product-badge--out'
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

              <div className="pp-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="pp-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="pp-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
