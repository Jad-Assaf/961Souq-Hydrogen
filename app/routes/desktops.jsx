// app/routes/desktops.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import desktopsStyles from '~/styles/desktops.css?url';

const DESKTOPS_MENU_HANDLE = 'desktops'; // adjust if your menu handle is different

const DESKTOPS_MENU_QUERY = `#graphql
  query DesktopsMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: desktopsStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(DESKTOPS_MENU_QUERY, {
    variables: {handle: DESKTOPS_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Desktops menu not found', {status: 404});
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

export default function DesktopsCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  return (
    <div className="d-page">
      {/* HERO */}
      <section className="d-hero">
        <div className="d-hero-inner">
          <div className="d-hero-copy">
            <p className="d-eyebrow">Category hub</p>
            <h1 className="d-title">{menuTitle || 'Desktops'}</h1>
            <p className="d-subtitle">
              Tower rigs for everything from spreadsheets to esports. Browse
              both business workstations and RGB-ready gaming builds in one
              place.
            </p>

            <div className="d-pill-row">
              <span className="d-pill d-pill--business">Business desktops</span>
              <span className="d-pill d-pill--gaming">Gaming towers</span>
              <span className="d-pill">All-in-one PCs</span>
            </div>

            <div className="d-meta-row">
              <div className="d-meta-item">
                <span className="d-meta-label">Use cases</span>
                <span className="d-meta-value">Office • Creative • Gaming</span>
              </div>
              <div className="d-meta-item">
                <span className="d-meta-label">Form factors</span>
                <span className="d-meta-value">Mini • Mid • Full tower</span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – hybrid business + gaming desktop stack */}
          <div className="d-hero-visual">
            <div className="d-rig">
              {/* business tower */}
              <div className="d-rig-case d-rig-case--business">
                <div className="d-rig-case-top" />
                <div className="d-rig-case-inner">
                  <div className="d-rig-led-strip d-rig-led-strip--business" />
                  <div className="d-rig-ports" />
                </div>
                <div className="d-rig-foot d-rig-foot--left" />
                <div className="d-rig-foot d-rig-foot--right" />
              </div>

              {/* gaming tower */}
              <div className="d-rig-case d-rig-case--gaming">
                <div className="d-rig-case-top d-rig-case-top--gaming" />
                <div className="d-rig-case-inner d-rig-case-inner--gaming">
                  <div className="d-rig-fan-ring d-rig-fan-ring--top" />
                  <div className="d-rig-fan-ring d-rig-fan-ring--mid" />
                  <div className="d-rig-fan-ring d-rig-fan-ring--bottom" />
                </div>
                <div className="d-rig-foot d-rig-foot--left" />
                <div className="d-rig-foot d-rig-foot--right" />
              </div>

              <div className="d-rig-shadow" />

              {/* vertical performance bars */}
              <div className="d-rig-bars">
                <span className="d-rig-bar d-rig-bar--short" />
                <span className="d-rig-bar d-rig-bar--mid" />
                <span className="d-rig-bar d-rig-bar--tall" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="d-collections">
        <header className="d-collections-header">
          <h2>Shop desktop collections</h2>
          <p>
            Pick from curated groups of gaming towers, business workstations,
            and creator builds.
          </p>
        </header>

        <div className="d-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="d-collection-card"
              prefetch="intent"
            >
              <div className="d-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="d-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="d-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="d-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="d-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="d-empty-state">
              No Desktop collections are linked to the “desktops” menu yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
