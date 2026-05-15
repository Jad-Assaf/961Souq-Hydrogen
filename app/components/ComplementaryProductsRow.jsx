import React, {useCallback, useEffect, useRef, useState} from 'react';
import RelatedProductsRow from './RelatedProducts';

const MAX_PRODUCTS = 100;
const SKELETON_CARD_COUNT = 8;

export default function ComplementaryProductsRow({
  initialProducts = [],
  initialPageInfo = null,
  initialFetchedCount = initialProducts.length,
  productHandle,
  title = 'Pair it with',
}) {
  const [products, setProducts] = useState(initialProducts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const fetchedCountRef = useRef(initialFetchedCount);
  const requestedInitialFetchRef = useRef(false);

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
    fetchedCountRef.current = initialFetchedCount;
    requestedInitialFetchRef.current = false;
  }, [initialProducts, initialPageInfo, initialFetchedCount, productHandle]);

  const loadMore = useCallback(async () => {
    if (!productHandle || isLoadingMore) {
      console.info('[complementary][client] skip-load', {
        productHandle,
        reason: !productHandle ? 'missing-handle' : 'already-loading',
      });
      return;
    }

    if (pageInfo && !pageInfo.hasNextPage) {
      console.info('[complementary][client] skip-load', {
        productHandle,
        reason: 'no-next-page',
        fetchedCount: fetchedCountRef.current,
      });
      return;
    }

    if (fetchedCountRef.current >= MAX_PRODUCTS) {
      console.info('[complementary][client] skip-load', {
        productHandle,
        reason: 'max-products-reached',
        fetchedCount: fetchedCountRef.current,
      });
      return;
    }

    setIsLoadingMore(true);

    try {
      const params = new URLSearchParams({
        handle: productHandle,
        limit: '20',
      });

      if (pageInfo?.endCursor) {
        params.set('cursor', pageInfo.endCursor);
      }

      if (typeof pageInfo?.queryIndex === 'number') {
        params.set('queryIndex', String(pageInfo.queryIndex));
      }

      console.info('[complementary][client] fetch-start', {
        productHandle,
        cursor: pageInfo?.endCursor || null,
        queryIndex: pageInfo?.queryIndex || 0,
        fetchedCount: fetchedCountRef.current,
      });

      const response = await fetch(`/api/complementary-products?${params}`, {
        headers: {accept: 'application/json'},
      });
      const data = await response.json().catch(() => ({}));
      const nextProducts = Array.isArray(data?.products) ? data.products : [];
      fetchedCountRef.current += Number(data?.fetchedCount || 0);

      console.info('[complementary][client] fetch-result', {
        productHandle,
        status: response.status,
        ok: response.ok,
        fetchedCountFromApi: data?.fetchedCount,
        nextProductsCount: nextProducts.length,
        nextTitles: nextProducts.map((product) => product.title),
        nextPageInfo: data?.pageInfo || null,
        error: data?.error,
      });

      setProducts((currentProducts) => {
        const existingIds = new Set(
          currentProducts.map((product) => product.id),
        );
        const merged = currentProducts.slice();

        for (const product of nextProducts) {
          if (!product?.id || existingIds.has(product.id)) continue;
          existingIds.add(product.id);
          merged.push(product);
        }

        return merged.slice(0, MAX_PRODUCTS);
      });
      setPageInfo(data?.pageInfo || null);
    } catch (error) {
      console.error('[complementary][client] fetch-error', {
        productHandle,
        message: error?.message,
      });
      setPageInfo(null);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, pageInfo, productHandle]);

  useEffect(() => {
    if (
      !products.length &&
      productHandle &&
      !requestedInitialFetchRef.current
    ) {
      console.info('[complementary][client] initial-empty-fetch', {
        productHandle,
      });
      requestedInitialFetchRef.current = true;
      loadMore();
    }
  }, [loadMore, productHandle, products.length]);

  if (!products.length) {
    return (
      <div className="collection-section complementary-products-loading">
        <h2>{title}</h2>
        <div className="collection-products-row">
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
      </div>
    );
  }

  return (
    <RelatedProductsRow
      products={products}
      title={title}
      hasMore={
        Boolean(pageInfo?.hasNextPage) && fetchedCountRef.current < MAX_PRODUCTS
      }
      isLoadingMore={isLoadingMore}
      onNeedMore={loadMore}
    />
  );
}
