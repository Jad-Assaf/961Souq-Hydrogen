// app/routes/photography.jsx
import React, {useState, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import photographyStyles from '~/styles/photography.css?url';

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
  const [selectedCollectionHandle, setSelectedCollectionHandle] = useState(
    collections[0]?.handle || null,
  );
  const productsSectionRef = useRef(null);

  const handleCollectionClick = (handle) => {
    setSelectedCollectionHandle(handle);
    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const activeCollection =
    collections.find((c) => c.handle === selectedCollectionHandle) ||
    collections[0];

  const activeProducts = activeCollection?.products?.nodes || [];

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

      {/* COLLECTION GRID */}
      <section className="ph-collections">
        <header className="ph-collections-header">
          <h2>Shop photography collections</h2>
          <p>
            Explore cameras, lenses, lighting, audio and accessories grouped by
            brand, use-case and level.
          </p>
        </header>

        <div className="ph-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className={`ph-collection-card ${
                collection.handle === activeCollection?.handle
                  ? 'ph-collection-card--active'
                  : ''
              }`}
              prefetch="intent"
              onClick={(e) => {
                e.preventDefault();
                handleCollectionClick(collection.handle);
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
          ))}

          {collections.length === 0 && (
            <p className="ph-empty-state">
              No Photography collections are linked to the “photography” menu
              yet.
            </p>
          )}
        </div>
      </section>

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
                            {hasPrice
                              ? `${currency} ${amountStr}`
                              : 'Call for Price'}
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
