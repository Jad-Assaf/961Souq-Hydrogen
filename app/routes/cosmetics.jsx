// app/routes/body-care.jsx
import React, {useMemo, useState} from 'react';
import {json} from '@shopify/remix-oxygen';
import {Link, useLoaderData} from '@remix-run/react';
import bodyCareStyles from '~/styles/body-care.css?url';

const BODY_CARE_COLLECTION_HANDLE = 'cosmetics';
const BODY_CARE_MENU_HANDLE = 'cosmetics';

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

export default function BodyCareRoute() {
  const {collection, menu} = useLoaderData();

  const collectionProducts = collection?.products?.nodes ?? [];
  const menuItems = menu?.items ?? [];

  // Build "shelves" from subcollections in the menu
  const shelvesFromMenu = menuItems
    .filter(
      (item) =>
        item?.resource?.__typename === 'Collection' &&
        item.resource?.products?.nodes?.length,
    )
    .map((item, index) => {
      const shelfCollection = item.resource;
      const products = shelfCollection.products?.nodes ?? [];
      const shelfId =
        shelfCollection.handle ||
        shelfCollection.id ||
        item.id ||
        `shelf-${index}`;
      return {
        id: shelfId,
        label: item.title || shelfCollection.title || 'Collection',
        products,
      };
    });

  let shelves = shelvesFromMenu;
  if (!shelves.length && collectionProducts.length) {
    shelves = [
      {
        id: collection.id,
        label: collection.title || 'Body care',
        products: collectionProducts,
      },
    ];
  }

  const categoryMap = new Map();
  for (const shelf of shelves) {
    if (shelf?.id && !categoryMap.has(shelf.id)) {
      categoryMap.set(shelf.id, shelf.label);
    }
  }
  const allCategories = Array.from(categoryMap, ([id, label]) => ({
    id,
    label,
  }));

  // Flatten to a single list, de-duping products while preserving shelf ids
  const productMap = new Map();
  for (const shelf of shelves) {
    const shelfId = shelf?.id;
    if (!shelfId) continue;
    const shelfLabel = shelf.label;
    for (const product of shelf.products ?? []) {
      if (!product?.id) continue;
      const existing = productMap.get(product.id);
      if (!existing) {
        productMap.set(product.id, {
          ...product,
          __shelfIds: [shelfId],
          __shelfLabels: {[shelfId]: shelfLabel},
        });
        continue;
      }
      if (!existing.__shelfIds.includes(shelfId)) {
        existing.__shelfIds.push(shelfId);
      }
      if (!existing.__shelfLabels[shelfId]) {
        existing.__shelfLabels[shelfId] = shelfLabel;
      }
    }
  }
  const productsWithShelf = Array.from(productMap.values());

  const allCategoryLabels = allCategories.map((category) => category.label);
  const categoryLabelById = new Map(
    allCategories.map((category) => [category.id, category.label]),
  );

  const [selectedCategories, setSelectedCategories] = useState([]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategories.length) return productsWithShelf;
    return productsWithShelf.filter((p) =>
      p.__shelfIds?.some((id) => selectedCategories.includes(id)),
    );
  }, [productsWithShelf, selectedCategories]);

  const productsCount = filteredProducts.length;
  const hasProducts = productsWithShelf.length > 0;

  function toggleCategory(categoryId) {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((x) => x !== categoryId)
        : [...prev, categoryId],
    );
  }

  return (
    <main className="bb-page">
      {/* HERO */}
      {/* HERO */}
      <section className="bb-hero">
        <div className="bb-hero-left">
          <div className="bb-hero-glass">
            <p className="bb-hero-eyebrow">Health &amp; beauty · Body line</p>
            <h1 className="bb-hero-title">Cosmetics</h1>
            <p className="bb-hero-sub">
              Discover body mists, sprays, creams and more, curated in one place
              and inspired by the kind of cosmetics you love from Bath & Body
              Works and Sephora—so you can quickly find your next everyday
              favorite.
            </p>
            <div className="bb-hero-meta">
              <span className="bb-hero-count">
                {productsWithShelf.length} item
                {productsWithShelf.length === 1 ? '' : 's'}
              </span>
              {allCategories.length > 0 && (
                <span className="bb-hero-tags">
                  {allCategoryLabels.slice(0, 3).join(' · ')}
                  {allCategoryLabels.length > 3 ? ' · more' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* <div className="bb-hero-right" aria-hidden="true">
          <div className="bb-hero-visual">
            <div className="bb-hero-orb bb-hero-orb-back" />
            <div className="bb-hero-orb bb-hero-orb-front" />

            <div className="bb-hero-bottle" />
            <div className="bb-hero-tube" />
            <div className="bb-hero-jar">
              <div className="bb-hero-jar-lid" />
            </div>

            <span className="bb-hero-sparkle bb-hero-sparkle-1" />
            <span className="bb-hero-sparkle bb-hero-sparkle-2" />
            <span className="bb-hero-sparkle bb-hero-sparkle-3" />
          </div>
        </div> */}
      </section>

      {!hasProducts ? (
        <section className="bb-empty">
          <p className="bb-empty-title">No body care products</p>
          <p className="bb-empty-text">
            The health-beauty collection does not contain products at the
            moment.
          </p>
        </section>
      ) : (
        <section className="bb-main">
          {/* FILTER PANEL */}
          {/* <div className="bb-filter">
            <div className="bb-filter-card">
              <p className="bb-filter-title">Filter by line</p>
              <div className="bb-filter-chips">
                {allCategories.map((label) => {
                  const active = selectedCategories.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      className={
                        'bb-filter-chip' +
                        (active ? ' bb-filter-chip-active' : '')
                      }
                      onClick={() => toggleCategory(label)}
                    >
                      <span className="bb-filter-chip-dot" />
                      <span className="bb-filter-chip-label">{label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  className="bb-filter-reset"
                  onClick={() => setSelectedCategories([])}
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="bb-filter-note">
              <p>
                Products are grouped by subcollections in the{' '}
                <strong>health-beauty</strong> menu.
              </p>
            </div>
          </div> */}

          {/* PRODUCTS GRID */}
          <div className="bb-products">
            <div className="bb-filter">
              <div className="bb-filter-card">
                <p className="bb-filter-title">Filter by line</p>
                <div className="bb-filter-chips">
                  {allCategories.map((category) => {
                    const active = selectedCategories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        className={
                          'bb-filter-chip' +
                          (active ? ' bb-filter-chip-active' : '')
                        }
                        onClick={() => toggleCategory(category.id)}
                      >
                        <span className="bb-filter-chip-dot" />
                        <span className="bb-filter-chip-label">
                          {category.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedCategories.length > 0 && (
                  <button
                    type="button"
                    className="bb-filter-reset"
                    onClick={() => setSelectedCategories([])}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
            <div className="bb-products-header">
              <div>
                <p className="bb-products-count">
                  {productsCount} product
                  {productsCount === 1 ? '' : 's'}
                </p>
                {selectedCategories.length > 0 && (
                  <p className="bb-products-filtered">
                    Showing{' '}
                  {selectedCategories
                    .map((id) => categoryLabelById.get(id))
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(', ')
                    .toLowerCase()}
                  {selectedCategories.length > 3 ? '…' : ''}
                </p>
              )}
            </div>
          </div>

            <div className="bb-products-grid">
              {filteredProducts.map((product, index) => {
                const image = product.featuredImage;
                const price = product.priceRange?.minVariantPrice;
                const categoryLabel =
                  selectedCategories.length === 1
                    ? product.__shelfLabels?.[selectedCategories[0]] ||
                      product.__shelfLabels?.[product.__shelfIds?.[0]]
                    : product.__shelfLabels?.[product.__shelfIds?.[0]];

                return (
                  <article
                    key={product.id}
                    className="bb-card"
                    style={{'--bb-card-index': index}}
                  >
                    <Link
                      to={`/products/${product.handle}`}
                      className="bb-card-inner"
                      target="_blank"
                    >
                      <div className="bb-card-head">
                        <span className="bb-card-category">
                          {categoryLabel}
                        </span>
                        {price && (
                          <span className="bb-card-price">
                            ${price.amount}0
                          </span>
                        )}
                      </div>

                      <div className="bb-card-image">
                        {image?.url ? (
                          <img
                            src={image.url}
                            alt={image.altText || product.title}
                            width={image.width || 600}
                            height={image.height || 600}
                            loading="lazy"
                          />
                        ) : (
                          <div className="bb-card-image-placeholder">
                            No image
                          </div>
                        )}
                      </div>
                      <h2 className="bb-card-title">{product.title}</h2>

                      <div className="bb-card-footer">
                        <span
                          className={
                            'bb-card-badge' +
                            (product.availableForSale
                              ? ' bb-card-badge-available'
                              : ' bb-card-badge-soldout')
                          }
                        >
                          {product.availableForSale ? 'In stock' : 'Sold out'}
                        </span>
                        <span className="bb-card-cta">
                          View product<span aria-hidden="true"> →</span>
                        </span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
