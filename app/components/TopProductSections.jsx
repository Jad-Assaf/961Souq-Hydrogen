// NewArrivals.jsx
import React, {useState, useMemo} from 'react';
import {Link} from 'react-router-dom';
import {ProductRow} from './CollectionDisplay';

export const TopProductSections = ({collection}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    const products = collection?.products?.nodes || [];
    const normalized = searchTerm.toLowerCase().trim();
    const tokens = normalized ? normalized.split(/\s+/).filter(Boolean) : [];

    if (!tokens.length) return products; // empty search → show all

    return products.filter((product) => {
      if (!product) return false;

      const title = product.title?.toLowerCase() || '';
      const handle = product.handle?.toLowerCase() || '';
      const variantTitle =
        product.variants?.nodes?.[0]?.title?.toLowerCase() || '';

      const haystack = `${title} ${handle} ${variantTitle}`;

      // all tokens must appear somewhere, in any order
      return tokens.every((token) => haystack.includes(token));
    });
  }, [collection, searchTerm]);

  return (
    <div className="collection-section">
      <div className="collection-header">
        <p className="home-colleciton-title">{collection.title}</p>

        <div className="collection-header-right">
          {/* Search in this collection */}
          {/* <div className="collection-search-wrap">
            <span className="collection-search-icon">🔍</span>
            <input
              type="search"
              className="collection-search-input"
              placeholder="Search in this collection"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                // Avoid global key listeners swallowing space, etc.
                e.stopPropagation();
              }}
            />
          </div> */}

          <Link
            to={`/collections/${collection.handle}`}
            className="view-all-link"
          >
            View All
          </Link>
        </div>
      </div>

      <ProductRow products={filteredProducts} showFreeShippingTags />
    </div>
  );
};
