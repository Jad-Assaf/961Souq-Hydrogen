// app/routes/build-my-setup.jsx
import React, {useMemo, useState, useEffect} from 'react';
import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {CartForm, Money} from '@shopify/hydrogen';
import styles from '~/styles/build-my-setup.css?url';

export const links = () => [{rel: 'stylesheet', href: styles}];

const SELECTIONS_STORAGE_KEY = 'buildMySetupSelections_v1';

/**
 * BASE CONFIG
 * -----------------------------------------
 * For the gaming, apple and creator setups, we use collectionHandles.
 * Loader will automatically fetch products from each collection
 * and convert them into productHandles.
 */

const BASE_SETUP_CONFIG = {
  gaming: {
    key: 'gaming',
    label: 'Gaming Setup',
    description:
      'Build a full gaming setup: machine, screen, controls and audio.',
    steps: [
      {
        id: 'gaming-machine',
        label: 'Pick your gaming machine',
        description: 'Choose a gaming laptop, desktop or budget option.',
        collectionHandles: [
          'gaming-laptops',
          'gaming-desktops',
          'gaming-consoles',
        ],
      },
      {
        id: 'gaming-monitor',
        label: 'Choose your monitor',
        description: 'Higher refresh rate for smoother gameplay.',
        collectionHandles: [
          '144hz-monitors',
          '165hz-monitors',
          '240hz-monitors',
        ],
      },
      {
        id: 'gaming-input',
        label: 'Gaming Keyboard & mouse',
        description: 'Pick the combo that fits your play style.',
        collectionHandles: ['gaming-keyboards', 'gaming-mouse', 'mousepads'],
      },
      {
        id: 'gaming-audio',
        label: 'Gaming Audio Equipment',
        description: 'Hear every footstep with the right headset or speakers.',
        collectionHandles: ['gaming-headphones', 'gaming-speakers'],
      },
      {
        id: 'gaming-lights',
        label: 'RGB Gaming Lights',
        description: 'RGB lights to complete you set.',
        collectionHandles: [
          'rgb-led-strips',
          'rgb-led-light-bars',
          'rgb-led-panels',
        ],
      },
    ],
  },

  apple: {
    key: 'apple',
    label: 'Apple Desk Setup',
    description: 'Mac + display + clean accessories for a focused desk.',
    steps: [
      {
        id: 'apple-brain',
        label: 'Pick your Mac',
        description: 'MacBook or iMac as your main machine.',
        collectionHandles: ['apple-macbook', 'apple-imac', 'apple-mac-studio'],
      },
      {
        id: 'apple-display',
        label: 'External display',
        description: 'More screen space for multitasking.',
        collectionHandles: ['apple-studio-display'],
      },
      {
        id: 'apple-input',
        label: 'Keyboard & mouse',
        description: 'Wireless, clean, and minimal.',
        collectionHandles: ['magic-mouse-keyboard'],
      },
      {
        id: 'apple-accessories',
        label: 'Desk accessories',
        description: 'Stands, hubs and essential add-ons.',
        collectionHandles: [
          'macbook-sleeves',
          'macbook-external-hubs',
          'macbook-hardshell',
          'macbook-stands',
        ],
      },
    ],
  },

  creator: {
    key: 'creator',
    label: 'Creator / Streaming Setup',
    description: 'Audio, camera and lighting for content creation.',
    steps: [
      {
        id: 'creator-base',
        label: 'Main device',
        description: 'Choose your main machine.',
        collectionHandles: ['laptops'],
      },
      {
        id: 'creator-audio',
        label: 'Audio chain',
        description: 'Mic, interface or streaming mixer.',
        collectionHandles: ['condenser-mic', 'dynamic-mic', 'rode-accessories'],
      },
      {
        id: 'creator-camera',
        label: 'Camera / webcam',
        description: 'Look sharp on stream.',
        collectionHandles: ['webcams', 'conferencing-webcams'],
      },
      {
        id: 'creator-lighting',
        label: 'Lighting',
        description: 'Key lights or ring lights for clean visuals.',
        collectionHandles: [
          'ring-lights',
          'rgb-led-strips',
          'rgb-led-light-bars',
          'rgb-led-panels',
        ],
      },
    ],
  },

  study: {
    key: 'study',
    label: 'Work / Study Setup',
    description: 'Laptop, screen and basics for productivity.',
    steps: [
      {
        id: 'study-device',
        label: 'Main device',
        description: 'Pick a laptop for school or work.',
        collectionHandles: ['laptops'],
      },
      {
        id: 'study-display',
        label: 'Extra screen (optional)',
        description: 'Boost productivity with a second screen.',
        collectionHandles: ['business-monitors'],
      },
      {
        id: 'study-basics',
        label: 'Essentials',
        description: 'Backpack, mouse, headset, etc.',
        collectionHandles: [
          'laptop-bags',
          'keyboard-mouse-combos',
          'mousepads',
          'headphones',
        ],
      },
    ],
  },
};

