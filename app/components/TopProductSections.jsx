// NewArrivals.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ProductRow } from './CollectionDisplay';

export const TopProductSections = ({ collection }) => {
    return (
        <><div className="collection-section">
            <div className="collection-header">
                <h3>New Arrivals</h3>
                <Link to="/collections/new-arrivals" className="view-all-link">
                    View All
                </Link>
            </div>
            <ProductRow products={collection.products.nodes} />
        </div><div className="collection-section">
                <div className="collection-header">
                    <h3>Laptops</h3>
                    <Link to="/collections/laptops" className="view-all-link">
                        View All
                    </Link>
                </div>
                <ProductRow products={collection.products.nodes} />
            </div></>
    );
};