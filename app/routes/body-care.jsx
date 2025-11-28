// app/routes/body-care.jsx
import React from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import bodyCareStyles from '~/styles/body-care.css?url';

const BODY_CARE_COLLECTION_HANDLE = 'health-beauty';
const BODY_CARE_MENU_HANDLE = 'health-beauty';

const BODY_CARE_SHELVES_QUERY = `#graphql
  query BodyCareShelves(
    $collectionHandle: String!
    $menuHandle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $collectionHandle) {
      id
      title
      products(first: 100) {
        nodes {
          id
          handle
          title
          availableForSale
          featuredImage {
            id
            url
            altText
            width
            height
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
    menu(handle: $menuHandle) {
      id
      title
      items {
        id
        title
        resource {
          __typename
          ... on Collection {
            id
            handle
            title
            image {
              url
              altText
            }
            products(first: 100) {
              nodes {
                id
                handle
                title
                availableForSale
                featuredImage {
                  id
                  url
                  altText
                  width
                  height
                }
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const links = () => [{rel: 'stylesheet', href: bodyCareStyles}];

export async function loader({context}) {
  const {storefront, localization} = context;

  const {collection, menu} = await storefront.query(BODY_CARE_SHELVES_QUERY, {
    variables: {
      collectionHandle: BODY_CARE_COLLECTION_HANDLE,
      menuHandle: BODY_CARE_MENU_HANDLE,
      country: localization?.country?.isoCode,
      language: localization?.language?.isoCode,
    },
  });

  if (!collection) {
    throw new Response('Collection not found', {status: 404});
  }

  return json({collection, menu});
}

export default function BodyCareShelfRoute() {
  const {collection, menu} = useLoaderData();

  const collectionProducts = collection?.products?.nodes ?? [];

  // Build shelves from subcollections in the menu
  const menuItems = menu?.items ?? [];
  const shelvesFromMenu = menuItems
    .filter(
      (item) =>
        item?.resource?.__typename === 'Collection' &&
        item.resource?.products?.nodes?.length,
    )
    .map((item, index) => {
      const shelfCollection = item.resource;
      const products = shelfCollection.products?.nodes ?? [];
      return {
        id: item.id || shelfCollection.id || `shelf-${index}`,
        label: item.title || shelfCollection.title,
        products,
      };
    });

  let shelves = shelvesFromMenu;
  let totalProductCount = shelves.reduce(
    (sum, shelf) => sum + (shelf.products?.length ?? 0),
    0,
  );

  // Fallback: if no subcollections / shelves, use the main collection as one shelf
  if (!shelves.length && collectionProducts.length) {
    shelves = [
      {
        id: collection.id,
        label: collection.title || 'Body care',
        products: collectionProducts,
      },
    ];
    totalProductCount = collectionProducts.length;
  }

  const hasProducts = totalProductCount > 0;

  return (
    <main className="bcs-page">
      {/* HERO WITH BEAUTY ILLUSTRATION */}
      <section className="bcs-hero">
        <div className="bcs-hero-text">
          <p className="bcs-eyebrow">Health &amp; Beauty · Body line</p>
          <h1 className="bcs-title">
            {collection.title || 'Body care shelf wall'}
          </h1>
          <p className="bcs-sub">
            A shelf-style view of body splash, spray, and cream. Each row is a
            sub-collection. Slide across the shelves to browse, then open any
            product you like.
          </p>
          <span className="bcs-count">
            {totalProductCount} item{totalProductCount === 1 ? '' : 's'}
          </span>
        </div>

        <div className="bcs-hero-illustration" aria-hidden="true">
          <div className="bcs-hero-beauty-scene">
            <div className="bcs-beauty-orb bcs-beauty-orb--back" />
            <div className="bcs-beauty-orb bcs-beauty-orb--front" />

            <div className="bcs-beauty-bottle" />
            <div className="bcs-beauty-tube" />
            <div className="bcs-beauty-jar">
              <div className="bcs-beauty-jar-lid" />
            </div>

            <span className="bcs-beauty-sparkle bcs-beauty-sparkle--one" />
            <span className="bcs-beauty-sparkle bcs-beauty-sparkle--two" />
            <span className="bcs-beauty-sparkle bcs-beauty-sparkle--three" />
          </div>
        </div>
      </section>

      {!hasProducts ? (
        <section className="bcs-empty">
          <p className="bcs-empty-title">No body care items yet</p>
          <p className="bcs-empty-text">
            The health-beauty collection does not contain products at the
            moment.
          </p>
        </section>
      ) : (
        <section className="bcs-wall">
          {shelves.map((shelf) => (
            <div className="bcs-shelf" key={shelf.id}>
              <div className="bcs-shelf-label-row">
                <span className="bcs-shelf-label">{shelf.label}</span>
                <span className="bcs-shelf-hint">Scroll horizontally</span>
              </div>

              <div className="bcs-shelf-line" />

              <div className="bcs-shelf-track">
                <div className="bcs-shelf-scroll">
                  {shelf.products.map((product, indexOnShelf) => {
                    const image = product.featuredImage;
                    const price = product.priceRange?.minVariantPrice;

                    return (
                      <article
                        key={product.id}
                        className="bcs-bottle"
                        style={{
                          '--bcs-bottle-index': indexOnShelf,
                        }}
                      >
                        <Link
                          to={`/products/${product.handle}`}
                          className="bcs-bottle-inner"
                        >
                          <div className="bcs-bottle-image-wrap">
                            {image?.url ? (
                              <img
                                src={image.url}
                                alt={image.altText || product.title}
                                width={image.width || 400}
                                height={image.height || 400}
                                loading="lazy"
                              />
                            ) : (
                              <div className="bcs-bottle-image-placeholder">
                                No image
                              </div>
                            )}
                          </div>

                          <div className="bcs-bottle-text">
                            <h2 className="bcs-bottle-name">{product.title}</h2>
                          </div>

                          <div className="bcs-bottle-meta">
                            {price && (
                              <span className="bcs-bottle-price">
                                {price.amount} {price.currencyCode}
                              </span>
                            )}
                            {!product.availableForSale && (
                              <span className="bcs-bottle-badge">Sold out</span>
                            )}
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
