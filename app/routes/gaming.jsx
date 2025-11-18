// app/routes/gaming.jsx
import React, {useState} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import gamingStyles from '~/styles/gaming.css?url';

const GAMING_MENU_HANDLE = 'gaming';

const GAMING_MENU_QUERY = `#graphql
  query GamingMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: gamingStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(GAMING_MENU_QUERY, {
    variables: {handle: GAMING_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Gaming menu not found', {status: 404});
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

export default function GamingCategoryPage() {
  const {menuTitle, collections} = useLoaderData();
  const [rgbActive, setRgbActive] = useState(false);

  const handleLogoClick = () => {
    // ON / OFF toggle instead of one-shot animation
    setRgbActive((prev) => !prev);
  };

  return (
    <div className="gaming-page">
      {/* HERO */}
      <section className="gaming-hero">
        <div className="gaming-hero-inner">
          <div className="gaming-hero-copy">
            <p className="gaming-eyebrow">Category hub</p>
            <h1 className="gaming-title">{menuTitle || 'Gaming'}</h1>
            <p className="gaming-subtitle">
              Build your setup with gaming laptops, desktops, monitors,
              peripherals and more – tuned for performance at 961Souq.
            </p>
          </div>

          <div
            className={`gaming-hero-orbit ${
              rgbActive ? 'gaming-hero-orbit--rgb' : ''
            }`}
          >
            <div className="gaming-orbit-circle gaming-orbit-circle--outer" />
            <div className="gaming-orbit-circle gaming-orbit-circle--inner" />

            <div
              className={`gaming-logo-pill ${
                rgbActive ? 'gaming-logo-pill--rgb' : ''
              }`}
              onClick={handleLogoClick}
              role="button"
              aria-label="Toggle gaming RGB ring"
            >
              <span className="gaming-logo-pill-icon">
                {/* Simple gamepad icon */}
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M7.5 9.5h-1a.5.5 0 0 0-.5.5v1H5a.5.5 0 0 0-.5.5v1c0 .276.224.5.5.5h1v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1v-1a.5.5 0 0 0-.5-.5z"
                    fill="#e5e7eb"
                  />
                  <circle cx="15.5" cy="11" r="0.9" fill="#22c55e" />
                  <circle cx="17.5" cy="13" r="0.9" fill="#3b82f6" />
                  <circle cx="17.5" cy="9" r="0.9" fill="#f97316" />
                  <circle cx="19.2" cy="11" r="0.9" fill="#ef4444" />
                  <path
                    d="M8.25 6.5h7.5c1.95 0 2.9.0 3.61.52.7.5 1.12 1.28 1.29 2.39l.53 3.42c.22 1.41-.63 2.74-1.98 3.13a2.75 2.75 0 0 1-2.8-.76l-.86-.93H9.46l-.86.93a2.75 2.75 0 0 1-2.8.76c-1.35-.39-2.2-1.72-1.98-3.13l.53-3.42c.17-1.11.6-1.89 1.29-2.39.71-.52 1.66-.52 3.61-.52z"
                    fill="#020617"
                    stroke="#4b5563"
                    strokeWidth="1"
                  />
                </svg>
              </span>
              <span className="gaming-logo-pill-label">
                {rgbActive ? 'Gaming mode: ON' : 'Gaming mode: OFF'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="gaming-collections">
        <header className="gaming-collections-header">
          <h2>Shop gaming collections</h2>
          <p>
            Explore curated groups of gaming gear – from high-refresh monitors
            to RGB-ready accessories.
          </p>
        </header>

        <div className="gaming-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="gaming-collection-card"
              prefetch="intent"
            >
              <div className="gaming-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="gaming-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="gaming-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="gaming-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="gaming-collection-cta">Enter</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="gaming-empty-state">
              No Gaming collections are linked to the “gaming” menu yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
