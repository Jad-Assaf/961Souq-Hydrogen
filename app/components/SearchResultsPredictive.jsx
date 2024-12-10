import { Link, useFetcher } from '@remix-run/react';
import { Image, Money } from '@shopify/hydrogen';
import React, { useRef, useEffect } from 'react';
import { getEmptyPredictiveSearchResult } from '~/lib/search';
import { useAside } from './Aside';

/**
 * Component that renders predictive search results
 * @param {SearchResultsPredictiveProps}
 * @return {React.ReactNode}
 */
export function SearchResultsPredictive({ children }) {
  const aside = useAside();
  const { term, inputRef, fetcher, total, items } = usePredictiveSearch();

  /**
   * Utility that resets the search input
   */
  function resetInput() {
    if (inputRef.current) {
      inputRef.current.blur();
      inputRef.current.value = '';
    }
  }

  /**
   * Utility that resets the search input and closes the search aside
   */
  function closeSearch() {
    resetInput();
    aside.close();
  }

  return children({
    items,
    closeSearch,
    inputRef,
    state: fetcher.state,
    term,
    total,
  });
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

/**
 * @param {PartialPredictiveSearchResult<'products'>}
 */
function SearchResultsPredictiveProducts({ term, products, closeSearch }) {
  if (!products.length) return null;

  return (
    <div className="predictive-search-result" key="products">
      <h5>Products</h5>
      <ul>
        {products.map((product) => {
          const productUrl = `/products/${product.handle}`;

          const image = product?.variants?.nodes?.[0].image;
          return (
            <li className="predictive-search-result-item" key={product.id}>
              <Link to={productUrl} onClick={closeSearch}>
                {image && (
                  <Image
                    alt={image.altText ?? ''}
                    src={image.url}
                    width={50}
                    height={50}
                  />
                )}
                <div className="search-result-txt">
                  <div className="search-result-titDesc">
                    <p className="search-result-title">
                      {truncateText(product.title, 75)}
                    </p>
                    <p className="search-result-description">
                      {truncateText(product.description, 100)}
                    </p>
                  </div>
                  <small className="search-result-price">
                    {product?.variants?.nodes?.[0].price && (
                      <>
                        <Money data={product.variants.nodes[0].price} />
                        {product.variants.nodes[0].compareAtPrice && (
                          <span className="search-result-compare-price">
                            <Money
                              data={product.variants.nodes[0].compareAtPrice}
                            />
                          </span>
                        )}
                      </>
                    )}
                  </small>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Hook that returns the predictive search results and fetcher and input ref.
 * @example
 * '''ts
 * const { items, total, inputRef, term, fetcher } = usePredictiveSearch();
 * '''
 * @return {UsePredictiveSearchReturn}
 */
function usePredictiveSearch() {
  const fetcher = useFetcher({ key: 'search' });
  const term = useRef('');
  const inputRef = useRef(null);

  if (fetcher?.state === 'loading') {
    term.current = String(fetcher.formData?.get('q') || '');
  }

  // capture the search input element as a ref
  useEffect(() => {
    if (!inputRef.current) {
      inputRef.current = document.querySelector('input[type="search"]');
    }
  }, []);

  const { items, total } =
    fetcher?.data?.result ?? getEmptyPredictiveSearchResult();

  return { items, total, inputRef, term, fetcher };
}

/**
 * Utility Types
 * @typedef {PredictiveSearchReturn['result']['items']} PredictiveSearchItems
 * @typedef {{
 *   term: React.MutableRefObject<string>;
 *   total: number;
 *   inputRef: React.MutableRefObject<HTMLInputElement | null>;
 *   items: PredictiveSearchItems;
 *   fetcher: Fetcher<PredictiveSearchReturn>;
 * }} UsePredictiveSearchReturn
 * @typedef {Pick<
 *   UsePredictiveSearchReturn,
 *   'term' | 'total' | 'inputRef' | 'items'
 * > & {
 *   state: Fetcher['state'];
 *   closeSearch: () => void;
 * }} SearchResultsPredictiveArgs
 * @typedef {Pick<PredictiveSearchItems, ItemType> &
 *   Pick<SearchResultsPredictiveArgs, ExtraProps>} PartialPredictiveSearchResult
 * @template {keyof PredictiveSearchItems} ItemType
 * @template {keyof SearchResultsPredictiveArgs} [ExtraProps='term' | 'closeSearch']
 * @typedef {{
 *   children: (args: SearchResultsPredictiveArgs) => React.ReactNode;
 * }} SearchResultsPredictiveProps
 */

/** @template T @typedef {import('@remix-run/react').Fetcher<T>} Fetcher */
/** @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn */
