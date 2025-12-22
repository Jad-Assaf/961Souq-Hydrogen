// app/routes/mobiles.jsx
import React, {useEffect, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import mobilesStyles from '~/styles/mobiles.css?url';
import {useMenuHierarchy} from '~/lib/useMenuHierarchy';

const MOBILES_MENU_HANDLE = 'mobiles'; // adjust if your menu handle is different

const MOBILES_MENU_QUERY = `#graphql
  query MobilesMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: mobilesStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(MOBILES_MENU_QUERY, {
    variables: {handle: MOBILES_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Mobiles menu not found', {status: 404});
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

export default function MobilesCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  // Dynamic hierarchy using shared hook
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
    <div className="mob-page">
      {/* HERO */}
      <section className="mob-hero">
        <div className="mob-hero-inner">
          <div className="mob-hero-copy">
            <p className="mob-eyebrow">Category hub</p>
            <h1 className="mob-title">{menuTitle || 'Mobiles'}</h1>
            <p className="mob-subtitle">
              Daily drivers, gaming phones, and the accessories that keep them
              powered – iPhone, Android, and everything around them.
            </p>

            <div className="mob-pill-row">
              <span className="mob-pill">Apple iPhone</span>
              <span className="mob-pill">Samsung &amp; Android</span>
              <span className="mob-pill">Cases &amp; power</span>
            </div>

            <div className="mob-meta-row">
              <div className="mob-meta-item">
                <span className="mob-meta-label">Brands</span>
                <span className="mob-meta-value">
                  Apple • Samsung • Xiaomi • Pixel • ROG
                </span>
              </div>
              <div className="mob-meta-item">
                <span className="mob-meta-label">Includes</span>
                <span className="mob-meta-value">
                  Phones • Accessories • Power
                </span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – phone + floating chips */}
          <div className="mob-hero-visual">
            <div className="mob-hero-panel">
              <div className="mob-hero-gradient" />
              <div className="mob-hero-grid" />

              {/* phone shell */}
              <div className="mob-phone">
                <div className="mob-phone-inner">
                  <div className="mob-phone-notch" />
                  <div className="mob-phone-strip mob-phone-strip--top">
                    <span className="mob-strip-label">5G • Dual SIM</span>
                  </div>
                  <div className="mob-phone-strip mob-phone-strip--mid">
                    <span className="mob-strip-pill">
                      Work • Social • Gaming
                    </span>
                  </div>
                  <div className="mob-phone-strip mob-phone-strip--bottom">
                    <span className="mob-strip-label">
                      Battery health • 82%
                    </span>
                  </div>
                  <div className="mob-phone-glow" />
                </div>
              </div>

              {/* floating chips around phone */}
              <div className="mob-chip mob-chip--left-up">
                <span className="mob-chip-label">Phones</span>
              </div>
              <div className="mob-chip mob-chip--right-up">
                <span className="mob-chip-label">Accessories</span>
              </div>
              <div className="mob-chip mob-chip--left-down">
                <span className="mob-chip-label">Power banks</span>
              </div>
              <div className="mob-chip mob-chip--right-down">
                <span className="mob-chip-label">Gaming phones</span>
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

        let heading = 'Shop mobile collections';
        let subheading =
          'Browse by brand, phone type, or accessory – from iPhone and Samsung to chargers, power banks, and gaming-focused models.';

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

        const sectionId = `mob-collections-level${depth + 1}`;

        return (
          <section
            key={sectionId}
            className="mob-collections"
            id={sectionId}
            ref={(el) => {
              sectionRefs.current[depth] = el;
            }}
          >
            <header className="mob-collections-header">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </header>

            <div className="mob-collections-grid">
              {collectionsAtLevel.map((collection, index) => {
                const isActive = level.selectedIndex === index;

                return (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className={`mob-collection-card ${
                      isActive ? 'mob-collection-card--active' : ''
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
                    <div className="mob-collection-media">
                      {collection.image ? (
                        <img
                          src={`${collection.image.url}&width=300`}
                          alt={collection.image.altText || collection.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="mob-collection-placeholder">
                          <span>{collection.title?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>

                    <div className="mob-collection-body">
                      <h3>{collection.title}</h3>
                      {collection.description && (
                        <p className="mob-collection-description">
                          {collection.description}
                        </p>
                      )}
                      <span className="mob-collection-cta">Browse</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isRoot && collectionsAtLevel.length === 0 && (
              <p className="mob-empty-state">
                No Mobile collections are linked to the “mobiles” menu yet.
              </p>
            )}
          </section>
        );
      })}

      {/* PRODUCTS SECTION */}
      {activeCollection && (
        <section
          className="mob-products"
          id="mob-products"
          ref={productsSectionRef}
        >
          <header className="mob-products-header">
            <div className="mob-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="mob-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="mob-products-grid">
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
                      className="mob-product-card"
                      prefetch="intent"
                      target="_blank"
                    >
                      <div className="mob-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="mob-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="mob-product-body">
                        <h3 className="mob-product-title">{product.title}</h3>
                        <div className="mob-product-meta">
                          <span className="mob-product-price">
                            {hasPrice ? `$${amountStr}` : 'Call for Price'}
                          </span>
                          <span
                            className={`mob-product-badge ${
                              isAvailable
                                ? 'mob-product-badge--in'
                                : 'mob-product-badge--out'
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

              <div className="mob-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="mob-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="mob-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
