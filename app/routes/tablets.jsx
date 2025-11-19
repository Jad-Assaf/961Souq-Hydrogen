// app/routes/tablets.jsx
import React, {useState, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import tabletsStyles from '~/styles/tablets.css?url';

const TABLETS_MENU_HANDLE = 'tablets'; // adjust if your menu handle is different

const TABLETS_MENU_QUERY = `#graphql
  query TabletsMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: tabletsStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(TABLETS_MENU_QUERY, {
    variables: {handle: TABLETS_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Tablets menu not found', {status: 404});
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

export default function TabletsCategoryPage() {
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
    <div className="tab-page">
      {/* HERO */}
      <section className="tab-hero">
        <div className="tab-hero-inner">
          <div className="tab-hero-copy">
            <p className="tab-eyebrow">Category hub</p>
            <h1 className="tab-title">{menuTitle || 'Tablets'}</h1>
            <p className="tab-subtitle">
              Work, draw, watch, or study on the go. Mix iPad and Android
              tablets with keyboards, pens, and covers that match your flow.
            </p>

            <div className="tab-pill-row">
              <span className="tab-pill">Note-taking</span>
              <span className="tab-pill">Media &amp; streaming</span>
              <span className="tab-pill">Keyboard &amp; pen</span>
            </div>

            <div className="tab-meta-row">
              <div className="tab-meta-item">
                <span className="tab-meta-label">Sizes</span>
                <span className="tab-meta-value">8″ • 10″ • 13″+</span>
              </div>
              <div className="tab-meta-item">
                <span className="tab-meta-label">Use cases</span>
                <span className="tab-meta-value">Study • Office • Travel</span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – angled tablet + floating tiles (no grid) */}
          <div className="tab-hero-visual">
            <div className="tab-hero-panel">
              <div className="tab-hero-blob tab-hero-blob--one" />
              <div className="tab-hero-blob tab-hero-blob--two" />

              {/* tablet shell */}
              <div className="tab-device">
                <div className="tab-device-inner">
                  <div className="tab-device-screen">
                    <div className="tab-device-screen-layer tab-device-screen-layer--pink" />
                    <div className="tab-device-screen-layer tab-device-screen-layer--blue" />
                    <div className="tab-device-screen-layer tab-device-screen-layer--yellow" />
                  </div>
                  <div className="tab-device-dock">
                    <span className="tab-device-dot tab-device-dot--one" />
                    <span className="tab-device-dot tab-device-dot--two" />
                    <span className="tab-device-dot tab-device-dot--three" />
                  </div>
                </div>
              </div>

              {/* floating tiles */}
              <div className="tab-float tile-notes">
                <p className="tab-float-label">Notes &amp; sketch</p>
              </div>
              <div className="tab-float tile-split">
                <p className="tab-float-label">Split-screen work</p>
              </div>
              <div className="tab-float tile-play">
                <p className="tab-float-label">Series &amp; games</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="tab-collections">
        <header className="tab-collections-header">
          <h2>Shop tablet collections</h2>
          <p>
            Browse by platform, size, or accessory bundle – from iPad and
            Android tablets to pens, keyboards, and covers.
          </p>
        </header>

        <div className="tab-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className={`tab-collection-card ${
                collection.handle === activeCollection?.handle
                  ? 'tab-collection-card--active'
                  : ''
              }`}
              prefetch="intent"
              onClick={(e) => {
                e.preventDefault();
                handleCollectionClick(collection.handle);
              }}
            >
              <div className="tab-collection-media">
                {collection.image ? (
                  <img
                    src={`${collection.image.url}&width=300`}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="tab-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="tab-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="tab-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="tab-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="tab-empty-state">
              No Tablet collections are linked to the “tablets” menu yet.
            </p>
          )}
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      {activeCollection && (
        <section
          className="tab-products"
          id="tab-products"
          ref={productsSectionRef}
        >
          <header className="tab-products-header">
            <div className="tab-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="tab-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="tab-products-grid">
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
                      className="tab-product-card"
                      prefetch="intent"
                    >
                      <div className="tab-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="tab-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="tab-product-body">
                        <h3 className="tab-product-title">{product.title}</h3>
                        <div className="tab-product-meta">
                          <span className="tab-product-price">
                            {hasPrice
                              ? `${currency} ${amountStr}`
                              : 'Call for Price'}
                          </span>
                          <span
                            className={`tab-product-badge ${
                              isAvailable
                                ? 'tab-product-badge--in'
                                : 'tab-product-badge--out'
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

              <div className="tab-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="tab-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="tab-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
