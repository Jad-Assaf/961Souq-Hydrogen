import { useLoaderData, useSearchParams } from '@remix-run/react';
import React, { useState, useEffect } from 'react';

/**
 * @type {LoaderFunction}
 */
export async function loader({ context, request }) {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Extract filter values from the URL
    const filters = {
        productType: searchParams.get('productType'),
        productVendor: searchParams.get('productVendor'),
        price: searchParams.get('minPrice') || searchParams.get('maxPrice')
            ? {
                min: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')) : undefined,
                max: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')) : undefined,
            }
            : undefined,
        available: searchParams.get('available') === 'true',
    };

    const variables = {
        filters: Object.keys(filters)
            .filter((key) => filters[key] !== undefined && filters[key] !== '')
            .map((key) => ({ [key]: filters[key] })),
        first: 20, // Adjust the pagination as necessary
    };

    const query = `
    query GetFilteredProducts($filters: [ProductFilter!], $first: Int) {
      search(query: "", first: $first, types: [PRODUCT], productFilters: $filters) {
        edges {
          node {
            ... on Product {
              id
              title
              vendor
              productType
              variants(first: 1) {
                edges {
                  node {
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

    const { search } = await context.storefront.query(query, { variables });

    return {
        products: search.edges || [],
    };
}

/**
 * React Component for Filters and Products
 */
export default function FilterWithProducts() {
    const { products } = useLoaderData();
    const [searchParams, setSearchParams] = useSearchParams();

    const handleFilterChange = (key, value) => {
        const newParams = new URLSearchParams(searchParams);

        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }

        setSearchParams(newParams);
    };

    return (
        <div className="filter-with-products">
            {/* Filters */}
            <div className="filters">
                <h3>Filters</h3>

                {/* Product Type */}
                <div className="filter-group">
                    <label>
                        Product Type:
                        <input
                            type="text"
                            value={searchParams.get('productType') || ''}
                            onChange={(e) => handleFilterChange('productType', e.target.value)}
                            placeholder="e.g., Shoes"
                        />
                    </label>
                </div>

                {/* Product Vendor */}
                <div className="filter-group">
                    <label>
                        Product Vendor:
                        <input
                            type="text"
                            value={searchParams.get('productVendor') || ''}
                            onChange={(e) => handleFilterChange('productVendor', e.target.value)}
                            placeholder="e.g., Nike"
                        />
                    </label>
                </div>

                {/* Price Range */}
                <div className="filter-group">
                    <label>
                        Min Price:
                        <input
                            type="number"
                            value={searchParams.get('minPrice') || ''}
                            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                            placeholder="e.g., 10"
                        />
                    </label>
                    <label>
                        Max Price:
                        <input
                            type="number"
                            value={searchParams.get('maxPrice') || ''}
                            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                            placeholder="e.g., 100"
                        />
                    </label>
                </div>

                {/* Availability */}
                <div className="filter-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={searchParams.get('available') === 'true'}
                            onChange={(e) => handleFilterChange('available', e.target.checked ? 'true' : '')}
                        />
                        Available Only
                    </label>
                </div>
            </div>

            {/* Products */}
            <div className="products">
                <h3>Products</h3>
                {products.length ? (
                    products.map(({ node: product }) => (
                        <div key={product.id} className="product">
                            <h4>{product.title}</h4>
                            <p>Vendor: {product.vendor}</p>
                            <p>Type: {product.productType}</p>
                            <p>
                                Price: $
                                {product.variants.edges[0]?.node.price.amount || 'N/A'}
                            </p>
                            <p>
                                Available: {product.variants.edges[0]?.node.availableForSale ? 'Yes' : 'No'}
                            </p>
                        </div>
                    ))
                ) : (
                    <p>No products found.</p>
                )}
            </div>
        </div>
    );
}