/**
 * GRAPHQL
 * -----------------------------------------
 * 1) Get ALL products from a collection handle (paged).
 * 2) Get a product by handle.
 */

const COLLECTION_ALL_PRODUCTS_QUERY = `#graphql
  query BuildMySetup_CollectionAllProducts($handle: String!, $cursor: String) {
    collection(handle: $handle) {
      id
      handle
      title
      products(first: 100, after: $cursor, sortKey: CREATED, reverse: true) {
        nodes {
          id
          handle
          title
          featuredImage {
            id
            url
            altText
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 1) {
            nodes {
              id
              title
              availableForSale
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `#graphql
  query BuildMySetup_ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      featuredImage {
        id
        url
        altText
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      variants(first: 1) {
        nodes {
          id
          title
          availableForSale
        }
      }
    }
  }
`;

/**
 * LOADER
 * -----------------------------------------
 * - Clone BASE_SETUP_CONFIG.
 * - For any step with collectionHandles, fetch ALL products
 *   in each collection (paginated) and fill:
 *      step.productHandles     (flat list for totals)
 *      step.collections[]      (per-collection groups for carousels)
 * - Then fetch all remaining products referenced by productHandles.
 */

export async function loader({context}) {
  const {storefront} = context;

  // Deep clone base config so we can safely mutate
  const setupConfig = JSON.parse(JSON.stringify(BASE_SETUP_CONFIG));
  const productsByHandle = {};

  // 1) Resolve collectionHandles → productHandles + product data + collections structure
  for (const journey of Object.values(setupConfig)) {
    for (const step of journey.steps) {
      if (step.collectionHandles && step.collectionHandles.length > 0) {
        step.productHandles = [];
        step.collections = [];

        for (const collHandle of step.collectionHandles) {
          try {
            let allProducts = [];
            let cursor = null;
            let hasNextPage = true;
            let collectionTitle = collHandle;

            // Paginate through all products in the collection
            while (hasNextPage) {
              const data = await storefront.query(
                COLLECTION_ALL_PRODUCTS_QUERY,
                {variables: {handle: collHandle, cursor}},
              );

              const collection = data?.collection;
              if (collection?.title) {
                collectionTitle = collection.title;
              }

              const pageProducts = collection?.products?.nodes || [];
              const pageInfo = collection?.products?.pageInfo;

              allProducts = allProducts.concat(pageProducts);

              hasNextPage = pageInfo?.hasNextPage || false;
              cursor = pageInfo?.endCursor || null;

              // Safety break in case something goes wrong
              if (!pageInfo) {
                hasNextPage = false;
              }
            }

            const collectionGroup = {
              handle: collHandle,
              title: collectionTitle,
              productHandles: [],
            };

            for (const product of allProducts) {
              if (!product) continue;
              collectionGroup.productHandles.push(product.handle);
              step.productHandles.push(product.handle);
              productsByHandle[product.handle] = product;
            }

            if (collectionGroup.productHandles.length > 0) {
              step.collections.push(collectionGroup);
            }
          } catch (error) {
            console.error(
              'Error loading collection products for handle:',
              collHandle,
              error,
            );
          }
        }
      }
    }
  }

  // 2) Gather all product handles that still need fetching
  const allHandlesToFetch = new Set();
  for (const journey of Object.values(setupConfig)) {
    for (const step of journey.steps) {
      (step.productHandles || []).forEach((handle) => {
        if (handle && !productsByHandle[handle]) {
          allHandlesToFetch.add(handle);
        }
      });
    }
  }

  // 3) Fetch remaining products by handle (for steps using productHandles directly)
  await Promise.all(
    Array.from(allHandlesToFetch).map(async (handle) => {
      try {
        const data = await storefront.query(PRODUCT_BY_HANDLE_QUERY, {
          variables: {handle},
        });
        if (data?.product) {
          productsByHandle[handle] = data.product;
        }
      } catch (error) {
        console.error('Error loading product for handle:', handle, error);
      }
    }),
  );

  return json({
    setupConfig,
    productsByHandle,
  });
}

export const meta = () => {
  return [{title: 'Build My Setup | 961Souq'}];
};

/**
 * COMPONENT
 * -----------------------------------------
 * - Multi-select per step (array of handles).
 * - Click again to unselect.
 * - Selections are persisted in localStorage.
 * - Steps with collections render each collection as a horizontal carousel.
 * - Per-collection search input to filter products.
 * - CartForm uses `inputs` prop.
 * - Clear all selections per journey.
 * - Remove items directly from summaries.
 */

// Reusable section component
export function BuildMySetupSection({setupConfig, productsByHandle}) {
  const journeys = Object.values(setupConfig);

  const [currentJourneyKey, setCurrentJourneyKey] = useState(journeys[0]?.key);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // selections: { [journeyKey]: { [stepId]: string[] } }, with localStorage restore
  const [selections, setSelections] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(SELECTIONS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to parse saved Build My Setup selections', e);
      }
    }

    const initial = {};
    journeys.forEach((j) => {
      initial[j.key] = {};
      j.steps.forEach((s) => {
        initial[j.key][s.id] = [];
      });
    });
    return initial;
  });

  // Per-collection search terms:
  // { "journeyKey::stepId::collectionHandle": "search term" }
  const [collectionSearch, setCollectionSearch] = useState({});

  // Persist selections in localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        SELECTIONS_STORAGE_KEY,
        JSON.stringify(selections),
      );
    } catch (e) {
      console.error('Failed to store Build My Setup selections', e);
    }
  }, [selections]);

  const currentJourney = setupConfig[currentJourneyKey];

  const currentStep = useMemo(() => {
    if (!currentJourney) return null;
    return currentJourney.steps[currentStepIndex] ?? null;
  }, [currentJourney, currentStepIndex]);

  const currentJourneySelections = selections[currentJourneyKey] || {};

  // Helpers for collection search
  function getCollectionSearchKey(stepId, collectionHandle) {
    return `${currentJourneyKey}::${stepId}::${collectionHandle}`;
  }

  function getCollectionSearchTerm(stepId, collectionHandle) {
    const key = getCollectionSearchKey(stepId, collectionHandle);
    return collectionSearch[key] || '';
  }

  function setCollectionSearchTerm(stepId, collectionHandle, value) {
    const key = getCollectionSearchKey(stepId, collectionHandle);
    setCollectionSearch((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // Ensure selection structure has a slot for each journey + step
  function ensureJourneySlots(baseSelections) {
    const ensured = {...baseSelections};
    journeys.forEach((j) => {
      if (!ensured[j.key]) ensured[j.key] = {};
      j.steps.forEach((s) => {
        if (!Array.isArray(ensured[j.key][s.id])) {
          ensured[j.key][s.id] = [];
        }
      });
    });
    return ensured;
  }

  function handleSelectJourney(key) {
    setCurrentJourneyKey(key);
    setCurrentStepIndex(0);
  }

  // Toggle selection for a given handle in a given step (multi-select)
  function handleSelectProduct(stepId, handle) {
    setSelections((prevRaw) => {
      const prev = ensureJourneySlots(prevRaw);
      const journeySelections = prev[currentJourneyKey] || {};
      const prevStepSelections = journeySelections[stepId] || [];
      const alreadySelected = prevStepSelections.includes(handle);

      const nextStepSelections = alreadySelected
        ? prevStepSelections.filter((h) => h !== handle)
        : [...prevStepSelections, handle];

      return {
        ...prev,
        [currentJourneyKey]: {
          ...journeySelections,
          [stepId]: nextStepSelections,
        },
      };
    });
  }

  // Clear all selections for the current journey
  function clearCurrentJourneySelections() {
    if (!currentJourney) return;
    setSelections((prevRaw) => {
      const prev = ensureJourneySlots(prevRaw);
      const next = {...prev};

      const clearedJourneySelections = {};
      currentJourney.steps.forEach((step) => {
        clearedJourneySelections[step.id] = [];
      });

      next[currentJourneyKey] = clearedJourneySelections;
      return next;
    });
  }

  // Remove a given handle from ALL steps of the current journey
  function removeHandleFromCurrentJourney(handle) {
    if (!currentJourney) return;
    setSelections((prevRaw) => {
      const prev = ensureJourneySlots(prevRaw);
      const journeySelections = prev[currentJourneyKey] || {};

      const updatedJourneySelections = {};
      Object.keys(journeySelections).forEach((stepId) => {
        const list = journeySelections[stepId] || [];
        updatedJourneySelections[stepId] = list.filter((h) => h !== handle);
      });

      return {
        ...prev,
        [currentJourneyKey]: updatedJourneySelections,
      };
    });
  }

  function goToNextStep() {
    if (!currentJourney) return;
    setCurrentStepIndex((idx) =>
      Math.min(idx + 1, currentJourney.steps.length - 1),
    );
  }

  function goToPrevStep() {
    if (!currentJourney) return;
    setCurrentStepIndex((idx) => Math.max(idx - 1, 0));
  }

  // All selected product handles for the current journey (deduped)
  const selectedHandles = useMemo(() => {
    if (!currentJourney) return [];
    const handles = [];
    currentJourney.steps.forEach((step) => {
      const stepSelections = currentJourneySelections[step.id] || [];
      handles.push(...stepSelections);
    });
    return Array.from(new Set(handles));
  }, [currentJourney, currentJourneySelections]);

  const selectedProducts = selectedHandles
    .map((handle) => productsByHandle[handle])
    .filter(Boolean);

  const totalPrice = selectedProducts.reduce((sum, product) => {
    const priceStr = product?.priceRange?.minVariantPrice?.amount ?? '0';
    const numeric = Number(priceStr);
    return sum + (Number.isNaN(numeric) ? 0 : numeric);
  }, 0);

  const currencyCode =
    selectedProducts[0]?.priceRange?.minVariantPrice?.currencyCode ?? 'USD';

  const realSelectedProducts = selectedProducts.filter((p) =>
    String(p.id).startsWith('gid://'),
  );

  return (
    <section className="bms-page">
      <div className="bms-inner">
        <header className="bms-header">
          <h1 className="bms-title">Build My Setup</h1>
          <p className="bms-subtitle">
            Choose a journey, walk through a few steps, and send a complete
            setup straight to your cart.
          </p>
        </header>

        {/* Journey selector */}
        <div className="bms-journeys">
          {journeys.map((journey) => {
            const isActive = journey.key === currentJourneyKey;
            return (
              <div key={journey.key} className="bms-journey-pill-container">
                <button
                  type="button"
                  className={
                    'bms-journey-pill' +
                    (isActive ? ' bms-journey-pill--active' : '')
                  }
                  onClick={() => handleSelectJourney(journey.key)}
                >
                  <span className="bms-journey-label">{journey.label}</span>
                </button>
                <span className="bms-journey-desc">{journey.description}</span>
              </div>
            );
          })}
        </div>

        {currentJourney && currentStep ? (
          <div className="bms-layout">
            {/* Steps sidebar */}
            <aside className="bms-steps">
              {currentJourney.steps.map((step, index) => {
                const isCurrent = index === currentStepIndex;
                const stepSelected =
                  (currentJourneySelections[step.id] || []).length > 0;
                const done = stepSelected;
                return (
                  <button
                    key={step.id}
                    type="button"
                    className={
                      'bms-step-item' +
                      (isCurrent ? ' bms-step-item--current' : '') +
                      (done ? ' bms-step-item--done' : '')
                    }
                    onClick={() => setCurrentStepIndex(index)}
                  >
                    <span className="bms-step-index">{index + 1}</span>
                    <div className="bms-step-texts">
                      <span className="bms-step-label">{step.label}</span>
                      {done && (
                        <span className="bms-step-status">Selected</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </aside>

            {/* Step content */}
            <main className="bms-main">
              <div className="bms-step-header">
                <h2 className="bms-step-title">{currentStep.label}</h2>
                <p className="bms-step-description">
                  {currentStep.description}
                </p>
              </div>

              {/* PRODUCTS: collections as carousels; fall back to grid if no collections */}
              {currentStep.collections && currentStep.collections.length > 0 ? (
                <div className="bms-collections-wrap">
                  {currentStep.collections.map((collection) => {
                    // Keep exactly what the user typed for the input
                    const rawTerm = getCollectionSearchTerm(
                      currentStep.id,
                      collection.handle,
                    );
                    const searchTerm = rawTerm;

                    // For matching: split into tokens so order doesn’t matter
                    const normalizedSearch = rawTerm.toLowerCase().trim();
                    const tokens = normalizedSearch
                      ? normalizedSearch.split(/\s+/).filter(Boolean)
                      : [];

                    const filteredHandles = collection.productHandles.filter(
                      (handle) => {
                        const product = productsByHandle[handle];
                        if (!product) return false;
                        if (!tokens.length) return true; // empty search → show all

                        const title = product.title?.toLowerCase() || '';
                        const handleStr = product.handle?.toLowerCase() || '';
                        const variantTitle =
                          product.variants?.nodes?.[0]?.title?.toLowerCase() ||
                          '';

                        // Everything we want to search in
                        const haystack = `${title} ${handleStr} ${variantTitle}`;

                        // All tokens must appear somewhere, in any order
                        return tokens.every((token) =>
                          haystack.includes(token),
                        );
                      },
                    );

                    return (
                      <div
                        key={collection.handle}
                        className="bms-collection-block"
                      >
                        <div className="bms-collection-header">
                          <h3 className="bms-collection-title">
                            {collection.title}
                          </h3>
                          <div className="bms-collection-search-wrap">
                            <span className="bms-collection-search-icon">
                              🔍
                            </span>
                            <input
                              id={`search-${collection.handle}`}
                              type="search"
                              className="bms-collection-search"
                              placeholder="Search in this collection"
                              value={searchTerm}
                              onChange={(e) =>
                                setCollectionSearchTerm(
                                  currentStep.id,
                                  collection.handle,
                                  e.target.value,
                                )
                              }
                              onKeyDown={(e) => {
                                e.stopPropagation();
                              }}
                            />
                          </div>
                        </div>

                        <div className="bms-collection-carousel">
                          {filteredHandles.length === 0 ? (
                            <div className="bms-collection-empty">
                              No products match this search.
                            </div>
                          ) : (
                            filteredHandles.map((handle) => {
                              const product = productsByHandle[handle];

                              if (!product) {
                                return (
                                  <div
                                    key={handle}
                                    className="bms-product-card bms-product-card--missing"
                                  >
                                    <div className="bms-product-body">
                                      <div className="bms-product-title">
                                        Missing product
                                      </div>
                                      <div className="bms-product-subtitle">
                                        Handle: {handle}
                                      </div>
                                      <p className="bms-product-note">
                                        Make sure this handle exists as a
                                        product.
                                      </p>
                                    </div>
                                  </div>
                                );
                              }

                              const stepSelections =
                                currentJourneySelections[currentStep.id] || [];
                              const isSelected =
                                stepSelections.includes(handle);
                              const variant = product.variants?.nodes?.[0];

                              return (
                                <button
                                  key={product.id}
                                  type="button"
                                  className={
                                    'bms-product-card' +
                                    (isSelected
                                      ? ' bms-product-card--selected'
                                      : '')
                                  }
                                  onClick={() =>
                                    handleSelectProduct(currentStep.id, handle)
                                  }
                                >
                                  {product.featuredImage && (
                                    <div className="bms-product-image-wrap">
                                      <img
                                        src={`${product.featuredImage.url}&width=300`}
                                        alt={
                                          product.featuredImage.altText ||
                                          product.title
                                        }
                                        className="bms-product-image"
                                        loading="lazy"
                                      />
                                    </div>
                                  )}

                                  <div className="bms-product-body">
                                    <div className="bms-product-title">
                                      {product.title}
                                    </div>
                                    <div className="bms-product-meta">
                                      {variant?.availableForSale === false && (
                                        <span className="bms-badge bms-badge--soldout">
                                          Sold out
                                        </span>
                                      )}
                                    </div>
                                    <div className="bms-product-price">
                                      <Money
                                        data={
                                          product.priceRange.minVariantPrice
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="bms-product-footer">
                                    <span className="bms-product-select-label">
                                      {isSelected
                                        ? 'Selected (click to remove)'
                                        : 'Select this'}
                                    </span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bms-products-grid">
                  {(currentStep.productHandles || []).map((handle) => {
                    const product = productsByHandle[handle];

                    if (!product) {
                      return (
                        <div
                          key={handle}
                          className="bms-product-card bms-product-card--missing"
                        >
                          <div className="bms-product-body">
                            <div className="bms-product-title">
                              Missing product
                            </div>
                            <div className="bms-product-subtitle">
                              Handle: {handle}
                            </div>
                            <p className="bms-product-note">
                              Make sure this handle exists as a product.
                            </p>
                          </div>
                        </div>
                      );
                    }

                    const stepSelections =
                      currentJourneySelections[currentStep.id] || [];
                    const isSelected = stepSelections.includes(handle);
                    const variant = product.variants?.nodes?.[0];

                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={
                          'bms-product-card' +
                          (isSelected ? ' bms-product-card--selected' : '')
                        }
                        onClick={() =>
                          handleSelectProduct(currentStep.id, handle)
                        }
                      >
                        {product.featuredImage && (
                          <div className="bms-product-image-wrap">
                            <img
                              src={product.featuredImage.url}
                              alt={
                                product.featuredImage.altText || product.title
                              }
                              className="bms-product-image"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="bms-product-body">
                          <div className="bms-product-title">
                            {product.title}
                          </div>
                          <div className="bms-product-meta">
                            {variant?.availableForSale === false && (
                              <span className="bms-badge bms-badge--soldout">
                                Sold out
                              </span>
                            )}
                          </div>
                          <div className="bms-product-price">
                            <Money data={product.priceRange.minVariantPrice} />
                          </div>
                        </div>

                        <div className="bms-product-footer">
                          <span className="bms-product-select-label">
                            {isSelected
                              ? 'Selected (click to remove)'
                              : 'Select this'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step nav */}
              <div className="bms-step-nav">
                <button
                  type="button"
                  className="bms-nav-button"
                  onClick={goToPrevStep}
                  disabled={currentStepIndex === 0}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="bms-nav-button"
                  onClick={goToNextStep}
                  disabled={
                    currentStepIndex === currentJourney.steps.length - 1
                  }
                >
                  Next →
                </button>
              </div>
            </main>

            {/* Summary / Cart section */}
            <aside className="bms-summary">
              <div className="bms-summary-header">
                <h3 className="bms-summary-title">Setup summary</h3>
                {selectedProducts.length > 0 && (
                  <button
                    type="button"
                    className="bms-clear-button"
                    onClick={clearCurrentJourneySelections}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {selectedProducts.length === 0 ? (
                <p className="bms-summary-empty">
                  Select at least one item in the steps to build your setup.
                </p>
              ) : (
                <div className="bms-summary-list">
                  {selectedProducts.map((product) => (
                    <div key={product.id} className="bms-summary-item">
                      <div className="bms-summary-item-main">
                        <div className="bms-summary-item-title">
                          {product.title}
                        </div>
                        <div className="bms-summary-item-price">
                          <Money data={product.priceRange.minVariantPrice} />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="bms-summary-remove"
                        onClick={() =>
                          removeHandleFromCurrentJourney(product.handle)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="bms-summary-total">
                <span>Total (approx.)</span>
                <strong>
                  {totalPrice > 0 ? (
                    <Money
                      data={{
                        amount: totalPrice.toFixed(2),
                        currencyCode,
                      }}
                    />
                  ) : (
                    '--'
                  )}
                </strong>
              </div>

              {selectedProducts.length > 0 &&
                realSelectedProducts.length === 0 && (
                  <p className="bms-summary-note">
                    Once you replace the example handles with real products,
                    you&apos;ll be able to add all selected items to your cart
                    from here.
                  </p>
                )}

              {realSelectedProducts.length > 0 && (
                <CartForm
                  route="/cart"
                  action={CartForm.ACTIONS.LinesAdd}
                  inputs={{
                    lines: realSelectedProducts
                      .map((product) => {
                        const variant = product.variants?.nodes?.[0];
                        if (!variant) return null;
                        return {
                          merchandiseId: variant.id,
                          quantity: 1,
                        };
                      })
                      .filter(Boolean),
                  }}
                  className="bms-cart-form"
                >
                  <button type="submit" className="bms-add-all-button">
                    Add all selected to cart
                  </button>
                </CartForm>
              )}
            </aside>
          </div>
        ) : (
          <p>Something went wrong loading the setup wizard.</p>
        )}
      </div>
    </section>
  );
}

// Route stays as a thin wrapper using the same UI
export default function BuildMySetupRoute() {
  const {setupConfig, productsByHandle} = useLoaderData();
  return (
    <BuildMySetupSection
      setupConfig={setupConfig}
      productsByHandle={productsByHandle}
    />
  );
}
