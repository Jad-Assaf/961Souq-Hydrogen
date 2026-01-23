// app/components/MobileCategoryCards.jsx
import React, {useMemo, useState, useEffect, useRef} from 'react';
import {Link} from '@remix-run/react';

function getHandleFromUrl(url = '') {
  if (!url) return '';
  const parts = url.split('/collections/');
  if (parts.length < 2) return '';
  let handle = parts[1];

  // strip query/hash if any
  handle = handle.split('?')[0].split('#')[0];

  handle = handle.toLowerCase();
  if (handle.endsWith('/')) {
    handle = handle.slice(0, -1);
  }
  return handle;
}

function normalizePath(url) {
  if (!url) return '#';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const u = new URL(url);
      return u.pathname + u.search + u.hash;
    } catch (_e) {
      return url;
    }
  }

  return url;
}

/**
 * Map collection handles to custom card images.
 * Fill these with whatever images you want per handle.
 */
const CARD_IMAGES_BY_HANDLE = {
  apple:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/apple-img.jpg?v=1764771592&width=300',
  gaming:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-img.jpg?v=1764771592&width=300',
  'gaming-laptops':
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/gaming-laptops-img.jpg?v=1764771592&width=300',
  laptops:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/laptops-img.jpg?v=1764771592&width=300',
  desktops:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/desktops-img.jpg?v=1764773830&width=300',
  'pc-parts':
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/components-img_b69f7492-1c76-4569-89ba-22c3927cc919.jpg?v=1764944882&width=300',
  networking:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/networking-img_db522598-33f9-4008-9255-713c41dc6ee3.jpg?v=1764859926&width=300',
  'business-monitors':
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/monitors_de67b538-ca50-4e4f-b1c1-fd6772f951d2.jpg?v=1764771592&width=300',
  mobiles:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/mobiles-img_80e26ae0-bd23-4621-99b3-bcb94a231a44.jpg?v=1764773830&width=300',
  tablets:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/tablets-img_8073b683-f3db-434f-8a11-220f7bf49b14.jpg?v=1764773830&width=300',
  audio:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/audio-img.jpg?v=1764773830&width=300',
  accessories:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/computer-accessories-img.jpg?v=1764773830&width=300',
  fitness:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/garmin-img_8de77403-902c-4741-9d71-23f445738d8b.jpg?v=1764838128&width=300',
  photography:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/cameras-img.jpg?v=1764771592&width=300',
  'home-appliances':
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/home-appliances-img.jpg?v=1764773830&width=300',
  cosmetics:
    'https://cdn.shopify.com/s/files/1/0552/0883/7292/files/commerce-sephora-beauty-sale-istock-1658893205_2_copy.jpg?v=1765182025&width=300',
};

function getCardImage(handle) {
  if (!handle) return null;
  return CARD_IMAGES_BY_HANDLE[handle] || null;
}

/**
 * Best image to use for a SUB collection card.
 * With your MENU_FRAGMENT it should be sub.resource.image.src.
 */
function getSubcardImage(sub) {
  if (!sub) return null;

  // 1) Direct image on the menu item (not in your query now, but safe to check)
  if (sub.image) {
    if (sub.image.url) return sub.image.url;
    if (sub.image.src) return sub.image.src;
  }

  // 2) Image on the resource union (Collection/Product)
  const resource = sub.resource;
  if (resource) {
    if (resource.image) {
      if (resource.image.url) return resource.image.url;
      if (resource.image.src) return resource.image.src;
    }
    if (resource.featuredImage) {
      if (resource.featuredImage.url) return resource.featuredImage.url;
      if (resource.featuredImage.src) return resource.featuredImage.src;
    }
  }

  // 3) Fallback by handle (if menu children have no images in the query)
  const handle = getHandleFromUrl(sub.url || '');
  if (handle && CARD_IMAGES_BY_HANDLE[handle]) {
    return CARD_IMAGES_BY_HANDLE[handle];
  }

  return null;
}

/**
 * Helpers to derive a short description for the sub-collection pill
 */
function stripHtmlTags(str = '') {
  return str.replace(/<[^>]*>/g, '').trim();
}

function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '…';
}

function getSubDescription(sub) {
  if (!sub) return '';

  const resource = sub.resource || null;
  let raw = '';

  // If you ever extend HEADER_QUERY to include description / descriptionHtml,
  // this will automatically start using it.
  if (resource) {
    if (
      typeof resource.description === 'string' &&
      resource.description.trim()
    ) {
      raw = resource.description;
    } else if (
      typeof resource.descriptionHtml === 'string' &&
      resource.descriptionHtml.trim()
    ) {
      raw = stripHtmlTags(resource.descriptionHtml);
    }
  }

  // Fallback: generate a short phrase from the title.
  if (!raw && sub.title) {
    raw = `Shop ${sub.title}`;
  }

  return truncate(raw, 100);
}

/**
 * MobileCategoryCards
 * @param {{ menu: { items?: any[] } }} props
 */
