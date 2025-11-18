// app/routes/monitors.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import monitorsStyles from '~/styles/monitors.css?url';

const MONITORS_MENU_HANDLE = 'monitors'; // adjust if your menu handle is different

const MONITORS_MENU_QUERY = `#graphql
  query MonitorsMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: monitorsStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(MONITORS_MENU_QUERY, {
    variables: {handle: MONITORS_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Monitors menu not found', {status: 404});
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

export default function MonitorsCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  return (
    <div className="mon-page">
      {/* HERO */}
      <section className="mon-hero">
        <div className="mon-hero-inner">
          <div className="mon-hero-copy">
            <p className="mon-eyebrow">Category hub</p>
            <h1 className="mon-title">{menuTitle || 'Monitors'}</h1>
            <p className="mon-subtitle">
              Color-accurate business displays and high-refresh gaming panels –
              pick the right monitor for spreadsheets, edits, or esports.
            </p>

            <div className="mon-pill-row">
              <span className="mon-pill">USB-C docks</span>
              <span className="mon-pill">144Hz+</span>
              <span className="mon-pill">Ultra-wide</span>
            </div>

            <div className="mon-meta-row">
              <div className="mon-meta-item">
                <span className="mon-meta-label">Sizes</span>
                <span className="mon-meta-value">24″ • 27″ • 32″+</span>
              </div>
              <div className="mon-meta-item">
                <span className="mon-meta-label">Use cases</span>
                <span className="mon-meta-value">
                  Office • Creative • Gaming
                </span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – new darker control panel */}
          <div className="mon-hero-visual">
            <div className="mon-hero-panel">
              <div className="mon-hero-grid" />

              <div className="mon-hero-ring mon-hero-ring--outer" />
              <div className="mon-hero-ring mon-hero-ring--inner" />

              {/* Main work window */}
              <div className="mon-hero-window mon-hero-window--primary">
                <div className="mon-window-header">
                  <span className="mon-window-dot mon-window-dot--green" />
                  <span className="mon-window-dot mon-window-dot--amber" />
                  <span className="mon-window-dot mon-window-dot--red" />
                </div>
                <div className="mon-window-body">
                  <p className="mon-window-title">Team dashboards</p>
                  <p className="mon-window-text">
                    Keep spreadsheets, KPIs, and calls sharp on a single panel.
                  </p>
                </div>
              </div>

              {/* Gaming chip */}
              <div className="mon-hero-window mon-hero-window--gaming">
                <p className="mon-chip-label">Gaming mode</p>
                <p className="mon-chip-value">165Hz • 1ms • HDR</p>
              </div>

              {/* Creative chip */}
              <div className="mon-hero-window mon-hero-window--creative">
                <p className="mon-chip-label">Creative</p>
                <p className="mon-chip-value">sRGB • DCI-P3 • 4K</p>
              </div>

              <div className="mon-hero-glow" />
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="mon-collections">
        <header className="mon-collections-header">
          <h2>Shop monitor collections</h2>
          <p>
            Grouped for business workstations, creative workflows, and gaming
            setups so you can find the ideal panel quickly.
          </p>
        </header>

        <div className="mon-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="mon-collection-card"
              prefetch="intent"
            >
              <div className="mon-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="mon-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="mon-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="mon-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="mon-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="mon-empty-state">
              No Monitor collections are linked to the “monitors” menu yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
