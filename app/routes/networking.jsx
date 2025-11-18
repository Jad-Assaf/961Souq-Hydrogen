// app/routes/networking.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import networkingStyles from '~/styles/networking.css?url';

const NETWORKING_MENU_HANDLE = 'networking'; // adjust if your menu handle is different

const NETWORKING_MENU_QUERY = `#graphql
  query NetworkingMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: networkingStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(NETWORKING_MENU_QUERY, {
    variables: {handle: NETWORKING_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Networking menu not found', {status: 404});
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

export default function NetworkingCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  return (
    <div className="nw-page">
      {/* HERO */}
      <section className="nw-hero">
        <div className="nw-hero-inner">
          <div className="nw-hero-copy">
            <p className="nw-eyebrow">Category hub</p>
            <h1 className="nw-title">{menuTitle || 'Networking'}</h1>
            <p className="nw-subtitle">
              Routers, mesh Wi-Fi, access points, and switches to keep every
              room, floor, and device online with stable, fast coverage.
            </p>

            <div className="nw-pill-row">
              <span className="nw-pill">Wi-Fi 7</span>
              <span className="nw-pill">Mesh systems</span>
              <span className="nw-pill">Gigabit wired</span>
            </div>

            <div className="nw-meta-row">
              <div className="nw-meta-item">
                <span className="nw-meta-label">Ideal for</span>
                <span className="nw-meta-value">Home • Office • Gaming</span>
              </div>
              <div className="nw-meta-item">
                <span className="nw-meta-label">Coverage</span>
                <span className="nw-meta-value">1–6 rooms • multi-floor</span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – coverage rings + hotspots */}
          <div className="nw-hero-visual">
            <div className="nw-map">
              <div className="nw-map-grid" />

              {/* coverage rings */}
              <div className="nw-ring nw-ring--outer" />
              <div className="nw-ring nw-ring--middle" />
              <div className="nw-ring nw-ring--inner" />

              {/* central router */}
              <div className="nw-router-pill">
                <div className="nw-router-icon">
                  <span className="nw-router-bar" />
                  <span className="nw-router-wave nw-router-wave--two" />
                </div>
                <span className="nw-router-label">Main router</span>
              </div>

              {/* small hotspot chips */}
              <div className="nw-chip nw-chip--mesh">
                <span className="nw-chip-label">Mesh node</span>
              </div>
              <div className="nw-chip nw-chip--office">
                <span className="nw-chip-label">Office</span>
              </div>
              <div className="nw-chip nw-chip--living">
                <span className="nw-chip-label">Living room</span>
              </div>

              {/* blue signal dots */}
              <span className="nw-node nw-node--one" />
              <span className="nw-node nw-node--two" />
              <span className="nw-node nw-node--three" />
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="nw-collections">
        <header className="nw-collections-header">
          <h2>Shop networking collections</h2>
          <p>
            Grouped by use case and spec – from compact home routers to full
            mesh kits and pro switches.
          </p>
        </header>

        <div className="nw-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="nw-collection-card"
              prefetch="intent"
            >
              <div className="nw-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="nw-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="nw-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="nw-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="nw-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="nw-empty-state">
              No Networking collections are linked to the “networking” menu yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
