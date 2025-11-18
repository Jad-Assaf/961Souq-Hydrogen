// app/routes/business-laptops.jsx
import React from 'react';
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
              className="bl-collection-card"
              prefetch="intent"
            >
              <div className="bl-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
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
                {collection.description && (
                  <p className="bl-collection-description">
                    {collection.description}
                  </p>
                )}
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
    </div>
  );
}
