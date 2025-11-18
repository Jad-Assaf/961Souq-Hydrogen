// app/routes/accessories.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import accessoriesStyles from '~/styles/accessories.css?url';

const ACCESSORIES_MENU_HANDLE = 'accessories'; // adjust if your menu handle is different

const ACCESSORIES_MENU_QUERY = `#graphql
  query AccessoriesMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: accessoriesStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(ACCESSORIES_MENU_QUERY, {
    variables: {handle: ACCESSORIES_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Accessories menu not found', {status: 404});
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

export default function AccessoriesCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  return (
    <div className="acc-page">
      {/* HERO */}
      <section className="acc-hero">
        <div className="acc-hero-inner">
          <div className="acc-hero-copy">
            <p className="acc-eyebrow">Category hub</p>
            <h1 className="acc-title">{menuTitle || 'Accessories'}</h1>
            <p className="acc-subtitle">
              From desk setups to car mounts, travel bags, scooters, printers,
              projectors, smart devices and more — all the extras that complete
              your tech life.
            </p>

            <div className="acc-pill-row">
              <span className="acc-pill">Desk &amp; computer</span>
              <span className="acc-pill">On the go</span>
              <span className="acc-pill">Home &amp; office</span>
            </div>

            <div className="acc-meta-row">
              <div className="acc-meta-item">
                <span className="acc-meta-label">Highlights</span>
                <span className="acc-meta-value">
                  Computer accessories • Smart devices • Software
                </span>
              </div>
              <div className="acc-meta-item">
                <span className="acc-meta-label">Also includes</span>
                <span className="acc-meta-value">
                  Car accessories • Bags • Scooters • Projectors
                </span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – layered tiles for desk / travel / home */}
          <div className="acc-hero-visual">
            <div className="acc-hero-board">
              {/* background halo */}
              <div className="acc-board-glow" />

              {/* top label strip */}
              <div className="acc-board-header">
                <span className="acc-board-dot acc-board-dot--green" />
                <span className="acc-board-dot acc-board-dot--amber" />
                <span className="acc-board-dot acc-board-dot--red" />
                <span className="acc-board-title">Accessory presets</span>
              </div>

              {/* stacked tiles */}
              <div className="acc-tile acc-tile--desk">
                <div className="acc-tile-tag">Desk setup</div>
                <p className="acc-tile-title">Computer accessories</p>
                <p className="acc-tile-text">
                  Keyboards, mice, hubs, stands and more for clean workspaces.
                </p>
              </div>

              <div className="acc-tile acc-tile--travel">
                <div className="acc-tile-tag acc-tile-tag--blue">On the go</div>
                <p className="acc-tile-title">Backpacks &amp; car mounts</p>
                <p className="acc-tile-text">
                  Travel bags, chargers and mounts for daily commuting.
                </p>
              </div>

              <div className="acc-tile acc-tile--home">
                <div className="acc-tile-tag acc-tile-tag--amber">Home</div>
                <p className="acc-tile-title">Smart home &amp; appliances</p>
                <p className="acc-tile-text">
                  Smart devices, printers, projectors and home appliances.
                </p>
              </div>

              {/* small connector chips at the side */}
              <div className="acc-chip-column">
                <div className="acc-chip">Smart devices</div>
                <div className="acc-chip">Printers</div>
                <div className="acc-chip">Projectors &amp; screens</div>
                <div className="acc-chip">Software</div>
              </div>

              {/* connector lines */}
              <div className="acc-connector acc-connector--top" />
              <div className="acc-connector acc-connector--middle" />
              <div className="acc-connector acc-connector--bottom" />
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="acc-collections">
        <header className="acc-collections-header">
          <h2>Shop accessories collections</h2>
          <p>
            Browse by type: computer accessories, car accessories, backpacks and
            bags, home appliances, printers, scooters, projectors &amp; screens,
            smart devices and software.
          </p>
        </header>

        <div className="acc-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="acc-collection-card"
              prefetch="intent"
            >
              <div className="acc-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="acc-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="acc-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="acc-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="acc-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="acc-empty-state">
              No Accessories collections are linked to the “accessories” menu
              yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
