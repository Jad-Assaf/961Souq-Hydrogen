// app/routes/photography.jsx
import React, {useEffect, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import photographyStyles from '~/styles/photography.css?url';
import {useMenuHierarchy} from '~/lib/useMenuHierarchy';

const PHOTOGRAPHY_MENU_HANDLE = 'photography'; // adjust if your menu handle is different

const PHOTOGRAPHY_MENU_QUERY = `#graphql
  query PhotographyMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: photographyStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(PHOTOGRAPHY_MENU_QUERY, {
    variables: {handle: PHOTOGRAPHY_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Photography menu not found', {status: 404});
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

export default function PhotographyCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

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

  // Smooth scroll from clicked parent to its submenu section
  const sectionRefs = useRef([]);
  const lastClickRef = useRef(null);

  useEffect(() => {
    const lastClick = lastClickRef.current;
    if (!lastClick) return;

    const targetDepth = lastClick.depth + 1;

    // If there is no deeper level yet, we’re still waiting for the submenu query.
    if (targetDepth >= levels.length) {
      return;
    }

    const targetLevel = levels[targetDepth];

    // If next level exists but has no collections, it might still be loading,
    // or it’s a leaf (products). In the leaf case, the hook scrolls to products.
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
    <div className="ph-page">
      {/* HERO */}
      <section className="ph-hero">
        <div className="ph-hero-inner">
          <div className="ph-hero-copy">
            <p className="ph-eyebrow">Category hub</p>
            <h1 className="ph-title">{menuTitle || 'Photography'}</h1>
            <p className="ph-subtitle">
              Cameras, lenses, lighting, mics and studio gear for creators –
              from compact setups to full shooting rigs.
            </p>

            <div className="ph-pill-row">
              <span className="ph-pill">Cameras &amp; lenses</span>
              <span className="ph-pill">Lighting &amp; audio</span>
              <span className="ph-pill">Studio &amp; field</span>
            </div>

            <div className="ph-meta-row">
              <div className="ph-meta-item">
                <span className="ph-meta-label">Best for</span>
                <span className="ph-meta-value">
                  Content creators • Studios • Filmmakers
                </span>
              </div>
              <div className="ph-meta-item">
                <span className="ph-meta-label">Includes</span>
                <span className="ph-meta-value">
                  Cameras, lenses, tripods, lights, audio &amp; more
                </span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – dark frame stack with “light spill” */}
          <div className="ph-hero-visual">
            <div className="ph-frame-stack">
              {/* back glow plate */}
              <div className="ph-frame-glow" />

              {/* rotated frames behind */}
              <div className="ph-frame-layer ph-frame-layer--left" />
              <div className="ph-frame-layer ph-frame-layer--right" />

              {/* main “live preview” frame */}
              <div className="ph-frame-main">
                <div className="ph-frame-main-header">
                  <span className="ph-led ph-led--red" />
                  <span className="ph-led ph-led--amber" />
                  <span className="ph-led ph-led--green" />
                  <span className="ph-frame-status">REC • 4K/24</span>
                </div>

                <div className="ph-frame-main-preview">
                  <div className="ph-preview-gradient" />
                  <div className="ph-preview-hud">
                    <span className="ph-preview-tag">Studio</span>
                    <span className="ph-preview-tag">Low light</span>
                  </div>
                  <div className="ph-preview-bottom">
                    <span className="ph-preview-metric">
                      ISO <strong>1600</strong>
                    </span>
                    <span className="ph-preview-metric">
                      f/<strong>1.8</strong>
                    </span>
                    <span className="ph-preview-metric">
                      1/<strong>60</strong>s
                    </span>
                  </div>
                </div>

                <div className="ph-frame-main-footer">
                  <div className="ph-meter">
                    <div className="ph-meter-bar ph-meter-bar--warm" />
                    <div className="ph-meter-bar ph-meter-bar--cool" />
                  </div>
                  <div className="ph-footer-labels">
                    <span>Highlight detail</span>
                    <span>Shadow detail</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION LEVELS (multi-level sub-collections) */}
      {levels.map((level, depth) => {
        const collectionsAtLevel = level.collections || [];
        if (!collectionsAtLevel.length) {
          // Don’t render empty levels
          return null;
        }

        const isRoot = depth === 0;

        // Parent collection for this level (for heading context)
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

        let heading = 'Shop photography collections';
        let subheading =
          'Explore cameras, lenses, lighting, audio and accessories grouped by brand, use-case and level.';

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

        const sectionId = `ph-collections-level${depth + 1}`;

        return (
          <section
            key={sectionId}
            className="ph-collections"
            id={sectionId}
            ref={(el) => {
              sectionRefs.current[depth] = el;
            }}
          >
            <header className="ph-collections-header">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </header>

            <div className="ph-collections-grid">
              {collectionsAtLevel.map((collection, index) => {
                const isActive = level.selectedIndex === index;

                return (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className={`ph-collection-card ${
                      isActive ? 'ph-collection-card--active' : ''
                    }`}
                    prefetch="intent"
                    onClick={(e) => {
                      e.preventDefault();
                      // Remember depth; when submenu loads, we scroll to that level.
                      lastClickRef.current = {depth};
                      selectLevel(depth, index, {scrollToProducts: true});
                    }}
                  >
                    <div className="ph-collection-media">
                      {collection.image ? (
                        <img
                          src={`${collection.image.url}&width=300`}
                          alt={collection.image.altText || collection.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="ph-collection-placeholder">
                          <span>{collection.title?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>

                    <div className="ph-collection-body">
                      <h3>{collection.title}</h3>
                      {collection.description && (
                        <p className="ph-collection-description">
                          {collection.description}
                        </p>
                      )}
                      <span className="ph-collection-cta">Browse</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isRoot && collectionsAtLevel.length === 0 && (
              <p className="ph-empty-state">
                No Photography collections are linked to the “photography” menu
                yet.
              </p>
            )}
          </section>
        );
      })}

      {/* PRODUCTS SECTION */}
      {activeCollection && (
        <section
          className="ph-products"
          id="ph-products"
          ref={productsSectionRef}
        >
          <header className="ph-products-header">
            <div className="ph-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="ph-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="ph-products-grid">
                {activeProducts.slice(0, 50).map((product) => {
                  const amountStr = product.priceRange?.minVariantPrice?.amount;
                  const amountNum = parseFloat(amountStr ?? '0');
                  const currency =
                    product.priceRange?.minVariantPrice?.currencyCode || '';
                  const hasPrice = !Number.isNaN(amountNum) && amountNum > 0;
                  const isAvailable = product.availableForSale;
                  const imageUrl = product.featuredImage?.url
                    ? `${product.featuredImage.url}&width=300`
                    : null;

                  return (
                    <Link
                      key={product.id}
                      to={`/products/${product.handle}`}
                      className="ph-product-card"
                      prefetch="intent"
                      target="_blank"
                    >
                      <div className="ph-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="ph-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="ph-product-body">
                        <h3 className="ph-product-title">{product.title}</h3>
                        <div className="ph-product-meta">
                          <span className="ph-product-price">
                            {hasPrice ? `$${amountStr}` : 'Call for Price'}
                          </span>
                          <span
                            className={`ph-product-badge ${
                              isAvailable
                                ? 'ph-product-badge--in'
                                : 'ph-product-badge--out'
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

              <div className="ph-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="ph-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="ph-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
