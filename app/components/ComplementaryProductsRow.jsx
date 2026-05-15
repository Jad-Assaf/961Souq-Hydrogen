import React, {useCallback, useEffect, useRef, useState} from 'react';
import RelatedProductsRow from './RelatedProducts';
import {getComplementaryCategoryOptions} from '~/lib/complementaryCategories';

const MAX_PRODUCTS = 100;
const SKELETON_CARD_COUNT = 8;

export default function ComplementaryProductsRow({
  initialProducts = [],
  initialPageInfo = null,
  initialFetchedCount = initialProducts.length,
  productHandle,
  sourceProduct,
  title = 'Pair it with',
}) {
  const categories = getComplementaryCategoryOptions(sourceProduct);
  const [products, setProducts] = useState(initialProducts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const fetchedCountRef = useRef(initialFetchedCount);
  const requestIdRef = useRef(0);
  const autoOpenedCategoryRef = useRef(null);

  useEffect(() => {
    console.info('[complementary][client] reset', {
      productHandle,
      initialProductsCount: initialProducts.length,
      initialFetchedCount,
      initialHasNextPage: initialPageInfo?.hasNextPage,
      initialTitles: initialProducts.map((product) => product.title),
    });

    setProducts(initialProducts);
    setPageInfo(initialPageInfo);
    setActiveCategory(null);
    fetchedCountRef.current = initialFetchedCount;
    requestIdRef.current += 1;
    autoOpenedCategoryRef.current = null;
  }, [initialProducts, initialPageInfo, initialFetchedCount, productHandle]);

  const loadMore = useCallback(async ({
    categoryKey = activeCategory,
    pageInfoOverride = pageInfo,
    replace = false,
  } = {}) => {
    if (!productHandle || !categoryKey || (isLoadingMore && !replace)) {
      console.info('[complementary][client] skip-load', {
        productHandle,
        categoryKey,
        reason: !productHandle
          ? 'missing-handle'
          : !categoryKey
          ? 'missing-category'
          : 'already-loading',
      });
      return;
    }

    if (pageInfoOverride && !pageInfoOverride.hasNextPage) {
      console.info('[complementary][client] skip-load', {
        productHandle,
        categoryKey,
        reason: 'no-next-page',
        fetchedCount: fetchedCountRef.current,
      });
      return;
    }

    if (!replace && products.length >= MAX_PRODUCTS) {
      console.info('[complementary][client] skip-load', {
        productHandle,
        categoryKey,
        reason: 'max-products-reached',
        displayedCount: products.length,
        fetchedCount: fetchedCountRef.current,
      });
      return;
    }

    setIsLoadingMore(true);
    const requestId = replace ? requestIdRef.current + 1 : requestIdRef.current;
    if (replace) requestIdRef.current = requestId;

    try {
      const params = new URLSearchParams({
        handle: productHandle,
        limit: '20',
        category: categoryKey,
      });

      if (pageInfoOverride?.endCursor) {
        params.set('cursor', pageInfoOverride.endCursor);
      }

      if (typeof pageInfoOverride?.queryIndex === 'number') {
        params.set('queryIndex', String(pageInfoOverride.queryIndex));
      }

      console.info('[complementary][client] fetch-start', {
        productHandle,
        categoryKey,
        cursor: pageInfoOverride?.endCursor || null,
        queryIndex: pageInfoOverride?.queryIndex || 0,
        displayedCount: replace ? 0 : products.length,
        fetchedCount: fetchedCountRef.current,
      });

      const response = await fetch(`/api/complementary-products?${params}`, {
        headers: {accept: 'application/json'},
      });
      const data = await response.json().catch(() => ({}));
      const nextProducts = Array.isArray(data?.products) ? data.products : [];

      if (requestId !== requestIdRef.current) {
        console.info('[complementary][client] ignore-stale-result', {
          productHandle,
          categoryKey,
          requestId,
          activeRequestId: requestIdRef.current,
        });
        return;
      }

      fetchedCountRef.current += Number(data?.fetchedCount || 0);

      console.info('[complementary][client] fetch-result', {
        productHandle,
        categoryKey,
        status: response.status,
        ok: response.ok,
        fetchedCountFromApi: data?.fetchedCount,
        nextProductsCount: nextProducts.length,
        nextTitles: nextProducts.map((product) => product.title),
        nextPageInfo: data?.pageInfo || null,
        error: data?.error,
      });

      setProducts((currentProducts) => {
        const baseProducts = replace ? [] : currentProducts;
        const existingIds = new Set(
          baseProducts.map((product) => product.id),
        );
        const merged = baseProducts.slice();

        for (const product of nextProducts) {
          if (!product?.id || existingIds.has(product.id)) continue;
          existingIds.add(product.id);
          merged.push(product);
        }

        return merged.slice(0, MAX_PRODUCTS);
      });
      setPageInfo(data?.pageInfo || null);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      console.error('[complementary][client] fetch-error', {
        productHandle,
        message: error?.message,
      });
      setPageInfo(null);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [activeCategory, isLoadingMore, pageInfo, productHandle, products.length]);

  const handleCategoryClick = useCallback(
    (categoryKey) => {
      const resetPageInfo = {
        hasNextPage: true,
        endCursor: null,
        queryIndex: 0,
      };

      setActiveCategory(categoryKey);
      setProducts([]);
      setPageInfo(resetPageInfo);
      fetchedCountRef.current = 0;
      loadMore({
        categoryKey,
        pageInfoOverride: resetPageInfo,
        replace: true,
      });
    },
    [loadMore],
  );

  useEffect(() => {
    const firstCategory = categories[0]?.key;
    if (!firstCategory || autoOpenedCategoryRef.current === firstCategory) {
      return;
    }

    autoOpenedCategoryRef.current = firstCategory;
    handleCategoryClick(firstCategory);
  }, [categories, handleCategoryClick]);

  const closeActiveCategory = useCallback(() => {
    requestIdRef.current += 1;
    setActiveCategory(null);
    setProducts([]);
    setPageInfo(null);
    setIsLoadingMore(false);
    fetchedCountRef.current = 0;
  }, []);

  if (!categories.length) return null;

  return (
    <div className="collection-section complementary-products-section">
      <h2>{title}</h2>
      <div className="complementary-category-buttons" aria-label={title}>
        {categories.map((category) => (
          <button
            className={[
              'complementary-category-button',
              activeCategory === category.key ? 'active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={isLoadingMore && activeCategory === category.key}
            key={category.key}
            onClick={() => handleCategoryClick(category.key)}
            type="button"
          >
            {category.label}
          </button>
        ))}
      </div>

      {isLoadingMore && !products.length ? (
        <div className="collection-products-row complementary-products-loading-row">
          {Array.from({length: SKELETON_CARD_COUNT}, (_, index) => (
            <div
              className="product-item complementary-products-skeleton-item"
              key={index}
              aria-hidden="true"
            >
              <div className="product-card complementary-products-skeleton-card">
                <div className="complementary-products-skeleton-image" />
                <div className="complementary-products-skeleton-line" />
                <div className="complementary-products-skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {products.length ? (
        <RelatedProductsRow
          products={products}
          title={null}
          hasMore={
            Boolean(pageInfo?.hasNextPage) && products.length < MAX_PRODUCTS
          }
          isLoadingMore={isLoadingMore}
          onAddToCart={closeActiveCategory}
          onNeedMore={() => loadMore()}
          showAddToCart
        />
      ) : null}
    </div>
  );
}
