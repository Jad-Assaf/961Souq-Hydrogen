import {useFetcher} from '@remix-run/react';
import React, {useEffect, useRef, useState} from 'react';
import {SearchForm} from '~/components/SearchForm';
import {Link} from '~/components/link';

const HERO_RESULT_LIMIT = 8;
const HERO_CAROUSEL_SCROLL = 320;
const HERO_MIN_SEARCH_CHARS = 2;

function formatPrice(price) {
  const priceNum = typeof price === 'number' ? price : Number(price);

  if (!Number.isFinite(priceNum)) return null;
  if (priceNum === 0) return 'Call for price';

  return `$${priceNum.toFixed(2)}`;
}

function withImageParams(url) {
  if (!url) return '';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=320&format=webp`;
}

function normalizeHeroProduct(product) {
  const primaryVariant = product?.variants?.nodes?.[0];
  const variantImage = primaryVariant?.image?.url;
  const galleryImage = product?.images?.nodes?.[0]?.url;

  return {
    id: product?.id,
    title: product?.title,
    handle: product?.handle,
    vendor: product?.vendor || 'New arrival',
    image: variantImage || galleryImage || product?.image || '',
    price: primaryVariant?.price?.amount ?? product?.price,
  };
}

function HeroResultCard({product}) {
  const normalizedProduct = normalizeHeroProduct(product);
  const price = formatPrice(normalizedProduct.price);

  return (
    <Link
      className="hero-result-card"
      to={`/products/${normalizedProduct.handle}`}
    >
      <div className="hero-result-card__image-wrap">
        {normalizedProduct.image ? (
          <img
            alt={normalizedProduct.title}
            className="hero-result-card__image"
            loading="lazy"
            src={withImageParams(normalizedProduct.image)}
          />
        ) : (
          <div className="hero-result-card__image hero-result-card__image--empty" />
        )}
      </div>

      <div className="hero-result-card__body">
        <p className="hero-result-card__vendor">{normalizedProduct.vendor}</p>
        <h3 className="hero-result-card__title">{normalizedProduct.title}</h3>
        {price ? <p className="hero-result-card__price">{price}</p> : null}
      </div>
    </Link>
  );
}

function HeroResultSkeleton() {
  return (
    <div className="hero-result-card hero-result-card--skeleton">
      <div className="hero-result-card__image-wrap">
        <div className="hero-result-card__image hero-result-card__image--empty" />
      </div>
      <div className="hero-result-card__body">
        <div className="hero-result-card__line hero-result-card__line--sm" />
        <div className="hero-result-card__line" />
        <div className="hero-result-card__line hero-result-card__line--lg" />
      </div>
    </div>
  );
}

export default function MosaicHero({newArrivalsProducts = []}) {
  const fetcher = useFetcher();
  const carouselRef = useRef(null);
  const debounceRef = useRef(null);
  const lastRequestedTermRef = useRef('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResultsFade, setShowResultsFade] = useState(false);
  const trimmedSearchTerm = searchTerm.trim();
  const fetchedQuery = String(fetcher.data?.query || '').trim();
  const canFetchResults = trimmedSearchTerm.length >= HERO_MIN_SEARCH_CHARS;
  const isLoading =
    canFetchResults &&
    (fetcher.state !== 'idle' || fetchedQuery !== trimmedSearchTerm);
  const hits =
    fetchedQuery === trimmedSearchTerm ? fetcher.data?.hits || [] : [];
  const fallbackProducts = newArrivalsProducts.slice(0, HERO_RESULT_LIMIT);
  const showingFallbackProducts =
    !canFetchResults || (!isLoading && hits.length === 0);
  const displayedProducts =
    !showingFallbackProducts && hits.length > 0 ? hits : fallbackProducts;
  const viewAllLink = showingFallbackProducts
    ? '/collections/new-arrivals'
    : `/search?q=${encodeURIComponent(trimmedSearchTerm)}`;

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) {
      setShowResultsFade(false);
      return undefined;
    }

    const updateTrackFade = () => {
      const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
      const isOverflowing = maxScrollLeft > 4;
      const isAtEnd = carousel.scrollLeft >= maxScrollLeft - 4;

      setShowResultsFade(isOverflowing && !isAtEnd);
    };

    updateTrackFade();
    carousel.addEventListener('scroll', updateTrackFade, {passive: true});
    window.addEventListener('resize', updateTrackFade);

    return () => {
      carousel.removeEventListener('scroll', updateTrackFade);
      window.removeEventListener('resize', updateTrackFade);
    };
  }, [displayedProducts.length, isLoading, trimmedSearchTerm]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    const trimmedValue = value.trim();

    setSearchTerm(value);

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (trimmedValue.length < HERO_MIN_SEARCH_CHARS) {
      lastRequestedTermRef.current = '';
      return;
    }

    if (trimmedValue === lastRequestedTermRef.current) {
      return;
    }

    debounceRef.current = window.setTimeout(() => {
      lastRequestedTermRef.current = trimmedValue;
      fetcher.load(
        `/search?q=${encodeURIComponent(trimmedValue)}&limit=${HERO_RESULT_LIMIT}`,
      );
    }, 220);
  };

  const handleSearchSubmit = (event) => {
    const formData = new FormData(event.currentTarget);
    const submittedQuery = String(formData.get('q') || '').trim();

    if (!submittedQuery) {
      event.preventDefault();
    }
  };

  const scrollCarousel = (direction) => {
    carouselRef.current?.scrollBy({
      left: direction * HERO_CAROUSEL_SCROLL,
      behavior: 'smooth',
    });
  };

  const resultsTrackShellClassName = showResultsFade
    ? 'hero-results__track-shell hero-results__track-shell--fade'
    : 'hero-results__track-shell';

  return (
    <section className="mosaic-hero" aria-label="Homepage hero">
      <div className="hero-shell">
        <div className="hero-frame">
          <div className="hero-copy">
            <h2 className="hero-title">
              Find the device, setup, or upgrade that fits faster.
            </h2>

            <p className="hero-lede">
              Search directly to find what you need, or browse the latest
              arrivals below.
            </p>

            <SearchForm
              method="get"
              action="/search"
              className="hero-search-form"
              onSubmit={handleSearchSubmit}
            >
              {({inputRef}) => (
                <>
                  <label
                    className="visually-hidden"
                    htmlFor="hero-search-input"
                  >
                    Search products
                  </label>
                  <input
                    id="hero-search-input"
                    ref={inputRef}
                    type="search"
                    name="q"
                    className="hero-search-input"
                    placeholder="Search MacBook, PS5, Dyson, monitors..."
                    autoComplete="off"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                  <button type="submit" className="hero-search-submit">
                    Search
                  </button>
                </>
              )}
            </SearchForm>

            <div className="hero-results" aria-live="polite">
              <div className="hero-results__header">
                <p className="hero-results__label">
                  {canFetchResults && hits.length > 0
                    ? `Instant results for "${trimmedSearchTerm}"`
                    : canFetchResults && !isLoading
                    ? `No exact matches for "${trimmedSearchTerm}". Showing new arrivals.`
                    : 'New arrivals'}
                </p>

                {displayedProducts.length > 0 ? (
                  <div className="hero-results__controls">
                    <button
                      type="button"
                      className="hero-results__control"
                      onClick={() => scrollCarousel(-1)}
                      aria-label="Scroll results left"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="hero-results__control"
                      onClick={() => scrollCarousel(1)}
                      aria-label="Scroll results right"
                    >
                      →
                    </button>
                  </div>
                ) : null}
              </div>

              {isLoading ? (
                <div className={resultsTrackShellClassName}>
                  <div className="hero-results__track" ref={carouselRef}>
                    {Array.from({length: 3}, (_, index) => (
                      <HeroResultSkeleton key={index} />
                    ))}
                  </div>
                </div>
              ) : displayedProducts.length > 0 ? (
                <div className={resultsTrackShellClassName}>
                  <div className="hero-results__track" ref={carouselRef}>
                    {displayedProducts.map((product) => (
                      <HeroResultCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="hero-results__empty">
                  No products are available to preview right now.
                </div>
              )}

              <div className="hero-results__footer">
                {displayedProducts.length > 0 && !isLoading ? (
                  <Link className="hero-results__view-all" to={viewAllLink}>
                    View all results
                  </Link>
                ) : (
                  <span
                    className="hero-results__view-all hero-results__view-all--placeholder"
                    aria-hidden="true"
                  >
                    View all results
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <Link
              className="hero-video-link"
              to="/products/sony-hyperpop-dualsense-ps5-wireless-controller"
              aria-label="View the Sony Hyperpop DualSense PS5 Wireless Controller"
            >
              <div className="hero-video-shell">
                <video
                  className="hero-video"
                  src="https://cdn.shopify.com/videos/c/o/v/83a0ee7948374771a51f1e08cb162add.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="Hero showcase video"
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
