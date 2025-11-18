// app/routes/apple.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import appleStyles from '~/styles/apple.css?url';

const APPLE_MENU_HANDLE = 'apple';

const APPLE_MENU_QUERY = `#graphql
  query AppleMenuCollections($handle: String!) {
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

export const links = () => [{rel: 'stylesheet', href: appleStyles}];

export async function loader({context}) {
  const {storefront} = context;

  const {menu} = await storefront.query(APPLE_MENU_QUERY, {
    variables: {handle: APPLE_MENU_HANDLE},
  });

  if (!menu) {
    throw new Response('Apple menu not found', {status: 404});
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

export default function AppleCategoryPage() {
  const {menuTitle, collections} = useLoaderData();

  return (
    <div className="apple-page">
      {/* HERO */}
      <section className="apple-hero">
        <div className="apple-hero-inner">
          <div className="apple-hero-copy">
            <p className="apple-eyebrow">Category hub</p>
            <h1 className="apple-title">{menuTitle || 'Apple'}</h1>
            <p className="apple-subtitle">
              All your Apple gear in one place – Mac, iPhone, iPad, Watch and
              accessories, curated from 961Souq.
            </p>
          </div>

          <div className="apple-hero-orbit">
            <div className="orbit-circle orbit-circle--outer" />
            <div className="orbit-circle orbit-circle--inner" />
            <div className="apple-logo-pill">
              <span> Apple</span>
            </div>
          </div>
        </div>
      </section>

      {/* COLLECTION GRID */}
      <section className="apple-collections">
        <header className="apple-collections-header">
          <h2>Shop by collection</h2>
          <p>Pick a collection to dive into Macs, iPhones, iPads, and more.</p>
        </header>

        <div className="apple-collections-grid">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.handle}`}
              className="apple-collection-card"
              prefetch="intent"
            >
              <div className="apple-collection-media">
                {collection.image ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    loading="lazy"
                  />
                ) : (
                  <div className="apple-collection-placeholder">
                    <span>{collection.title?.charAt(0) || '?'}</span>
                  </div>
                )}
              </div>

              <div className="apple-collection-body">
                <h3>{collection.title}</h3>
                {collection.description && (
                  <p className="apple-collection-description">
                    {collection.description}
                  </p>
                )}
                <span className="apple-collection-cta">Browse</span>
              </div>
            </Link>
          ))}

          {collections.length === 0 && (
            <p className="apple-empty-state">
              No Apple collections are linked to the “apple” menu yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
