// app/routes/tablets.jsx
import React from 'react';
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
              className="tab-collection-card"
              prefetch="intent"
            >
              <div className="tab-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
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
    </div>
  );
}
