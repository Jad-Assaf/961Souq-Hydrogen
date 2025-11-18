// app/routes/mobiles.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import mobilesStyles from '~/styles/mobiles.css?url';

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

      {/* COLLECTION GRID */}
      <section className="mob-collections">
        <header className="mob-collections-header">
          <h2>Shop mobile collections</h2>
          <p>
            Browse by brand, phone type, or accessory – from iPhone and Samsung
            to chargers, power banks, and gaming-focused models.
          </p>
        </header>

        <div className="mob-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="mob-collection-card"
              prefetch="intent"
            >
              <div className="mob-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
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
          ))}

          {collections.length === 0 && (
            <p className="mob-empty-state">
              No Mobile collections are linked to the “mobiles” menu yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
