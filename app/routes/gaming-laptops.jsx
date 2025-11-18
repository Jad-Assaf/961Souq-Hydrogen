// app/routes/gaming-laptops.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import gamingLaptopsStyles from '~/styles/gaming-laptops.css?url';

const GAMING_LAPTOPS_MENU_HANDLE = 'gaming-laptops'; // adjust if your menu handle is different

const GAMING_LAPTOPS_MENU_QUERY = `#graphql
  query GamingLaptopsMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: gamingLaptopsStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(GAMING_LAPTOPS_MENU_QUERY, {
    variables: {handle: GAMING_LAPTOPS_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Gaming Laptops menu not found', {status: 404});
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

export default function GamingLaptopsCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  return (
    <div className="gl-page">
      {/* HERO */}
      <section className="gl-hero">
        <div className="gl-hero-inner">
          <div className="gl-hero-copy">
            <p className="gl-eyebrow">Rig hub</p>
            <h1 className="gl-title">{menuTitle || 'Gaming Laptops'}</h1>
            <p className="gl-subtitle">
              High-refresh, RTX-packed gaming laptops tuned for performance.
              Pick a collection to match your FPS, thermals, and budget.
            </p>

            <div className="gl-spec-chips">
              <span className="gl-chip">144Hz+</span>
              <span className="gl-chip">RTX / Radeon</span>
              <span className="gl-chip">RGB keyboard</span>
            </div>
          </div>

          <div className="gl-hero-laptop">
            <div className="gl-hero-laptop-screen">
              <div className="gl-hero-laptop-video-slot">
                <iframe
                  className="gl-hero-laptop-video"
                  src="https://www.youtube.com/embed/kB4X3kHNaSo?si=fTMphzrzNBCNkBli&autoplay=1&mute=1&loop=1&controls=0&playsinline=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&playlist=kB4X3kHNaSo&vq=small"
                  title="Gaming Laptops showcase"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen={false}
                />
              </div>
            </div>
            <div className="gl-hero-laptop-base" />
            <div className="gl-hero-laptop-glow" />
          </div>
        </div>
      </section>

      {/* COLLECTION GRID – single layout, no featured split */}
      <section className="gl-collections">
        <header className="gl-section-header gl-section-header--compact">
          <h2>Shop gaming laptop collections</h2>
          <p>
            Explore curated gaming laptop groups by brand, GPU tier, and more.
          </p>
        </header>

        <div className="gl-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="gl-collection-card"
              prefetch="intent"
            >
              <div className="gl-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="gl-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>
              <div className="gl-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="gl-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="gl-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="gl-empty-state">
              No Gaming Laptop collections are linked to the “gaming-laptops”
              menu yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