export default function MobileCategoryCards({menu}) {
  const items = menu?.items || [];

  // Normalize top-level items: only ones that have a collection handle
  const topLevelCollections = useMemo(() => {
    return items
      .map((item) => {
        const handle = getHandleFromUrl(item.url || '');
        return {
          ...item,
          handle,
        };
      })
      .filter((item) => item.handle);
  }, [items]);

  const [activeHandle, setActiveHandle] = useState(
    topLevelCollections[0]?.handle || null,
  );
  const [popupOpen, setPopupOpen] = useState(false);

  // Keep active handle in sync if menu changes
  useEffect(() => {
    if (!topLevelCollections.length) {
      setActiveHandle(null);
      setPopupOpen(false);
      return;
    }
    if (!activeHandle) {
      setActiveHandle(topLevelCollections[0].handle);
    }
  }, [topLevelCollections, activeHandle]);

  // LOCK BODY + HTML SCROLL WHEN POPUP IS OPEN
  const originalOverflowRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    const html = document.documentElement;

    if (popupOpen) {
      if (!originalOverflowRef.current) {
        originalOverflowRef.current = {
          body: body.style.overflow || '',
          html: html.style.overflow || '',
        };
      }
      body.style.overflow = 'hidden';
      html.style.overflow = 'hidden';
    } else if (originalOverflowRef.current) {
      body.style.overflow = originalOverflowRef.current.body;
      html.style.overflow = originalOverflowRef.current.html;
      originalOverflowRef.current = null;
    }

    return () => {
      if (originalOverflowRef.current) {
        body.style.overflow = originalOverflowRef.current.body;
        html.style.overflow = originalOverflowRef.current.html;
        originalOverflowRef.current = null;
      }
    };
  }, [popupOpen]);

  const activeItem = useMemo(
    () => topLevelCollections.find((i) => i.handle === activeHandle) || null,
    [topLevelCollections, activeHandle],
  );

  const hasSubCollections =
    !!activeItem && Array.isArray(activeItem.items) && activeItem.items.length;

  const handleCardClick = (handle) => {
    setActiveHandle(handle);
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
  };

  return (
    <section className="mobile-category-cards-root">
      {/* TOP LEVEL: MAIN CATEGORY CARDS */}
      <div className="mobile-category-cards-scroll">
        {topLevelCollections.map((item) => {
          const handle = item.handle;
          const isActive = handle === activeHandle;
          const bgImage = getCardImage(handle);

          return (
            <button
              key={handle || item.id || item.title}
              type="button"
              className={
                'mobile-category-card' +
                (isActive ? ' mobile-category-card--active' : '')
              }
              onClick={() => handleCardClick(handle)}
            >
              <div className="mobile-category-card-bg">
                <img
                  src={bgImage}
                  alt=""
                  loading="lazy"
                  width={300}
                  height={500}
                />
              </div>
              <div className="mobile-category-card-overlay" />
              <div className="mobile-category-card-content">
                {/* <div className="mobile-category-pill">Category</div> */}
                <div className="desc-container">
                  <h3 className="mobile-category-title">{item.title}</h3>
                  <p className="mobile-category-subtitle">
                    Tap to see sub-categories and start browsing.
                  </p>
                  {item.url ? (
                    <Link
                      to={normalizePath(item.url)}
                      className="mobile-category-view-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View all
                    </Link>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* POPUP OVERLAY: SUB-COLLECTIONS */}
      <div
        className={
          'mobile-category-popup' +
          (popupOpen && activeItem ? ' mobile-category-popup--open' : '')
        }
      >
        <div
          className="mobile-category-popup-backdrop"
          onClick={handleClosePopup}
        />
        <div
          className="mobile-category-popup-inner"
          onClick={(e) => e.stopPropagation()}
        >
          {activeItem ? (
            <>
              <div className="mobile-category-popup-header">
                <div>
                  {/* label removed as requested */}
                  <h4 className="mobile-category-subpanel-title">
                    {activeItem.title}
                  </h4>
                </div>
                <div className="mobile-category-popup-header-actions">
                  {activeItem.url ? (
                    <Link
                      to={normalizePath(activeItem.url)}
                      className="mobile-category-subpanel-link"
                    >
                      Shop all
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="mobile-category-popup-close"
                    onClick={handleClosePopup}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {hasSubCollections ? (
                <div className="mobile-category-subcards-scroll">
                  {activeItem.items.map((sub) => {
                    const subHandle = getHandleFromUrl(sub.url || '');
                    const subImageUrl = getSubcardImage(sub);
                    const subDescription = getSubDescription(sub);

                    return (
                      <Link
                        key={sub.id || subHandle || sub.title}
                        to={normalizePath(sub.url)}
                        className="mobile-subcard"
                      >
                        {subImageUrl && (
                          <div className="mobile-subcard-image-wrapper">
                            <img
                              src={`${subImageUrl}`}
                              alt={sub.title || ''}
                              className="mobile-subcard-img"
                              loading="lazy"
                              width={400}
                              height={400}
                            />
                          </div>
                        )}
                        <div className="mobile-subcard-content">
                          <h5 className="mobile-subcard-title">{sub.title}</h5>
                          {subDescription ? (
                            <div className="mobile-subcard-pill">
                              {subDescription}
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="mobile-category-subpanel-empty">
                  <p>No sub-collections configured for this category.</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
