// app/routes/business-laptops.jsx
import React, {useState, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import businessLaptopsStyles from '~/styles/business-laptops.css?url';

const BUSINESS_LAPTOPS_MENU_HANDLE = 'laptops'; // adjust if your menu handle is different

const BUSINESS_LAPTOPS_MENU_QUERY = `#graphql
  query BusinessLaptopsMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: businessLaptopsStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(BUSINESS_LAPTOPS_MENU_QUERY, {
    variables: {handle: BUSINESS_LAPTOPS_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Business Laptops menu not found', {status: 404});
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

export default function BusinessLaptopsCategoryPage() {
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
    <div className="bl-page">
      {/* HERO */}
      <section className="bl-hero">
        <div className="bl-hero-inner">
          <div className="bl-hero-copy">
            <p className="bl-eyebrow">Category hub</p>
            <h1 className="bl-title">{menuTitle || 'Business Laptops'}</h1>
            <p className="bl-subtitle">
              Reliable, lightweight business laptops for teams, freelancers, and
              executives. Pick a collection tuned for your workload and budget.
            </p>

            <div className="bl-pill-row">
              <span className="bl-pill">All-day battery</span>
              <span className="bl-pill">Slim &amp; portable</span>
              <span className="bl-pill">Pro support</span>
            </div>

            <div className="bl-meta-row">
              <div className="bl-meta-item">
                <span className="bl-meta-label">Screen size</span>
                <span className="bl-meta-value">12″ - 18″</span>
              </div>
              <div className="bl-meta-item">
                <span className="bl-meta-label">Ideal for</span>
                <span className="bl-meta-value">
                  Office • Hybrid • Study • Travel
                </span>
              </div>
            </div>
          </div>

          <div className="bl-hero-visual">
            {/* OUTER ORBIT – main card */}
            <div className="bl-hero-orbit bl-hero-orbit--outer">
              <div className="bl-hero-card bl-hero-card--primary">
                <div className="bl-hero-card-header">
                  <span className="bl-hero-dot bl-hero-dot--green" />
                  <span className="bl-hero-dot bl-hero-dot--amber" />
                  <span className="bl-hero-dot bl-hero-dot--red" />
                </div>
                <div className="bl-hero-card-body">
                  <p className="bl-hero-card-title">Team-ready setups</p>
                  <p className="bl-hero-card-text">
                    Configure consistent fleets for your sales, ops, and finance
                    teams with matching specs.
                  </p>
                </div>
              </div>
            </div>

            {/* INNER ORBIT – secondary chip card */}
            <div className="bl-hero-orbit bl-hero-orbit--inner">
              <div className="bl-hero-card bl-hero-card--secondary">
                <p className="bl-hero-chip-label">Recommended focus</p>
                <p className="bl-hero-chip-value">
                  Stability • Portability • Security
                </p>
              </div>
            </div>

            {/* Static circles behind everything */}
            <div className="bl-hero-circle bl-hero-circle--one" />
            <div className="bl-hero-circle bl-hero-circle--two" />
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="bl-collections">
        <header className="bl-collections-header">
          <h2>Shop business laptop collections</h2>
          <p>
            Browse by brand, size, and spec tiers to find the right fit for
            everyday work.
          </p>
        </header>

        <div className="bl-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className={`bl-collection-card ${
                collection.handle === activeCollection?.handle
                  ? 'bl-collection-card--active'
                  : ''
              }`}
              prefetch="intent"
              onClick={(e) => {
                e.preventDefault();
                handleCollectionClick(collection.handle);
              }}
            >
              <div className="bl-collection-media">
                {collection.image ? (
                  <img
                    src={`${collection.image.url}&width=300`}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="bl-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="bl-collection-body">
                <h3>{collection.title}</h3>
                <span className="bl-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="bl-empty-state">
              No Business Laptop collections are linked to the
              “business-laptops” menu yet.
            </p>
          )}
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      {activeCollection && (
        <section
          className="bl-products"
          id="bl-products"
          ref={productsSectionRef}
        >
          <header className="bl-products-header">
            <div className="bl-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="bl-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="bl-products-grid">
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
                      className="bl-product-card"
                      prefetch="intent"
                    >
                      <div className="bl-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="bl-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="bl-product-body">
                        <h3 className="bl-product-title">{product.title}</h3>
                        <div className="bl-product-meta">
                          {minPrice && (
                            <span className="bl-product-price">
                              {currency} {minPrice}
                            </span>
                          )}
                          <span
                            className={`bl-product-badge ${
                              isAvailable
                                ? 'bl-product-badge--in'
                                : 'bl-product-badge--out'
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

              <div className="bl-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="bl-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="bl-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
