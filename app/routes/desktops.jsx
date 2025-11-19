// app/routes/desktops.jsx
import React, {useState, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import desktopsStyles from '~/styles/desktops.css?url';

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

  const activeProductsRaw = activeCollection?.products?.nodes || [];

  const activeProducts = activeProductsRaw.filter((product) => {
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

      {/* COLLECTION GRID */}
      <section className="d-collections">
        <header className="d-collections-header">
          <h2>Shop desktop collections</h2>
          <p>
            Pick from curated groups of gaming towers, business workstations,
            and creator builds.
          </p>
        </header>

        <div className="d-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className={`d-collection-card ${
                collection.handle === activeCollection?.handle
                  ? 'd-collection-card--active'
                  : ''
              }`}
              prefetch="intent"
              onClick={(e) => {
                e.preventDefault();
                handleCollectionClick(collection.handle);
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
          ))}

          {collections.length === 0 && (
            <p className="d-empty-state">
              No Desktop collections are linked to the “desktops” menu yet.
            </p>
          )}
        </div>
      </section>

      {/* PRODUCTS SECTION */}
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

          {activeProducts.length > 0 ? (
            <>
              <div className="d-products-grid">
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
                              ${minPrice}
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
