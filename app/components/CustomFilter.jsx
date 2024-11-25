import React, { useState } from 'react';
import { useShopQuery, gql } from '@shopify/hydrogen';

export const FiltersAndSorting = ({ collectionHandle }) => {
    const [productType, setProductType] = useState('');
    const [vendor, setVendor] = useState('');
    const [sortKey, setSortKey] = useState('TITLE');
    const [reverse, setReverse] = useState(false);

    const { data, refetch } = useShopQuery({
        query: QUERY,
        variables: {
            handle: collectionHandle,
            filters: [
                productType && { productType },
                vendor && { productVendor: vendor },
            ].filter(Boolean), // Remove empty filters
            sortKey,
            reverse,
        },
    });

    const handleFilterChange = (e, filterType) => {
        if (filterType === 'productType') {
            setProductType(e.target.value);
        } else if (filterType === 'vendor') {
            setVendor(e.target.value);
        }
    };

    const handleSortChange = (e) => {
        setSortKey(e.target.value);
        setReverse(e.target.value === 'PRICE_DESC');
    };

    return (
        <div>
            {/* Filter Section */}
            <div>
                <h3>Filter by</h3>
                <div>
                    <label htmlFor="productType">Product Type:</label>
                    <input
                        id="productType"
                        type="text"
                        value={productType}
                        onChange={(e) => handleFilterChange(e, 'productType')}
                    />
                </div>
                <div>
                    <label htmlFor="vendor">Vendor:</label>
                    <input
                        id="vendor"
                        type="text"
                        value={vendor}
                        onChange={(e) => handleFilterChange(e, 'vendor')}
                    />
                </div>
            </div>

            {/* Sorting Section */}
            <div>
                <h3>Sort by</h3>
                <select onChange={handleSortChange} value={sortKey}>
                    <option value="TITLE">Title (A-Z)</option>
                    <option value="PRICE">Price (Low to High)</option>
                    <option value="PRICE_DESC">Price (High to Low)</option>
                </select>
            </div>

            {/* Products Section */}
            <div>
                <h3>Products</h3>
                {data?.collection?.products?.edges.map(({ node }) => (
                    <div key={node.id}>
                        <h4>{node.title}</h4>
                        <p>Vendor: {node.vendor}</p>
                        <p>Type: {node.productType}</p>
                        <p>
                            Price: {node.priceRange.minVariantPrice.amount}{' '}
                            {node.priceRange.minVariantPrice.currencyCode}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const QUERY = `
  query CollectionProducts($handle: String!, $filters: [ProductFilterInput!], $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
    collection(handle: $handle) {
      handle
      products(first: 20, filters: $filters, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
            id
            title
            vendor
            productType
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
`;
