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
              <span>
                <svg
                  width="24px"
                  height="24px"
                  viewBox="-1.5 0 20 20"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <title>apple [#173]</title>
                    <desc>Created with Sketch.</desc> <defs> </defs>
                    <g
                      id="Page-1"
                      stroke="none"
                      strokeWidth="1"
                      fill="none"
                      fillRule="evenodd"
                    >
                      <g
                        id="Dribbble-Light-Preview"
                        transform="translate(-102.000000, -7439.000000)"
                        fill="#000000"
                      >
                        <g
                          id="icons"
                          transform="translate(56.000000, 160.000000)"
                        >
                          <path
                            d="M57.5708873,7282.19296 C58.2999598,7281.34797 58.7914012,7280.17098 58.6569121,7279 C57.6062792,7279.04 56.3352055,7279.67099 55.5818643,7280.51498 C54.905374,7281.26397 54.3148354,7282.46095 54.4735932,7283.60894 C55.6455696,7283.69593 56.8418148,7283.03894 57.5708873,7282.19296 M60.1989864,7289.62485 C60.2283111,7292.65181 62.9696641,7293.65879 63,7293.67179 C62.9777537,7293.74279 62.562152,7295.10677 61.5560117,7296.51675 C60.6853718,7297.73474 59.7823735,7298.94772 58.3596204,7298.97372 C56.9621472,7298.99872 56.5121648,7298.17973 54.9134635,7298.17973 C53.3157735,7298.17973 52.8162425,7298.94772 51.4935978,7298.99872 C50.1203933,7299.04772 49.0738052,7297.68074 48.197098,7296.46676 C46.4032359,7293.98379 45.0330649,7289.44985 46.8734421,7286.3899 C47.7875635,7284.87092 49.4206455,7283.90793 51.1942837,7283.88393 C52.5422083,7283.85893 53.8153044,7284.75292 54.6394294,7284.75292 C55.4635543,7284.75292 57.0106846,7283.67793 58.6366882,7283.83593 C59.3172232,7283.86293 61.2283842,7284.09893 62.4549652,7285.8199 C62.355868,7285.8789 60.1747177,7287.09489 60.1989864,7289.62485"
                            id="apple-[#173]"
                          >
                          </path>
                        </g>
                      </g>
                    </g>
                  </g>
                </svg>
              </span>
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
