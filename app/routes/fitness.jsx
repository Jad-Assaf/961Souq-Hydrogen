// app/routes/fitness.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import fitnessStyles from '~/styles/fitness.css?url';

const FITNESS_MENU_HANDLE = 'fitness'; // adjust if your menu handle is different

const FITNESS_MENU_QUERY = `#graphql
  query FitnessMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: fitnessStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(FITNESS_MENU_QUERY, {
    variables: {handle: FITNESS_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Fitness menu not found', {status: 404});
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

export default function FitnessCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  return (
    <div className="fit-page">
      {/* HERO */}
      <section className="fit-hero">
        <div className="fit-hero-inner">
          <div className="fit-hero-copy">
            <p className="fit-eyebrow">Category hub</p>
            <h1 className="fit-title">{menuTitle || 'Fitness'}</h1>
            <p className="fit-subtitle">
              Track workouts, recovery, and daily movement with watches, bands,
              rings and smart equipment – built to keep you moving.
            </p>

            <div className="fit-pill-row">
              <span className="fit-pill">Fitness watches</span>
              <span className="fit-pill">Bands &amp; rings</span>
              <span className="fit-pill">Home equipment</span>
            </div>

            <div className="fit-meta-row">
              <div className="fit-meta-item">
                <span className="fit-meta-label">Focus</span>
                <span className="fit-meta-value">
                  Activity • Recovery • Sleep
                </span>
              </div>
              <div className="fit-meta-item">
                <span className="fit-meta-label">Includes</span>
                <span className="fit-meta-value">
                  Fitness watches, bands, rings &amp; equipment
                </span>
              </div>
            </div>
          </div>

          {/* NEW HERO VISUAL – stacked fitness dashboard card */}
          <div className="fit-hero-visual">
            <div className="fit-hero-dashboard-shell">
              {/* main card */}
              <div className="fit-hero-dashboard-card">
                <div className="fit-dashboard-header">
                  <div className="fit-dashboard-header-left">
                    <span className="fit-dashboard-day">Today</span>
                    <span className="fit-dashboard-date">
                      Activity overview
                    </span>
                  </div>
                  <span className="fit-dashboard-badge">Live</span>
                </div>

                <div className="fit-dashboard-kpis">
                  <div className="fit-dashboard-kpi">
                    <span className="fit-dashboard-kpi-label">Steps</span>
                    <span className="fit-dashboard-kpi-value">12,430</span>
                    <span className="fit-dashboard-kpi-sub">Goal 10,000</span>
                  </div>
                  <div className="fit-dashboard-kpi">
                    <span className="fit-dashboard-kpi-label">Calories</span>
                    <span className="fit-dashboard-kpi-value">645 kcal</span>
                    <span className="fit-dashboard-kpi-sub">Move ring</span>
                  </div>
                  <div className="fit-dashboard-kpi">
                    <span className="fit-dashboard-kpi-label">Recovery</span>
                    <span className="fit-dashboard-kpi-value">Balanced</span>
                    <span className="fit-dashboard-kpi-sub">
                      HRV • Resting HR
                    </span>
                  </div>
                </div>

                {/* progress rows */}
                <div className="fit-progress-row">
                  <div className="fit-progress-labels">
                    <span className="fit-progress-label-main">Move</span>
                    <span className="fit-progress-label-sub">
                      540 / 650 kcal
                    </span>
                  </div>
                  <div className="fit-progress-track">
                    <div className="fit-progress-fill fit-progress-fill--move" />
                  </div>
                </div>

                <div className="fit-progress-row">
                  <div className="fit-progress-labels">
                    <span className="fit-progress-label-main">Exercise</span>
                    <span className="fit-progress-label-sub">32 / 45 min</span>
                  </div>
                  <div className="fit-progress-track">
                    <div className="fit-progress-fill fit-progress-fill--exercise" />
                  </div>
                </div>

                <div className="fit-progress-row">
                  <div className="fit-progress-labels">
                    <span className="fit-progress-label-main">Stand</span>
                    <span className="fit-progress-label-sub">9 / 12 hrs</span>
                  </div>
                  <div className="fit-progress-track">
                    <div className="fit-progress-fill fit-progress-fill--stand" />
                  </div>
                </div>

                <div className="fit-device-row">
                  <span className="fit-device-pill">Watch</span>
                  <span className="fit-device-pill">Band</span>
                  <span className="fit-device-pill">Ring</span>
                </div>
              </div>

              {/* subtle stacked cards behind */}
              <div className="fit-hero-dashboard-shadow fit-hero-dashboard-shadow--one" />
              <div className="fit-hero-dashboard-shadow fit-hero-dashboard-shadow--two" />
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="fit-collections">
        <header className="fit-collections-header">
          <h2>Shop fitness collections</h2>
          <p>
            Fitness watches, bands, rings, equipment and more – grouped by
            brand, goal and training style.
          </p>
        </header>

        <div className="fit-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="fit-collection-card"
              prefetch="intent"
            >
              <div className="fit-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="fit-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="fit-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="fit-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="fit-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="fit-empty-state">
              No Fitness collections are linked to the “fitness” menu yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
