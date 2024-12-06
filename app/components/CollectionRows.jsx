import React from 'react';
import { motion } from 'framer-motion';
import { ProductRow } from './CollectionDisplay';
import { Link } from '@remix-run/react';

const CollectionRows = ({ collections, menuCollections }) => {
    return (
        <>
            {collections.map((collection, index) => {
                const isMenuRow = index % 3 === 0; // Every 3 rows, display a menu
                const menuIndex = Math.floor(index / 3);
                const currentMenu = menuCollections[menuIndex]; // Fetch the corresponding menu

                return (
                    <React.Fragment key={collection.id}>
                        {/* Render the menu slider row */}
                        {isMenuRow && currentMenu && (
                            <div className="slider-row">
                                <div className="category-slider">
                                    {currentMenu.map((menuCollection) => (
                                        <Link
                                            key={menuCollection.id}
                                            to={`/collections/${menuCollection.handle}`}
                                            className="category-container"
                                        >
                                            {menuCollection.image && (
                                                <img
                                                    src={menuCollection.image.url}
                                                    alt={menuCollection.image.altText || menuCollection.title}
                                                    className="category-image"
                                                    width={150}
                                                    height={150}
                                                />
                                            )}
                                            <div className="category-title">{menuCollection.title}</div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Render the product row */}
                        <div className="collection-section">
                            <div className="collection-header">
                                <h3>{collection.title}</h3>
                                <Link to={`/collections/${collection.handle}`} className="view-all-link">
                                    View All
                                </Link>
                            </div>
                            <ProductRow products={collection.products.nodes} />
                        </div>
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default CollectionRows;
