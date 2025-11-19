// app/routes/accessories.jsx
import React, {useEffect, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import accessoriesStyles from '~/styles/accessories.css?url';
import {useMenuHierarchy} from '~/lib/useMenuHierarchy';

const ACCESSORIES_MENU_HANDLE = 'accessories'; // adjust if your menu handle is different

const ACCESSORIES_MENU_QUERY = `#graphql
  query AccessoriesMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: accessoriesStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(ACCESSORIES_MENU_QUERY, {
    variables: {handle: ACCESSORIES_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Accessories menu not found', {status: 404});
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

export default function AccessoriesCategoryPage() {
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
    <div className="acc-page">
      {/* HERO */}
      <section className="acc-hero">
        <div className="acc-hero-inner">
          <div className="acc-hero-copy">
            <p className="acc-eyebrow">Category hub</p>
            <h1 className="acc-title">{menuTitle || 'Accessories'}</h1>
            <p className="acc-subtitle">
              From desk setups to car mounts, travel bags, scooters, printers,
              projectors, smart devices and more — all the extras that complete
              your tech life.
            </p>

            <div className="acc-pill-row">
              <span className="acc-pill">Desk &amp; computer</span>
              <span className="acc-pill">On the go</span>
              <span className="acc-pill">Home &amp; office</span>
            </div>

            <div className="acc-meta-row">
              <div className="acc-meta-item">
                <span className="acc-meta-label">Highlights</span>
                <span className="acc-meta-value">
                  Computer accessories • Smart devices • Software
                </span>
              </div>
              <div className="acc-meta-item">
                <span className="acc-meta-label">Also includes</span>
                <span className="acc-meta-value">
                  Car accessories • Bags • Scooters • Projectors
                </span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – layered tiles for desk / travel / home */}
          <div className="acc-hero-visual">
            <div className="acc-hero-board">
              {/* background halo */}
              <div className="acc-board-glow" />

              {/* top label strip */}
              <div className="acc-board-header">
                <span className="acc-board-dot acc-board-dot--green" />
                <span className="acc-board-dot acc-board-dot--amber" />
                <span className="acc-board-dot acc-board-dot--red" />
                <span className="acc-board-title">Accessory presets</span>
              </div>

              {/* stacked tiles */}
              <div className="acc-tile acc-tile--desk">
                <div className="acc-tile-tag">Desk setup</div>
                <p className="acc-tile-title">Computer accessories</p>
                <p className="acc-tile-text">
                  Keyboards, mice, hubs, stands and more for clean workspaces.
                </p>
              </div>

              <div className="acc-tile acc-tile--travel">
                <div className="acc-tile-tag acc-tile-tag--blue">On the go</div>
                <p className="acc-tile-title">Backpacks &amp; car mounts</p>
                <p className="acc-tile-text">
                  Travel bags, chargers and mounts for daily commuting.
                </p>
              </div>

              <div className="acc-tile acc-tile--home">
                <div className="acc-tile-tag acc-tile-tag--amber">Home</div>
                <p className="acc-tile-title">Smart home &amp; appliances</p>
                <p className="acc-tile-text">
                  Smart devices, printers, projectors and home appliances.
                </p>
              </div>

              {/* small connector chips at the side */}
              <div className="acc-chip-column">
                <div className="acc-chip">Smart devices</div>
                <div className="acc-chip">Printers</div>
                <div className="acc-chip">Projectors &amp; screens</div>
                <div className="acc-chip">Software</div>
              </div>

              {/* connector lines */}
              <div className="acc-connector acc-connector--top" />
              <div className="acc-connector acc-connector--middle" />
              <div className="acc-connector acc-connector--bottom" />
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

        let heading = 'Shop accessories collections';
        let subheading =
          'Browse by type: computer accessories, car accessories, backpacks and bags, home appliances, printers, scooters, projectors & screens, smart devices and software.';

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

        const sectionId = `acc-collections-level${depth + 1}`;

        return (
          <section
            key={sectionId}
            className="acc-collections"
            id={sectionId}
            ref={(el) => {
              sectionRefs.current[depth] = el;
            }}
          >
            <header className="acc-collections-header">
              <h2>{heading}</h2>
              <p>{subheading}</p>
            </header>

            <div className="acc-collections-grid">
              {collectionsAtLevel.map((collection, index) => {
                const isActive = level.selectedIndex === index;

                return (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className={`acc-collection-card ${
                      isActive ? 'acc-collection-card--active' : ''
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
                    <div className="acc-collection-media">
                      {collection.image ? (
                        <img
                          src={`${collection.image.url}&width=300`}
                          alt={collection.image.altText || collection.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="acc-collection-placeholder">
                          <span>{collection.title?.charAt(0) || '?'}</span>
                        </div>
                      )}
                    </div>

                    <div className="acc-collection-body">
                      <h3>{collection.title}</h3>
                      {collection.description && (
                        <p className="acc-collection-description">
                          {collection.description}
                        </p>
                      )}
                      <span className="acc-collection-cta">Browse</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isRoot && collectionsAtLevel.length === 0 && (
              <p className="acc-empty-state">
                No Accessories collections are linked to the “accessories” menu
                yet.
              </p>
            )}
          </section>
        );
      })}

      {/* PRODUCTS SECTION */}
      {activeCollection && (
        <section
          className="acc-products"
          id="acc-products"
          ref={productsSectionRef}
        >
          <header className="acc-products-header">
            <div className="acc-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="acc-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="acc-products-grid">
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
                      className="acc-product-card"
                      prefetch="intent"
                    >
                      <div className="acc-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="acc-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="acc-product-body">
                        <h3 className="acc-product-title">{product.title}</h3>
                        <div className="acc-product-meta">
                          <span className="acc-product-price">
                            {hasPrice ? `$${amountStr}` : 'Call for Price'}
                          </span>
                          <span
                            className={`acc-product-badge ${
                              isAvailable
                                ? 'acc-product-badge--in'
                                : 'acc-product-badge--out'
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

              <div className="acc-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="acc-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="acc-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
