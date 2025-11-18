// app/routes/pc-parts.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import pcPartsStyles from '~/styles/pc-parts.css?url';

const PC_PARTS_MENU_HANDLE = 'pc-parts'; // adjust if your menu handle is different

const PC_PARTS_MENU_QUERY = `#graphql
  query PcPartsMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: pcPartsStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(PC_PARTS_MENU_QUERY, {
    variables: {handle: PC_PARTS_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('PC Parts menu not found', {status: 404});
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

export default function PcPartsCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  return (
    <div className="pp-page">
      {/* HERO */}
      <section className="pp-hero">
        <div className="pp-hero-inner">
          <div className="pp-hero-copy">
            <p className="pp-eyebrow">Category hub</p>
            <h1 className="pp-title">{menuTitle || 'PC Parts'}</h1>
            <p className="pp-subtitle">
              CPUs, GPUs, motherboards, storage and more. Build or upgrade your
              rig with compatible, curated parts.
            </p>

            <div className="pp-pill-row">
              <span className="pp-pill">CPUs</span>
              <span className="pp-pill">GPUs</span>
              <span className="pp-pill">Motherboards</span>
              <span className="pp-pill">RAM &amp; storage</span>
            </div>

            <div className="pp-meta-row">
              <div className="pp-meta-item">
                <span className="pp-meta-label">Builder level</span>
                <span className="pp-meta-value">Entry • Mid • Enthusiast</span>
              </div>
              <div className="pp-meta-item">
                <span className="pp-meta-label">Platforms</span>
                <span className="pp-meta-value">Intel • AMD</span>
              </div>
            </div>
          </div>

          {/* HERO VISUAL – light PCB-style board with floating part tiles */}
          <div className="pp-hero-visual">
            <div className="pp-board">
              <div className="pp-board-grid" />

              {/* center socket */}
              <div className="pp-chip pp-chip--cpu">
                <span className="pp-chip-label">CPU</span>
              </div>

              {/* tiles around */}
              <div className="pp-chip pp-chip--gpu">
                <span className="pp-chip-label">GPU</span>
              </div>

              <div className="pp-chip pp-chip--mb">
                <span className="pp-chip-label">Motherboard</span>
              </div>

              <div className="pp-chip pp-chip--ram">
                <span className="pp-chip-label">RAM</span>
              </div>

              <div className="pp-chip pp-chip--storage">
                <span className="pp-chip-label">Storage</span>
              </div>

              {/* traces */}
              <span className="pp-trace pp-trace--one" />
              <span className="pp-trace pp-trace--two" />
              <span className="pp-trace pp-trace--three" />

              {/* subtle pulse nodes */}
              <span className="pp-node pp-node--one" />
              <span className="pp-node pp-node--two" />
              <span className="pp-node pp-node--three" />
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="pp-collections">
        <header className="pp-collections-header">
          <h2>Shop PC parts collections</h2>
          <p>
            Browse focused groups of components – by platform, tier, or part
            type – to match your build.
          </p>
        </header>

        <div className="pp-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="pp-collection-card"
              prefetch="intent"
            >
              <div className="pp-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="pp-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="pp-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="pp-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="pp-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="pp-empty-state">
              No PC Parts collections are linked to the “pc-parts” menu yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
