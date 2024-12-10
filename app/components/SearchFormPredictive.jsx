import {useFetcher, useNavigate} from '@remix-run/react';
import React, {useRef, useEffect} from 'react';
import {useAside} from './Aside';

export const SEARCH_ENDPOINT = '/search';

/**
 *  Search form component that sends search requests to the `/search` route
 * @param {SearchFormPredictiveProps}
 */
export function SearchFormPredictive({
  children,
  className = 'predictive-search-form',
  ...props
}) {
  const fetcher = useFetcher({ key: 'search' }); // Fetcher for handling form submissions
  const inputRef = useRef(null); // Reference to the search input field
  const navigate = useNavigate(); // Navigation hook for programmatic redirects
  const aside = useAside(); // Custom hook for managing search aside visibility

  /** Reset the input value and blur the input */
  function resetInput(event) {
    if (inputRef.current) {
      inputRef.current.blur();
      inputRef.current.value = ''; // Clear the search input
    }
  }

  /** Navigate to the search page with the current input value */
  function goToSearch() {
    const term = inputRef?.current?.value; // Get the current value from the input field
    navigate(SEARCH_ENDPOINT + (term ? `?q=${term}` : '')); // Redirect to the search page
    resetInput(); // Clear and blur the input
    aside.close(); // Close the predictive search aside
  }

  /** Fetch search results based on the input value */
  function fetchResults(event) {
    fetcher.submit(
      { q: event.target.value || '', predictive: true }, // Pass query and predictive flag
      { method: 'GET', action: '/search' } // Reuse the search page loader
    );
  }

  // Ensure the input field has a type of "search"
  useEffect(() => {
    inputRef?.current?.setAttribute('type', 'search');
  }, []);

  if (typeof children !== 'function') {
    return null; // If no children function is provided, render nothing
  }

  return (
    <fetcher.Form {...props} className={className} onSubmit={resetInput}>
      {children({ inputRef, fetcher, fetchResults, goToSearch })}
    </fetcher.Form>
  );
}

/**
 * @typedef {(args: {
 *   fetchResults: (event: React.ChangeEvent<HTMLInputElement>) => void;
 *   goToSearch: () => void;
 *   inputRef: React.MutableRefObject<HTMLInputElement | null>;
 *   fetcher: Fetcher<PredictiveSearchReturn>;
 * }) => React.ReactNode} SearchFormPredictiveChildren
 */
/**
 * @typedef {Omit<FormProps, 'children'> & {
 *   children: SearchFormPredictiveChildren | null;
 * }} SearchFormPredictiveProps
 */

/** @typedef {import('@remix-run/react').FormProps} FormProps */
/** @template T @typedef {import('@remix-run/react').Fetcher<T>} Fetcher */
/** @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn */
