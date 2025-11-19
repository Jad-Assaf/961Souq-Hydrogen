// app/routes/home-appliances.jsx
import React, {useState, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import homeAppliancesStyles from '~/styles/home-appliances.css?url';

const HOME_APPLIANCES_MENU_HANDLE = 'home-appliances'; // adjust if your menu handle is different

const HOME_APPLIANCES_MENU_QUERY = `#graphql
  query HomeAppliancesMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: homeAppliancesStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(HOME_APPLIANCES_MENU_QUERY, {
    variables: {handle: HOME_APPLIANCES_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Home Appliances menu not found', {status: 404});
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

export default function HomeAppliancesCategoryPage() {
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
    <div className="ha-page">
      {/* HERO */}
      <section className="ha-hero">
        <div className="ha-hero-inner">
          <div className="ha-hero-copy">
            <p className="ha-eyebrow">Category hub</p>
            <h1 className="ha-title">{menuTitle || 'Home Appliances'}</h1>
            <p className="ha-subtitle">
              Cleaning devices, kitchen helpers, lighting and smart plugs –
              everything you need to keep your space comfy and easy to run.
            </p>

            <div className="ha-pill-row">
              <span className="ha-pill">Cleaning devices</span>
              <span className="ha-pill">Kitchen appliances</span>
              <span className="ha-pill">Smart &amp; lighting</span>
            </div>

            <div className="ha-meta-row">
              <div className="ha-meta-item">
                <span className="ha-meta-label">Best for</span>
                <span className="ha-meta-value">Homes • Offices • Studios</span>
              </div>
              <div className="ha-meta-item">
                <span className="ha-meta-label">Includes</span>
                <span className="ha-meta-value">
                  Cleaning, kitchen, lighting, smart sockets &amp; more
                </span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – warm “room” with floating blocks */}
          <div className="ha-hero-visual">
            <div className="ha-scene">
              <div className="ha-scene-arch" />
              <div className="ha-scene-shelf" />
              <div className="ha-scene-floor" />

              {/* Cleaning block */}
              <div className="ha-scene-card ha-scene-card--cleaning">
                <p className="ha-scene-card-label">Cleaning</p>
                <p className="ha-scene-card-text">
                  Robot vacuums, cordless sticks and steam cleaners.
                </p>
              </div>

              {/* Kitchen block */}
              <div className="ha-scene-card ha-scene-card--kitchen">
                <p className="ha-scene-card-label">Kitchen</p>
                <p className="ha-scene-card-text">
                  Air fryers, coffee machines and daily-use essentials.
                </p>
              </div>

              {/* Smart & lighting block */}
              <div className="ha-scene-card ha-scene-card--smart">
                <p className="ha-scene-card-label">Smart &amp; lighting</p>
                <p className="ha-scene-card-text">
                  Smart plugs, strips and mood lighting for every room.
                </p>
              </div>

              {/* Hanging lamp */}
              <div className="ha-lamp">
                <div className="ha-lamp-stem" />
                <div className="ha-lamp-head" />
                <div className="ha-lamp-glow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="ha-collections">
        <header className="ha-collections-header">
          <h2>Shop home appliance collections</h2>
          <p>
            Browse grouped collections for cleaning devices, kitchen appliances,
            lighting, smart devices, power sockets and more.
          </p>
        </header>

        <div className="ha-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className={`ha-collection-card ${
                collection.handle === activeCollection?.handle
                  ? 'ha-collection-card--active'
                  : ''
              }`}
              prefetch="intent"
              onClick={(e) => {
                e.preventDefault();
                handleCollectionClick(collection.handle);
              }}
            >
              <div className="ha-collection-media">
                {collection.image ? (
                  <img
                    src={`${collection.image.url}&width=300`}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="ha-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="ha-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="ha-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="ha-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="ha-empty-state">
              No Home Appliance collections are linked to the “home-appliances”
              menu yet.
            </p>
          )}
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      {activeCollection && (
        <section
          className="ha-products"
          id="ha-products"
          ref={productsSectionRef}
        >
          <header className="ha-products-header">
            <div className="ha-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="ha-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="ha-products-grid">
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
                      className="ha-product-card"
                      prefetch="intent"
                    >
                      <div className="ha-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="ha-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="ha-product-body">
                        <h3 className="ha-product-title">{product.title}</h3>
                        <div className="ha-product-meta">
                          <span className="ha-product-price">
                            {hasPrice
                              ? `${currency} ${amountStr}`
                              : 'Call for Price'}
                          </span>
                          <span
                            className={`ha-product-badge ${
                              isAvailable
                                ? 'ha-product-badge--in'
                                : 'ha-product-badge--out'
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

              <div className="ha-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="ha-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="ha-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
