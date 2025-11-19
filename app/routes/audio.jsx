// app/routes/audio.jsx
import React, {useState, useRef} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import audioStyles from '~/styles/audio.css?url';

const AUDIO_MENU_HANDLE = 'audio'; // adjust if your menu handle is different

const AUDIO_MENU_QUERY = `#graphql
  query AudioMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: audioStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(AUDIO_MENU_QUERY, {
    variables: {handle: AUDIO_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Audio menu not found', {status: 404});
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

export default function AudioCategoryPage() {
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
    <div className="au-page">
      {/* HERO */}
      <section className="au-hero">
        <div className="au-hero-inner">
          <div className="au-hero-copy">
            <p className="au-eyebrow">Category hub</p>
            <h1 className="au-title">{menuTitle || 'Audio Devices'}</h1>
            <p className="au-subtitle">
              Earbuds, headphones, speakers, microphones and DJ gear for music,
              gaming, streaming and production – tuned for clear sound at home
              or on stage.
            </p>

            <div className="au-pill-row">
              <span className="au-pill">Earbuds &amp; headphones</span>
              <span className="au-pill">Speakers &amp; surround</span>
              <span className="au-pill">Studio &amp; DJ</span>
            </div>

            <div className="au-meta-row">
              <div className="au-meta-item">
                <span className="au-meta-label">Brands</span>
                <span className="au-meta-value">Rode • Pioneer • more</span>
              </div>
              <div className="au-meta-item">
                <span className="au-meta-label">Use cases</span>
                <span className="au-meta-value">
                  Music • Streaming • Production
                </span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – console + speakers + animated faders */}
          <div className="au-hero-visual">
            <div className="au-hero-stage">
              {/* background glow shapes */}
              <div className="au-glow au-glow--left" />
              <div className="au-glow au-glow--right" />

              {/* outer / inner sound rings */}
              <div className="au-ring au-ring--outer" />
              <div className="au-ring au-ring--inner" />

              {/* central console */}
              <div className="au-console">
                <div className="au-console-header">
                  <span className="au-console-led au-console-led--red" />
                  <span className="au-console-led au-console-led--yellow" />
                  <span className="au-console-led au-console-led--green" />
                  <span className="au-console-label">Live mix bus</span>
                </div>

                <div className="au-console-meters">
                  <div className="au-meter">
                    <div className="au-meter-bar au-meter-bar--1" />
                  </div>
                  <div className="au-meter">
                    <div className="au-meter-bar au-meter-bar--2" />
                  </div>
                  <div className="au-meter">
                    <div className="au-meter-bar au-meter-bar--3" />
                  </div>
                  <div className="au-meter">
                    <div className="au-meter-bar au-meter-bar--4" />
                  </div>
                </div>

                <div className="au-console-faders">
                  <div className="au-fader">
                    <div className="au-fader-track" />
                    <div className="au-fader-knob au-fader-knob--1" />
                  </div>
                  <div className="au-fader">
                    <div className="au-fader-track" />
                    <div className="au-fader-knob au-fader-knob--2" />
                  </div>
                  <div className="au-fader">
                    <div className="au-fader-track" />
                    <div className="au-fader-knob au-fader-knob--3" />
                  </div>
                  <div className="au-fader">
                    <div className="au-fader-track" />
                    <div className="au-fader-knob au-fader-knob--4" />
                  </div>
                </div>
              </div>

              {/* side speakers */}
              <div className="au-speaker au-speaker--left">
                <div className="au-speaker-ring" />
                <div className="au-speaker-cone" />
              </div>
              <div className="au-speaker au-speaker--right">
                <div className="au-speaker-ring" />
                <div className="au-speaker-cone" />
              </div>

              {/* subtle waveform lines */}
              <div className="au-wave au-wave--top" />
              <div className="au-wave au-wave--bottom" />
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="au-collections">
        <header className="au-collections-header">
          <h2>Shop audio collections</h2>
          <p>
            Move between earbuds, headphones, speakers, surround systems,
            microphones, Rode and Pioneer gear, DJ equipment and more.
          </p>
        </header>

        <div className="au-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className={`au-collection-card ${
                collection.handle === activeCollection?.handle
                  ? 'au-collection-card--active'
                  : ''
              }`}
              prefetch="intent"
              onClick={(e) => {
                e.preventDefault();
                handleCollectionClick(collection.handle);
              }}
            >
              <div className="au-collection-media">
                {collection.image ? (
                  <img
                    src={`${collection.image.url}&width=300`}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="au-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="au-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="au-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="au-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="au-empty-state">
              No Audio collections are linked to the “audio” menu yet.
            </p>
          )}
        </div>
      </section>

      {/* PRODUCTS SECTION */}
      {activeCollection && (
        <section
          className="au-products"
          id="au-products"
          ref={productsSectionRef}
        >
          <header className="au-products-header">
            <div className="au-products-header-top">
              <h2>Products in {activeCollection.title}</h2>
              <span className="au-products-pill">
                Showing up to 50 products
              </span>
            </div>
          </header>

          {activeProducts.length > 0 ? (
            <>
              <div className="au-products-grid">
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
                      className="au-product-card"
                      prefetch="intent"
                    >
                      <div className="au-product-media">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.featuredImage?.altText || product.title
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="au-product-placeholder">
                            <span>{product.title?.charAt(0) || '?'}</span>
                          </div>
                        )}
                      </div>

                      <div className="au-product-body">
                        <h3 className="au-product-title">{product.title}</h3>
                        <div className="au-product-meta">
                          <span className="au-product-price">
                            {hasPrice
                              ? `$${amountStr}`
                              : 'Call for Price'}
                          </span>
                          <span
                            className={`au-product-badge ${
                              isAvailable
                                ? 'au-product-badge--in'
                                : 'au-product-badge--out'
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

              <div className="au-products-footer">
                <Link
                  to={`/collections/${activeCollection.handle}`}
                  className="au-products-view-all"
                  prefetch="intent"
                >
                  View all products in {activeCollection.title}
                </Link>
              </div>
            </>
          ) : (
            <p className="au-products-empty">
              No products found in this collection yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
