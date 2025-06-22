import React, { createContext, useContext, useState, useCallback } from 'react';
import { algoliasearch } from 'algoliasearch';

const searchClient = algoliasearch(
  'J1G0XS6JMY',
  'd79ceb9a07d6afa035dfda887d8f2f93',
);

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const performSearch = useCallback(async (query) => {
    // Only run search on client side
    if (typeof window === 'undefined') {
      return;
    }

    if (!query.trim()) {
      setSearchResults([]);
      setCurrentQuery('');
      return;
    }

    // Update currentQuery immediately when typing starts
    // This makes the search page show the new query right away
    setCurrentQuery(query.trim());

    // Don't search if it's the same query and we already have results
    if (currentQuery === query.trim() && searchResults.length > 0) {
      return;
    }

    // Immediately clear results and set loading when query changes
    setSearchResults([]);
    setIsLoading(true);

    try {
      // Use the search method directly on searchClient
      const response = await searchClient.search([
        {
          indexName: 'shopify_products',
          query: query.trim(),
          params: {
            hitsPerPage: 3000,
          },
        },
      ]);
      
      // Handle the response properly
      if (response && response.results && response.results[0]) {
        setSearchResults(response.results[0].hits || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentQuery, searchResults.length]);

  const setInitialQuery = useCallback((query) => {
    // Only run search on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (query.trim() && query.trim() !== currentQuery) {
      performSearch(query.trim());
    }
  }, [currentQuery, performSearch]);

  const value = {
    searchResults,
    isLoading,
    currentQuery,
    searchInput,
    setSearchInput,
    performSearch,
    setInitialQuery,
    searchClient,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
} 